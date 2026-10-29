# 双写字母音形对照审计（2026-10-29）

## 范围与方法

对扫描时 `soundSpellingLessons` 已发布集合逐条展平音形分块中的 `pairs`，筛选相邻两个单字母相同、其中一个 sound 非空、另一个为空的情形，记录音标、两块的拼写及重音；它是面向整个已发布集合的扫描，包含初中复用词和运行时构造短语，不能直接等同于高中教材专属数目。静态来源粗定位为高中音形文件的有 170 处，其中同块 16 处、跨块 154 处；另外 3 处为动态构造短语，归属需进一步核查。扫描不覆盖两个字母已组合为一个 pair 的情况，也不能穷举所有音形错误。命令：

```sh
npx tsx app/qa/highschool-lessons/scan-double-letter-phonics.ts > /tmp/double-letter-phonics-current.jsonl
```

记录中数据来自修复前快照。命令读取当前工作树，后续修复或数据更新后统计可能改变。候选只表示需要检查，不等同于错误，特别是两个字母跨拼写分块时，将它们合在一块可能影响重音及音节的呈现，不能机械替换；各项须查实际音标、语言和音节边界，并结合组件显示检查。

## 已修复的同块 16 处

process、appoint、waitress、nevertheless、witness、assessment、assess、embarrassed、recall、homesickness、depressed、depress、regardless、overall、enroll、assemble。检查原有词典来源和已列音标后，将同块内的相同双写拼写字母组合为一个 pair，并保留该处的原音素、分块、重音及字母顺序。每个词没有重新逐一听取录音，词典标注也不代表对全部变体已完成独立审核。

定向测试 `app/test/highschool-double-letters-phonics.test.ts` 及 `app/test/sound-spelling.test.ts` 于本次修复后通过（2 个测试文件、3 项测试）。测试覆盖拼写、音素和重音结构，不是语言学正确性的替代品。

## 修复前跨块候选（157 处，待逐项审核）

以下为检查前快照，每行包含词头、相邻两块及重音、双写拼写和原有映射音素；同一词可出现多次。每行均为待确认项，不应理解为已认定错误。

```text
billion bil[primary] / lion[none] ll /l/
calligraphy cal[none] / lig[primary] ll /l/
appreciate ap[none] / pre[primary] pp /p/
struggle strug[primary] / gle[none] gg /ɡ/
application ap[secondary] / pli[none] pp /p/
committee com[none] / mit[primary] mm /m/
committee mit[primary] / tee[none] tt /t/
issue is[primary] / sue[none] ss /ʃ/
disappear ap[none] / pear[primary] pp /p/
attempt at[none] / tempt[primary] tt /t/
professional fes[primary] / sion[none] ss /ʃ/
annoyed an[none] / noyed[primary] nn /n/
annoy an[none] / noy[primary] nn /n/
illegal il[none] / le[primary] ll /l/
illegally il[none] / le[primary] ll /l/
illegally gal[none] / ly[none] ll /l/
immediately im[none] / me[primary] mm /m/
blogger blog[primary] / ger[none] gg /ɡ/
battery bat[primary] / te[none] tt /t/
button but[primary] / ton[none] tt /t/
cyberbully bul[secondary] / ly[none] ll /l/
embarrassing bar[primary] / ras[none] rr /r/
embarrassing ras[none] / sing[none] ss /s/
puzzle puz[primary] / zle[none] zz /z/
currency cur[primary] / ren[none] rr /r/
surround sur[none] / round[primary] rr /r/
battle bat[primary] / tle[none] tt /t/
announce an[none] / nounce[primary] nn /n/
gallery gal[primary] / le[none] ll /l/
approach ap[none] / proach[primary] pp /p/
cattle cat[primary] / tle[none] tt /t/
classical clas[primary] / si[none] ss /s/
opportunity op[secondary] / por[none] pp /p/
assume as[none] / sume[primary] ss /s/
addition ad[none] / di[primary] dd /d/
commercial com[none] / mer[primary] mm /m/
commercialise com[none] / mer[primary] mm /m/
commercialisation com[none] / mer[secondary] mm /m/
commercialization com[none] / mer[secondary] mm /m/
occasion oc[none] / ca[primary] cc /k/
merry mer[primary] / ry[none] rr /r/
pudding pud[primary] / ding[none] dd /d/
inner in[primary] / ner[none] nn /n/
wedding wed[primary] / ding[none] dd /d/
horrible hor[primary] / ri[none] rr /r/
Halloween Hal[secondary] / lo[none] ll /l/
dilemma lem[primary] / ma[none] mm /m/
illustrate il[primary] / lu[none] ll /l/
marriage mar[primary] / ri[none] rr /r/
colleague col[primary] / lea[none] ll /l/
passive pas[primary] / sive[none] ss /s/
assist as[none] / sist[primary] ss /s/
occur oc[none] / cur[primary] cc /k/
mission mis[primary] / sion[none] ss /ʃ/
graffiti graf[none] / fi[primary] ff /f/
immigrant im[primary] / mi[none] mm /m/
collection col[none] / lec[primary] ll /l/
accessory ces[primary] / so[none] ss /s/
settle set[primary] / tle[none] tt /t/
intelligent tel[primary] / li[none] ll /l/
satellite el[none] / lite[none] ll /l/
disappointed ap[none] / poin[primary] pp /p/
current cur[primary] / rent[none] rr /r/
sufficient suf[none] / fi[primary] ff /f/
tissue tis[primary] / sue[none] ss /ʃ/
shallow shal[primary] / low[none] ll /l/
pattern pat[primary] / tern[none] tt /t/
pillow pil[primary] / low[none] ll /l/
attach at[none] / tach[primary] tt /t/
Challenger Chal[primary] / len[none] ll /l/
narrator nar[primary] / ra[none] rr /r/
narration nar[none] / ra[primary] rr /r/
eventually al[none] / ly[none] ll /l/
willing wil[primary] / ling[none] ll /l/
ambassador bas[primary] / sa[none] ss /s/
upper up[primary] / per[none] pp /p/
permission mis[primary] / sion[none] ss /ʃ/
committed com[none] / mit[primary] mm /m/
committed mit[primary] / ted[none] tt /t/
commit com[none] / mit[primary] mm /m/
apparently ap[none] / par[primary] pp /p/
penicillin cil[primary] / lin[none] ll /l/
passion pas[primary] / sion[none] ss /ʃ/
gradually al[none] / ly[none] ll /l/
professor fes[primary] / sor[none] ss /s/
appliance ap[none] / pli[primary] pp /p/
efficient ef[none] / fi[primary] ff /f/
command com[none] / mand[primary] mm /m/
potentially tial[none] / ly[none] ll /l/
innovation in[secondary] / no[none] nn /n/
occupation oc[secondary] / cu[none] cc /k/
oppose op[none] / pose[primary] pp /p/
essay es[primary] / say[none] ss /s/
accurate ac[primary] / cu[none] cc /k/
valley val[primary] / ley[none] ll /l/
territory ter[primary] / ri[none] rr /r/
cottage cot[primary] / tage[none] tt /t/
accompany ac[none] / com[primary] cc /k/
corridor cor[primary] / ri[none] rr /r/
appeal ap[none] / peal[primary] pp /p/
appetite ap[primary] / pe[none] pp /p/
appropriate ap[none] / pro[primary] pp /p/
approve ap[none] / prove[primary] pp /p/
differ dif[primary] / fer[none] ff /f/
barrier bar[primary] / ri[none] rr /r/
assessment as[none] / sess[primary] ss /s/
assess as[none] / sess[primary] ss /s/
occupy oc[primary] / cu[none] cc /k/
embarrassed bar[primary] / rassed[none] rr /r/
attain at[none] / tain[primary] tt /t/
pollinate pol[primary] / li[none] ll /l/
assumption as[none] / sump[primary] ss /s/
tunnel tun[primary] / nel[none] nn /n/
alleviate al[none] / le[primary] ll /l/
assistant as[none] / sis[primary] ss /s/
missile mis[primary] / sile[none] ss /s/
brilliant bril[primary] / liant[none] ll /l/
messenger mes[primary] / sen[none] ss /s/
applicant ap[primary] / pli[none] pp /p/
setting set[primary] / ting[none] tt /t/
surroundings sur[none] / round[primary] rr /r/
surrounding sur[none] / round[primary] rr /r/
peppercorn pep[primary] / per[none] pp /p/
dessert des[none] / sert[primary] ss /z/
haggis hag[primary] / gis[none] gg /ɡ/
chilli chil[primary] / li[none] ll /l/
association as[none] / so[secondary] ss /s/
massive mas[primary] / sive[none] ss /s/
literally al[none] / ly[none] ll /l/
quarry quar[primary] / ry[none] rr /r/
cobblestone cob[primary] / ble[none] bb /b/
millimetre mil[primary] / li[none] ll /l/
swollen swol[primary] / len[none] ll /l/
swallow swal[primary] / low[none] ll /l/
interrupt ter[none] / rupt[primary] rr /r/
fellow fel[primary] / low[none] ll /l/
collapse col[none] / lapse[primary] ll /l/
foggy fog[primary] / gy[none] gg /ɡ/
tobacco bac[primary] / co[none] cc /k/
pessimistic pes[secondary] / si[none] ss /s/
dizzy diz[primary] / zy[none] zz /z/
appointment ap[none] / point[primary] pp /p/
applaud ap[none] / plaud[primary] pp /p/
gallon gal[primary] / lon[none] ll /l/
possession pos[none] / sess[primary] ss /z/
opponent op[none] / po[primary] pp /p/
arrest ar[none] / rest[primary] rr /r/
rubber rub[primary] / ber[none] bb /b/
bubble bub[primary] / ble[none] bb /b/
kettle ket[primary] / tle[none] tt /t/
accountant ac[none] / count[primary] cc /k/
accuse ac[none] / cuse[primary] cc /k/
communist com[primary] / mu[none] mm /m/
collar col[primary] / lar[none] ll /l/
in addition ad[none] / di[primary] dd /d/
as a matter of fact mat[secondary] / ter [none] tt /t/
appeal to ap[none] / peal [primary] pp /p/
```
