#!/bin/sh
# Собирает и запускает сервер Medeo (нужен компилятор C++17: g++ или clang++)
cd "$(dirname "$0")" || exit 1
CXX=$(command -v g++ || command -v clang++ || command -v c++) || { echo "Не найден компилятор C++"; exit 1; }
if [ ! -x medeo ] || [ server.cpp -nt medeo ]; then
  echo "Сборка server.cpp ..."
  "$CXX" -O2 -std=c++17 -pthread server.cpp -o medeo || exit 1
fi
exec ./medeo
