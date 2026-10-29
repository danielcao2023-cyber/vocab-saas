# Run in app/: npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/gaps-reuse.json
# then: python3 qa/highschool-lessons/recording-candidate-scan-2026-10-30/local-reuse-scan-2026-10-30.py /tmp/gaps-reuse.json
import hashlib, json, pathlib, re, sys
rows=json.load(open(sys.argv[1])); entries=json.load(open("data/pronunciation/manifest.json"))["entries"]; sources=json.load(open("data/pronunciation/sources.json")); out=[]
for row in rows:
    word=row.get("spoken")
    if not word or row.get("placeholder"): continue
    recordings=[]
    for key, v in entries.items():
        if v.get("word") != word: continue
        path=pathlib.Path("data/pronunciation") / v["file"]
        recordings.append({"key":key,"word":v["word"],"matchedSense":v.get("matchedSense"),"file":v["file"],"sha256Valid":path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==v.get("sha256")})
    regular=[v["title"] for v in sources if re.fullmatch(r"File:En-(?:us|uk)-"+re.escape(word)+r"\.(?:ogg|oga|wav|mp3)",v["title"])]
    # Suffix matches are only leads: a prefix may be part of a compound, not a speaker name.
    lingua=[v["title"] for v in sources if v["title"].startswith("File:LL-Q1860 (eng)-") and v["title"].endswith("-"+word+".wav")]
    if recordings or regular or lingua: out.append({"word":word,"key":row["key"],"recordings":recordings,"regularSources":regular,"linguaSuffixLeads":lingua})
print(json.dumps({"nonPlaceholderRows":sum(bool(r.get("spoken")) and not r.get("placeholder") for r in rows),"results":out},ensure_ascii=False,indent=2))
