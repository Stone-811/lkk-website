#!/bin/bash
# 從某一頁的 HTML 出發，跟著 JS 裡的 "./xxx.js" 動態 import 把整站的 client chunk 抓下來（含要登入的後台頁）。
# 用法：crawl-chunks.sh <網站根網址> <起始路徑> <輸出資料夾>
#   例：crawl-chunks.sh https://lkkwellness.com "/booking?qa=$(date +%s)" "$W/prodchunks"
#   之後：grep -l '新字串' "$W"/prodchunks/*.js ；舊字串用 cat … | grep -o -e '舊字串' | wc -l 應為 0
# 2026-10-21 從 /booking 出發抓到 61 個 chunk，後台客戶預約、團課預約的頁面 chunk 都在裡面。
set -u
P=$1; START=$2; W=$3
mkdir -p "$W"; : > "$W/.seen"
curl -s "$P$START" | grep -o '/_nuxt/[A-Za-z0-9_-]*\.js' | sed 's#/_nuxt/##' | sort -u > "$W/.q"
while [ -s "$W/.q" ]; do
  f=$(head -1 "$W/.q"); sed -i '' 1d "$W/.q"
  grep -qxF -- "$f" "$W/.seen" && continue   # -F：檔名當固定字串；--：hash 開頭可能是「-」
  echo "$f" >> "$W/.seen"
  curl -s "$P/_nuxt/$f" > "$W/$f"
  grep -o '"\./[A-Za-z0-9_-]*\.js"' "$W/$f" | tr -d '"' | sed 's#^\./##' | sort -u | while read -r n; do
    grep -qxF -- "$n" "$W/.seen" </dev/null || echo "$n" >> "$W/.q"
  done
done
echo "chunks: $(wc -l < "$W/.seen" | tr -d ' ')"
