#!/bin/zsh -l
cd ~/vocab-data/curriculum/ocr && mkdir -p pages logs
one() {
  p=$1; lvl=$2
  [ -s pages/$p.tsv ] && return
  codex exec -m gpt-6-luna -c model_reasoning_effort=high --skip-git-repo-check -s read-only -i hires/p-$(printf %03d $p).png -- "This image is PDF page $p of a Chinese English curriculum standard, from the ${lvl} vocabulary list (词汇表). Transcribe EVERY word entry on the page faithfully, in reading order (columns top-to-bottom, left column first). Output ONLY TSV lines, no header, no commentary, with columns: page<TAB>entry<TAB>star<TAB>flag<TAB>note. entry = exactly as printed including parenthetical parts like (pl. children) or (Am E ...), but WITHOUT the asterisk. star = 1 if the entry has an asterisk *, else 0. flag = 1 if you are not fully sure of the reading (blurry, ambiguous), else 0; note = brief reason if flagged. Do not include headings, page numbers, letters A/B/C section headers, or any non-entry text. If the page contains a section that is NOT the word list (e.g. 数词表), stop at that section. Never invent entries." < /dev/null > logs/$p.out 2>logs/$p.err
  grep -E "^$p	" logs/$p.out > pages/$p.tsv
}
for p in $(seq 95 104); do one $p "二级(level 2)" & ; while [ $(jobs -r | wc -l) -ge 6 ]; do sleep 2; done; done
for p in $(seq 105 135); do one $p "三级(level 3)" & ; while [ $(jobs -r | wc -l) -ge 6 ]; do sleep 2; done; done
wait; echo DONE
