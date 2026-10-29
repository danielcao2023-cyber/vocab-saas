# 高中词条非录音覆盖复核（v150）

使用 v150 catalog 和离线 seed，`npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`：高中七册 2730 个去重 stable key 全有映射，讲解 reader 全部 ready。无音形映射 747 项，其中 455 为纯字母词头（`single-letters` 表示仅含字母，并非只有一个字母）、290 为多词词头、2 其他。空音形对照不等于多音节错误。`npx tsx scripts/lesson-identity-index.ts` 一致；`npx tsx qa/highschool-lessons/check-cross-device-identities.ts` 模拟数字 ID 变化后线上、离线源码和离线资产三路径 2730 项读取成功。均为结构覆盖，不能证明讲解或教材内容准确，也不代表已安装 Android 版本。

纯字母候选用 `PYTHONPATH=/tmp/phonics-cmudict python3 qa/highschool-lessons/classify-phonics-candidates.py /tmp/current-highschool-nonaudio-scan.json` 和本机 cmudict 1.1.3 按词典中全部读法分类：435 项均单音节、10 项均多音节、2 项读法混合、8 项未命中。10 项为 CE、leant、GPS、Roderick、Oliver、DDT、BBQ、Edmonds、CV、Sami，主要是缩写、专名及词形；leant 的多音节词典读法可能属于同形人名。混合项 AI、fine 存在缩写或同形词歧义。未命中 BCE、chiwen、cm、Dollywood、Kazak、CPR、Giverny、gramme 需具体查证。此筛查没有直接确认的普通多音节缺口，不能证明缺口为零，词典漏项、口音和同形异词需进一步核验。290 项多词及 2 项其他词头不在本次 CMU 分析范围。
