// Medeo — сервер и база данных на C++17 (без внешних библиотек).
//
// Что делает:
//   • раздаёт сайт (index.html, cabinet.html, css, js, img);
//   • хранит данные в собственной базе: data/medeo.json (таблицы users, doctors, appts);
//   • проверяет целостность: уникальный email, одно время у врача — одна запись, внешние ключи;
//   • хранит пароли только как PBKDF2-SHA256 (120 000 итераций);
//   • при регистрации печатает код подтверждения в терминале.
//
// Сборка и запуск:
//   ./run.sh            (или:  g++ -O2 -std=c++17 -pthread server.cpp -o medeo && ./medeo)
//   сайт: http://localhost:5180

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <unistd.h>
#include <signal.h>
#include <climits>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <fstream>
#include <iostream>
#include <map>
#include <mutex>
#include <random>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

using std::string;
using std::vector;

static const int PORT = 5180;
static const double CODE_TTL = 10 * 60;
static const int CODE_TRIES = 5;
static const int PBKDF2_ITERS = 120000;
static string ROOT;

// ====================================================================== SHA-256
struct Sha256 {
    uint32_t h[8];
    uint8_t buf[64];
    uint64_t total = 0;
    size_t blen = 0;
    Sha256() { reset(); }
    void reset() {
        static const uint32_t i0[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
        memcpy(h, i0, sizeof h);
        total = 0;
        blen = 0;
    }
    static uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }
    void block(const uint8_t* p) {
        static const uint32_t K[64] = {
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
            0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
            0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
            0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
            0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};
        uint32_t w[64];
        for (int i = 0; i < 16; i++) w[i] = (uint32_t)p[i * 4] << 24 | (uint32_t)p[i * 4 + 1] << 16 | (uint32_t)p[i * 4 + 2] << 8 | p[i * 4 + 3];
        for (int i = 16; i < 64; i++) {
            uint32_t s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
            uint32_t s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16] + s0 + w[i - 7] + s1;
        }
        uint32_t a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for (int i = 0; i < 64; i++) {
            uint32_t S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
            uint32_t t1 = hh + S1 + ch + K[i] + w[i];
            uint32_t S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c);
            uint32_t t2 = S0 + mj;
            hh = g; g = f; f = e; e = d + t1; d = c; c = b; b = a; a = t1 + t2;
        }
        h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    void update(const uint8_t* p, size_t n) {
        total += n;
        while (n) {
            size_t k = std::min(n, 64 - blen);
            memcpy(buf + blen, p, k);
            blen += k; p += k; n -= k;
            if (blen == 64) { block(buf); blen = 0; }
        }
    }
    void final(uint8_t out[32]) {
        uint64_t bits = total * 8;
        uint8_t pad = 0x80;
        update(&pad, 1);
        uint8_t z = 0;
        while (blen != 56) update(&z, 1);
        uint8_t l[8];
        for (int i = 0; i < 8; i++) l[i] = (uint8_t)(bits >> (56 - 8 * i));
        update(l, 8);
        for (int i = 0; i < 8; i++) { out[i * 4] = h[i] >> 24; out[i * 4 + 1] = h[i] >> 16; out[i * 4 + 2] = h[i] >> 8; out[i * 4 + 3] = h[i]; }
    }
};

static string hex(const uint8_t* p, size_t n) {
    static const char* d = "0123456789abcdef";
    string s;
    for (size_t i = 0; i < n; i++) { s += d[p[i] >> 4]; s += d[p[i] & 15]; }
    return s;
}
static string sha256hex(const string& s) {
    Sha256 c; uint8_t o[32];
    c.update((const uint8_t*)s.data(), s.size());
    c.final(o);
    return hex(o, 32);
}
// PBKDF2-HMAC-SHA256, один блок (32 байта) — как hashlib.pbkdf2_hmac в Python
static string pbkdf2(const string& pw, const string& salt, int iters) {
    uint8_t k[64] = {0};
    if (pw.size() > 64) { Sha256 t; t.update((const uint8_t*)pw.data(), pw.size()); t.final(k); }
    else memcpy(k, pw.data(), pw.size());
    uint8_t ip[64], op[64];
    for (int i = 0; i < 64; i++) { ip[i] = k[i] ^ 0x36; op[i] = k[i] ^ 0x5c; }
    Sha256 in0, out0;
    in0.update(ip, 64);
    out0.update(op, 64);
    auto hmac = [&](const uint8_t* m, size_t n, uint8_t o[32]) {
        Sha256 a = in0; uint8_t t[32];
        a.update(m, n); a.final(t);
        Sha256 b = out0; b.update(t, 32); b.final(o);
    };
    string s = salt; s.append("\0\0\0\1", 4);
    uint8_t u[32], res[32];
    hmac((const uint8_t*)s.data(), s.size(), u);
    memcpy(res, u, 32);
    for (int i = 1; i < iters; i++) {
        uint8_t n[32];
        hmac(u, 32, n);
        memcpy(u, n, 32);
        for (int j = 0; j < 32; j++) res[j] ^= u[j];
    }
    return hex(res, 32);
}
static bool consteq(const string& a, const string& b) {
    if (a.size() != b.size()) return false;
    unsigned char d = 0;
    for (size_t i = 0; i < a.size(); i++) d |= (unsigned char)(a[i] ^ b[i]);
    return d == 0;
}
static string rand_hex(int bytes) {
    std::random_device rd;
    uint8_t b[32];
    for (int i = 0; i < bytes; i++) b[i] = (uint8_t)rd();
    return hex(b, bytes);
}
static string hash_pw(const string& pw) {
    string salt = rand_hex(8);
    return "pbkdf2$" + salt + "$" + pbkdf2(pw, salt, PBKDF2_ITERS);
}
static bool check_pw(const string& pw, const string& stored) {
    size_t a = stored.find('$'), b = a == string::npos ? a : stored.find('$', a + 1);
    if (a == string::npos || b == string::npos) return false;
    string salt = stored.substr(a + 1, b - a - 1), h = stored.substr(b + 1);
    return consteq(pbkdf2(pw, salt, PBKDF2_ITERS), h);
}

// ====================================================================== JSON
struct J;
typedef vector<J> JA;
typedef vector<std::pair<string, J>> JO;
struct J {
    enum T { Null, Bool, Num, Str, Arr, Obj } t = Null;
    bool b = false;
    string s;  // строка или «сырое» число
    JA a;
    JO o;
    static J str(const string& v) { J j; j.t = Str; j.s = v; return j; }
    static J boolean(bool v) { J j; j.t = Bool; j.b = v; return j; }
    static J num(const string& v) { J j; j.t = Num; j.s = v; return j; }
    static J object() { J j; j.t = Obj; return j; }
    static J array() { J j; j.t = Arr; return j; }
    const J* get(const string& k) const {
        for (auto& p : o) if (p.first == k) return &p.second;
        return nullptr;
    }
    void set(const string& k, const J& v) {
        for (auto& p : o) if (p.first == k) { p.second = v; return; }
        o.emplace_back(k, v);
    }
    void erase(const string& k) {
        for (size_t i = 0; i < o.size(); i++) if (o[i].first == k) { o.erase(o.begin() + i); return; }
    }
    string sval(const string& k, const string& d = "") const {
        const J* v = get(k);
        return v && v->t == Str ? v->s : d;
    }
    bool has(const string& k) const {  // есть и не пусто (как truthy в Python)
        const J* v = get(k);
        if (!v) return false;
        switch (v->t) {
            case Null: return false;
            case Bool: return v->b;
            case Num: return v->s != "0" && v->s != "0.0";
            case Str: return !v->s.empty();
            case Arr: return !v->a.empty();
            case Obj: return !v->o.empty();
        }
        return false;
    }
};

struct Parser {
    const string& s;
    size_t i = 0;
    explicit Parser(const string& x) : s(x) {}
    [[noreturn]] void fail() { throw std::runtime_error("bad json"); }
    void ws() { while (i < s.size() && (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t')) i++; }
    static void utf8(string& o, unsigned c) {
        if (c < 0x80) o += (char)c;
        else if (c < 0x800) { o += (char)(0xC0 | c >> 6); o += (char)(0x80 | (c & 63)); }
        else if (c < 0x10000) { o += (char)(0xE0 | c >> 12); o += (char)(0x80 | ((c >> 6) & 63)); o += (char)(0x80 | (c & 63)); }
        else { o += (char)(0xF0 | c >> 18); o += (char)(0x80 | ((c >> 12) & 63)); o += (char)(0x80 | ((c >> 6) & 63)); o += (char)(0x80 | (c & 63)); }
    }
    unsigned hex4() {
        if (i + 4 > s.size()) fail();
        unsigned v = 0;
        for (int k = 0; k < 4; k++) {
            char c = s[i++];
            v <<= 4;
            if (c >= '0' && c <= '9') v |= c - '0';
            else if (c >= 'a' && c <= 'f') v |= c - 'a' + 10;
            else if (c >= 'A' && c <= 'F') v |= c - 'A' + 10;
            else fail();
        }
        return v;
    }
    string str() {
        if (s[i] != '"') fail();
        i++;
        string o;
        while (true) {
            if (i >= s.size()) fail();
            char c = s[i++];
            if (c == '"') break;
            if (c != '\\') { o += c; continue; }
            if (i >= s.size()) fail();
            char e = s[i++];
            switch (e) {
                case 'n': o += '\n'; break;
                case 't': o += '\t'; break;
                case 'r': o += '\r'; break;
                case 'b': o += '\b'; break;
                case 'f': o += '\f'; break;
                case '/': o += '/'; break;
                case '\\': o += '\\'; break;
                case '"': o += '"'; break;
                case 'u': {
                    unsigned c1 = hex4();
                    if (c1 >= 0xD800 && c1 < 0xDC00 && i + 1 < s.size() && s[i] == '\\' && s[i + 1] == 'u') {
                        i += 2;
                        unsigned c2 = hex4();
                        c1 = 0x10000 + ((c1 - 0xD800) << 10) + (c2 - 0xDC00);
                    }
                    utf8(o, c1);
                    break;
                }
                default: fail();
            }
        }
        return o;
    }
    J value(int depth = 0) {
        if (depth > 64) fail();
        ws();
        if (i >= s.size()) fail();
        char c = s[i];
        if (c == '{') {
            i++;
            J j = J::object();
            ws();
            if (s[i] == '}') { i++; return j; }
            while (true) {
                ws();
                string k = str();
                ws();
                if (s[i++] != ':') fail();
                j.o.emplace_back(k, value(depth + 1));
                ws();
                if (i >= s.size()) fail();
                if (s[i] == ',') { i++; continue; }
                if (s[i] == '}') { i++; break; }
                fail();
            }
            return j;
        }
        if (c == '[') {
            i++;
            J j = J::array();
            ws();
            if (s[i] == ']') { i++; return j; }
            while (true) {
                j.a.push_back(value(depth + 1));
                ws();
                if (i >= s.size()) fail();
                if (s[i] == ',') { i++; continue; }
                if (s[i] == ']') { i++; break; }
                fail();
            }
            return j;
        }
        if (c == '"') return J::str(str());
        if (s.compare(i, 4, "true") == 0) { i += 4; return J::boolean(true); }
        if (s.compare(i, 5, "false") == 0) { i += 5; return J::boolean(false); }
        if (s.compare(i, 4, "null") == 0) { i += 4; return J(); }
        size_t st = i;
        while (i < s.size() && (isdigit((unsigned char)s[i]) || s[i] == '-' || s[i] == '+' || s[i] == '.' || s[i] == 'e' || s[i] == 'E')) i++;
        if (st == i) fail();
        return J::num(s.substr(st, i - st));
    }
};
static J parse(const string& s) {
    Parser p(s);
    J v = p.value();
    p.ws();
    if (p.i != s.size()) throw std::runtime_error("bad json");
    return v;
}
static void esc(string& o, const string& s) {
    o += '"';
    for (unsigned char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
                else o += (char)c;
        }
    }
    o += '"';
}
static void dump(const J& j, string& o) {
    switch (j.t) {
        case J::Null: o += "null"; break;
        case J::Bool: o += j.b ? "true" : "false"; break;
        case J::Num: o += j.s; break;
        case J::Str: esc(o, j.s); break;
        case J::Arr:
            o += '[';
            for (size_t i = 0; i < j.a.size(); i++) { if (i) o += ','; dump(j.a[i], o); }
            o += ']';
            break;
        case J::Obj:
            o += '{';
            for (size_t i = 0; i < j.o.size(); i++) { if (i) o += ','; esc(o, j.o[i].first); o += ':'; dump(j.o[i].second, o); }
            o += '}';
            break;
    }
}
static string dumps(const J& j) { string o; dump(j, o); return o; }

// ====================================================================== База данных
struct DbError : std::runtime_error {
    int status;
    DbError(int st, const string& m) : std::runtime_error(m), status(st) {}
};

struct Database {
    std::mutex mu;
    JA users, doctors, appts;  // users хранят password_hash
    bool seeded = false;
    struct Code { string hash; double exp; int tries; };
    std::map<string, Code> codes;
    string path;

    void load() {
        std::ifstream f(path, std::ios::binary);
        if (!f) return;
        std::stringstream ss;
        ss << f.rdbuf();
        try {
            J d = parse(ss.str());
            if (auto p = d.get("users")) users = p->a;
            if (auto p = d.get("doctors")) doctors = p->a;
            if (auto p = d.get("appts")) appts = p->a;
            if (auto p = d.get("seeded")) seeded = p->b;
        } catch (...) {
            std::cerr << "Файл базы данных повреждён: " << path << "\n";
            exit(1);
        }
    }
    void persist() {
        J d = J::object();
        J u = J::array(); u.a = users;
        J dc = J::array(); dc.a = doctors;
        J ap = J::array(); ap.a = appts;
        d.set("users", u); d.set("doctors", dc); d.set("appts", ap); d.set("seeded", J::boolean(seeded));
        string tmp = path + ".tmp";
        {
            std::ofstream f(tmp, std::ios::binary | std::ios::trunc);
            f << dumps(d);
            f.flush();
            if (!f) throw DbError(500, "Не удалось записать базу данных на диск");
        }
        if (rename(tmp.c_str(), path.c_str()) != 0) throw DbError(500, "Не удалось записать базу данных на диск");
    }

    // внешние ключи (проверяются после замены таблицы, как DEFERRABLE INITIALLY DEFERRED)
    void check_fk(const JA& U, const JA& D, const JA& A) {
        std::set<string> uid, did;
        for (auto& u : U) uid.insert(u.sval("id"));
        for (auto& d : D) did.insert(d.sval("id"));
        for (auto& d : D) if (d.has("userId") && !uid.count(d.sval("userId"))) throw DbError(409, "Ошибка базы данных: врач ссылается на несуществующего пользователя");
        for (auto& a : A) {
            if (!uid.count(a.sval("patientId"))) throw DbError(409, "Ошибка базы данных: запись ссылается на несуществующего пациента");
            if (!did.count(a.sval("doctorId"))) throw DbError(409, "Ошибка базы данных: запись ссылается на несуществующего врача");
        }
    }
    static void need(const J& r, const char* k) {
        if (r.t != J::Obj || r.sval(k).empty()) throw DbError(400, string("нет поля ") + k);
    }
    static void dflt(J& r, const char* k, const J& v) { if (!r.get(k) || r.get(k)->t == J::Null) r.set(k, v); }
    static J intnum(const J* v, const char* d) {
        if (v && v->t == J::Num) { double x = atof(v->s.c_str()); return J::num(std::to_string((long long)x)); }
        if (v && v->t == J::Str && !v->s.empty()) return J::num(std::to_string(atoll(v->s.c_str())));
        return J::num(d);
    }

    JA save_users(const JA& rows) {
        std::map<string, string> old;
        for (auto& u : users) old[u.sval("id")] = u.sval("password_hash");
        JA out;
        std::set<string> ids, emails;
        for (auto r : rows) {
            need(r, "id"); need(r, "name"); need(r, "email");
            string role = r.sval("role");
            if (role != "patient" && role != "doctor" && role != "admin") throw DbError(409, "Ошибка базы данных: неверная роль");
            string email = r.sval("email");
            for (auto& c : email) c = (char)tolower((unsigned char)c);
            r.set("email", J::str(email));
            string id = r.sval("id");
            if (!ids.insert(id).second) throw DbError(409, "Такая запись уже есть");
            if (!emails.insert(email).second) throw DbError(409, "Этот email уже зарегистрирован");
            string ph = r.has("password") ? hash_pw(r.sval("password")) : (old.count(id) ? old[id] : "");
            if (ph.empty()) throw DbError(400, "нет пароля у пользователя " + id);
            r.erase("password");
            r.set("password_hash", J::str(ph));
            dflt(r, "phone", J::str("")); dflt(r, "birth", J::str(""));
            for (const char* k : {"photo", "doctorId", "health", "files"}) if (r.get(k) && !r.has(k)) r.erase(k);
            out.push_back(r);
        }
        return out;
    }
    JA save_doctors(const JA& rows) {
        JA out;
        std::set<string> ids;
        for (auto r : rows) {
            need(r, "id"); need(r, "name"); need(r, "spec");
            if (!ids.insert(r.sval("id")).second) throw DbError(409, "Такая запись уже есть");
            r.set("exp", intnum(r.get("exp"), "0"));
            r.set("price", intnum(r.get("price"), "0"));
            if (!r.get("rating") || r.get("rating")->t != J::Num) r.set("rating", J::num("5"));
            dflt(r, "bio", J::str("")); dflt(r, "from", J::str("09:00")); dflt(r, "to", J::str("17:00")); dflt(r, "img", J::str(""));
            for (const char* k : {"hidden", "deleted"}) { if (r.has(k)) r.set(k, J::boolean(true)); else r.erase(k); }
            if (r.has("custom")) r.set("custom", J::num("1")); else r.erase("custom");
            if (r.get("userId") && !r.has("userId")) r.erase("userId");
            out.push_back(r);
        }
        return out;
    }
    JA save_appts(const JA& rows) {
        JA out;
        std::set<string> ids, slots;
        for (auto r : rows) {
            need(r, "id"); need(r, "patientId"); need(r, "doctorId"); need(r, "date"); need(r, "time");
            string st = r.sval("status");
            if (st != "pending" && st != "confirmed" && st != "done" && st != "cancelled") throw DbError(409, "Ошибка базы данных: неверный статус записи");
            if (!ids.insert(r.sval("id")).second) throw DbError(409, "Такая запись уже есть");
            if (st != "cancelled" && !slots.insert(r.sval("doctorId") + "|" + r.sval("date") + "|" + r.sval("time")).second) throw DbError(409, "Это время уже занято");
            dflt(r, "reason", J::str("")); dflt(r, "note", J::str(""));
            if (r.get("record") && !r.has("record")) r.erase("record");
            out.push_back(r);
        }
        return out;
    }

    void save(const string& key, const J* value) {
        std::lock_guard<std::mutex> g(mu);
        if (key == "seeded") { seeded = true; persist(); return; }
        if (!value || value->t != J::Arr) throw DbError(400, "ожидался список записей");
        JA U = users, D = doctors, A = appts;
        if (key == "users") U = save_users(value->a);
        else if (key == "doctors") D = save_doctors(value->a);
        else if (key == "appts") A = save_appts(value->a);
        else throw DbError(400, "неизвестный ключ");
        check_fk(U, D, A);
        JA bu = users, bd = doctors, ba = appts;
        users = U; doctors = D; appts = A;
        try { persist(); } catch (...) { users = bu; doctors = bd; appts = ba; throw; }
    }

    string state() {
        std::lock_guard<std::mutex> g(mu);
        J d = J::object();
        J u = J::array();
        for (auto r : users) { r.erase("password_hash"); u.a.push_back(r); }
        J dc = J::array(); dc.a = doctors;
        J ap = J::array(); ap.a = appts;
        d.set("users", u); d.set("doctors", dc); d.set("appts", ap); d.set("seeded", J::boolean(seeded));
        return dumps(d);
    }
    string login(const string& email, const string& pw, bool& ok) {
        string stored, id;
        {
            std::lock_guard<std::mutex> g(mu);
            for (auto& u : users) if (u.sval("email") == email) { stored = u.sval("password_hash"); id = u.sval("id"); }
        }
        ok = !stored.empty() && check_pw(pw, stored);
        return id;
    }
    string new_code(const string& email) {
        std::random_device rd;
        char b[8];
        snprintf(b, sizeof b, "%06u", (unsigned)(rd() % 1000000));
        std::lock_guard<std::mutex> g(mu);
        codes[email] = {sha256hex(b), (double)time(nullptr) + CODE_TTL, 0};
        return b;
    }
    // 0 — ок, иначе текст ошибки
    string verify(const string& email, const string& code) {
        std::lock_guard<std::mutex> g(mu);
        auto it = codes.find(email);
        if (it == codes.end() || it->second.exp < (double)time(nullptr)) return "Код устарел. Запросите новый.";
        if (it->second.tries + 1 > CODE_TRIES) { codes.erase(it); return "Слишком много попыток. Запросите новый код."; }
        it->second.tries++;
        string h = sha256hex(code);
        bool good = consteq(h, it->second.hash);
        if (good) codes.erase(it);
        return good ? "" : "Неверный код";
    }
} DB;

// ====================================================================== HTTP
struct Req {
    string method, path, query;
    std::map<string, string> headers;
    string body;
};

static string lower(string s) { for (auto& c : s) c = (char)tolower((unsigned char)c); return s; }
static string url_decode(const string& s) {
    string o;
    for (size_t i = 0; i < s.size(); i++) {
        if (s[i] == '%' && i + 2 < s.size() && isxdigit((unsigned char)s[i + 1]) && isxdigit((unsigned char)s[i + 2])) {
            o += (char)strtol(s.substr(i + 1, 2).c_str(), nullptr, 16);
            i += 2;
        } else o += s[i];
    }
    return o;
}
static const char* status_text(int c) {
    switch (c) {
        case 200: return "OK"; case 400: return "Bad Request"; case 404: return "Not Found"; case 405: return "Method Not Allowed";
        case 409: return "Conflict"; case 413: return "Payload Too Large"; default: return "Internal Server Error";
    }
}
static void send_all(int fd, const string& s) {
    size_t off = 0;
    while (off < s.size()) {
        ssize_t n = send(fd, s.data() + off, s.size() - off, 0);
        if (n <= 0) return;
        off += (size_t)n;
    }
}
static void respond(int fd, int code, const string& type, const string& body, bool head = false) {
    string h = "HTTP/1.1 " + std::to_string(code) + " " + status_text(code) + "\r\nContent-Type: " + type +
               "\r\nContent-Length: " + std::to_string(body.size()) + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n";
    send_all(fd, h);
    if (!head) send_all(fd, body);
}
static void json_reply(int fd, int code, const string& body) { respond(fd, code, "application/json; charset=utf-8", body); }
static string err_json(const string& m) {
    J j = J::object();
    j.set("ok", J::boolean(false));
    j.set("error", J::str(m));
    return dumps(j);
}
static const string OK_JSON = "{\"ok\":true}";

static string mime(const string& p) {
    size_t d = p.rfind('.');
    string e = d == string::npos ? "" : lower(p.substr(d + 1));
    static const std::map<string, string> m = {
        {"html", "text/html; charset=utf-8"}, {"css", "text/css; charset=utf-8"}, {"js", "application/javascript; charset=utf-8"},
        {"json", "application/json; charset=utf-8"}, {"svg", "image/svg+xml"}, {"png", "image/png"}, {"jpg", "image/jpeg"},
        {"jpeg", "image/jpeg"}, {"webp", "image/webp"}, {"gif", "image/gif"}, {"ico", "image/x-icon"}, {"woff2", "font/woff2"},
        {"woff", "font/woff"}, {"txt", "text/plain; charset=utf-8"}, {"mp4", "video/mp4"}};
    auto it = m.find(e);
    return it == m.end() ? "application/octet-stream" : it->second;
}

static void serve_file(int fd, const Req& rq) {
    string p = url_decode(rq.path);
    if (p.empty() || p[0] != '/' || p.find("..") != string::npos || p.find('\0') != string::npos) return respond(fd, 404, "text/plain", "Not found");
    if (p.back() == '/') p += "index.html";
    string lp = lower(p);
    // служебные файлы не отдаём
    static const char* blocked[] = {"server.cpp", "/data/", "/.env", ".db", "/.git", "/run.sh", "/.claude", "readme", ".tmp"};
    for (auto b : blocked) if (lp.find(b) != string::npos) return respond(fd, 404, "text/plain", "Not found");
    if (lp == "/medeo") return respond(fd, 404, "text/plain", "Not found");
    string full = ROOT + p;
    struct stat st;
    if (stat(full.c_str(), &st) != 0 || !S_ISREG(st.st_mode)) return respond(fd, 404, "text/plain", "Not found");
    std::ifstream f(full, std::ios::binary);
    std::stringstream ss;
    ss << f.rdbuf();
    respond(fd, 200, mime(p), ss.str(), rq.method == "HEAD");
}

static bool valid_email(const string& e) {
    size_t at = e.find('@');
    if (at == string::npos || at == 0 || e.find('@', at + 1) != string::npos) return false;
    size_t dot = e.rfind('.');
    if (dot == string::npos || dot < at + 2 || dot + 1 >= e.size()) return false;
    for (unsigned char c : e) if (isspace(c)) return false;
    return true;
}
static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t\r\n"), b = s.find_last_not_of(" \t\r\n");
    return a == string::npos ? "" : s.substr(a, b - a + 1);
}

static void handle_api(int fd, const Req& rq) {
    const string& p = rq.path;
    if (rq.method == "GET" && p == "/api/state") {
        try { return json_reply(fd, 200, DB.state()); }
        catch (std::exception& e) { return json_reply(fd, 500, err_json(e.what())); }
    }
    if (rq.method != "POST") return json_reply(fd, 405, err_json("method not allowed"));
    J body;
    try { body = parse(rq.body.empty() ? "{}" : rq.body); }
    catch (...) { return json_reply(fd, 400, err_json("bad json")); }

    if (p == "/api/save") {
        try {
            DB.save(body.sval("key"), body.get("value"));
            return json_reply(fd, 200, OK_JSON);
        } catch (DbError& e) { return json_reply(fd, e.status, err_json(e.what())); }
        catch (std::exception& e) { return json_reply(fd, 400, err_json(e.what())); }
    }

    string email = lower(trim(body.sval("email")));
    if (!valid_email(email)) return json_reply(fd, 400, err_json("bad email"));

    if (p == "/api/login") {
        bool ok = false;
        string id = DB.login(email, body.sval("password"), ok);
        if (ok) { J j = J::object(); j.set("ok", J::boolean(true)); j.set("id", J::str(id)); return json_reply(fd, 200, dumps(j)); }
        return json_reply(fd, 200, err_json("Неверный email или пароль"));
    }
    if (p == "/api/send-code") {
        string code = DB.new_code(email), name = trim(body.sval("name"));
        if (name.empty()) name = "—";
        string line(52, '=');
        std::cout << "\n" << line << "\n  MEDEO · код подтверждения регистрации\n  Пользователь: " << name << "\n  Email:        " << email
                  << "\n  КОД:          " << code << "   (действует 10 минут)\n" << line << "\n" << std::endl;
        return json_reply(fd, 200, OK_JSON);
    }
    if (p == "/api/verify") {
        string e = DB.verify(email, trim(body.sval("code")));
        return json_reply(fd, 200, e.empty() ? OK_JSON : err_json(e));
    }
    json_reply(fd, 404, err_json("not found"));
}

static void handle(int fd) {
    timeval tv{15, 0};
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof tv);
    string buf;
    char tmp[8192];
    size_t hend = string::npos;
    while (hend == string::npos) {
        ssize_t n = recv(fd, tmp, sizeof tmp, 0);
        if (n <= 0) { close(fd); return; }
        buf.append(tmp, (size_t)n);
        hend = buf.find("\r\n\r\n");
        if (buf.size() > 65536 && hend == string::npos) { respond(fd, 413, "text/plain", "too large"); close(fd); return; }
    }
    Req rq;
    std::istringstream hs(buf.substr(0, hend));
    string line, target, ver;
    std::getline(hs, line);
    std::istringstream rl(line);
    rl >> rq.method >> target >> ver;
    while (std::getline(hs, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        size_t c = line.find(':');
        if (c != string::npos) rq.headers[lower(line.substr(0, c))] = trim(line.substr(c + 1));
    }
    size_t q = target.find('?');
    rq.path = q == string::npos ? target : target.substr(0, q);
    rq.query = q == string::npos ? "" : target.substr(q + 1);
    size_t clen = rq.headers.count("content-length") ? (size_t)atoll(rq.headers["content-length"].c_str()) : 0;
    if (clen > 64u * 1024 * 1024) { respond(fd, 413, "text/plain", "too large"); close(fd); return; }
    rq.body = buf.substr(hend + 4);
    while (rq.body.size() < clen) {
        ssize_t n = recv(fd, tmp, sizeof tmp, 0);
        if (n <= 0) break;
        rq.body.append(tmp, (size_t)n);
    }
    rq.body.resize(std::min(rq.body.size(), clen));
    try {
        if (rq.path.rfind("/api/", 0) == 0) handle_api(fd, rq);
        else if (rq.method == "GET" || rq.method == "HEAD") serve_file(fd, rq);
        else respond(fd, 405, "text/plain", "Method not allowed");
    } catch (std::exception& e) {
        respond(fd, 500, "text/plain", e.what());
    }
    close(fd);
}

int main(int argc, char** argv) {
    signal(SIGPIPE, SIG_IGN);
    char rp[PATH_MAX];
    if (argc > 1) ROOT = argv[1];
    else if (realpath(argv[0], rp)) { ROOT = rp; ROOT = ROOT.substr(0, ROOT.rfind('/')); }
    else { getcwd(rp, sizeof rp); ROOT = rp; }
    // если бинарник лежит не рядом с index.html — берём текущую папку
    struct stat st;
    if (stat((ROOT + "/index.html").c_str(), &st) != 0) { getcwd(rp, sizeof rp); ROOT = rp; }
    mkdir((ROOT + "/data").c_str(), 0755);
    DB.path = ROOT + "/data/medeo.json";
    DB.load();

    int s = socket(AF_INET, SOCK_STREAM, 0);
    int one = 1;
    setsockopt(s, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
    sockaddr_in a{};
    a.sin_family = AF_INET;
    a.sin_addr.s_addr = htonl(INADDR_ANY);
    a.sin_port = htons(PORT);
    if (bind(s, (sockaddr*)&a, sizeof a) != 0) { std::cerr << "Порт " << PORT << " занят. Остановите другой сервер.\n"; return 1; }
    listen(s, 64);
    std::cout << "Medeo: http://localhost:" << PORT << "\nБаза данных: " << DB.path << " (пользователей: " << DB.users.size()
              << ", врачей: " << DB.doctors.size() << ", записей: " << DB.appts.size() << ")\nКоды подтверждения будут появляться ниже.\n" << std::endl;
    while (true) {
        int c = accept(s, nullptr, nullptr);
        if (c < 0) continue;
        std::thread(handle, c).detach();
    }
}
