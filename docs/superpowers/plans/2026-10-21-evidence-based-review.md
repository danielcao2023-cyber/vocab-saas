# 基于独立提取证据的背词与复习 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 本项目沿用Codex定规则、Claude Code CLI本地Coder承接有界实现、Codex验收的工作流；不得据本计划自行启动其他子代理或切换云端模型。

**Goal:** 修复“提示后填对／短时改对被当成熟悉”的问题，实现拼写优先、按每词每型证据调度、保留旧数据的安卓离线升级。

**Architecture:** cards继续作为认义、汉译英、听写各自唯一FSRS状态；新增幂等事件记录和证据元数据，由纯策略函数决定有效提取、复核、下一题和展示。共享学习引擎同时服务Node与sql.js；启动迁移须先备份，安卓持久化完成才确认新状态。

**Tech Stack:** Vue 3、TypeScript、Fastify、better-sqlite3、sql.js、现有锁定ts-fsrs 5.4.2、Vitest、Capacitor 7、Android Java/JDK21/API35。

**Spec:** [2026-10-21-evidence-based-review-design.md](../specs/2026-10-21-evidence-based-review-design.md)。执行者先读设计全文；其参数均为供本次计划审阅的试用值。

## Global Constraints

- 目标初三、2027年中考；听读写兼顾，主动拼写优先。
- 每日最多40个不同课程word_id（复习＋新词），同词补测不重复占名额；不恢复九题最低量，不保证40个新词。
- 不设三题型13／13／14或其他固定份额，不以题数相等作为验收依据。
- 保护期候选5分钟、每词当天基础检查后最多2次独立补测、缺证据保护候选3个上海自然日、延迟保持统计至少24小时；这些是可改试用参数，不是科学结论。
- 保留现有新词组成核心7:二级3、字长难度4:4:2作为历史冷启动值；不得压过到期复习，不在本轮改词库排序体系。
- 新数据不再用四个互斥词本决定出卡；阶段与重点/稳定标签分开。旧接口枚举仅兼容投影。
- 同词三型共享最近答案暴露保护，但各自记忆状态独立，不因一种成功自动给其他种通过。
- cards、review_logs、旧learning_issues.result_json保留可审计历史；不删除孩子进度或批量伪造旧“独立成功”。
- 安卓断网可学、同签名升级；首次分发种子个人数据为零，1600词、1608录音、813多音节条目和819映射保持。
- 保留横线输入、轻量焦点/竖线光标、点赞、右上角答前答后可学习；不添加每卡次数和三条进度。
- 不自动修改生产、不操作真机、不合并推送应用、不发布商店、不发送邮件。原计划编写阶段未运行Coder；2026-10-21用户已明确要求实施。
- 原始DB、孩子答题明细、模型Key、签名材料不进入Git、Coder提示词、Wiki或报告。Coder只接收源代码和合成fixture。

## 0. 状态、范围和交付顺序

编写时基线为`feat/complete-sound-spelling` / `ca308ec70d0aeaac7c122f9dcfd5af047382bf7b`，工作区原先干净，Android已交付1.0.1。本次新增设计和计划，不代表新策略已实现。开始执行时从该提交的实际继任HEAD继续，先核对是否有其他改动，不从落后的main重做或丢弃此前录音内容。

推荐执行分支`feat/evidence-based-review`；只有执行获指令后创建。若需要隔离worktree，按using-git-worktrees技能并优先复用本聊天适合的现有worktree。单任务顺序实现，不把相邻共享schema任务并发交给多个写入者。

交付分两个验收点：

- A：共享引擎、事件、迁移、调度、统计在合成Node/sql.js库通过，提供experience行为轨迹供审阅。
- B：页面一致、安卓迁移/断网/冷启动/升级通过，产出同签名1.0.2（versionCode 3）候选包。代码验收不等于长期教育效果验证。

本轮不新增智能语义判分、整词造句考试、收藏系统、系统通知、云同步、FSRS个体参数训练或地区中考题型预测。词义多解采用现有反馈机制和明确提示核验，不把AI在线裁决加入离线答题。

## 1. 文件职责与接口

| 文件 | 变更与职责 |
|---|---|
| `app/shared/learning.ts` | 保留旧类型并添加v3事件、能力、视图、summary/turn/result契约 |
| `app/server/src/learning/evidence-policy.ts`（新） | 纯函数：证据分类、参数、能力选择、阶段标签，不访问DB/时钟/文件 |
| `app/server/src/learning/evidence-store.ts`（新） | 幂等事件、每卡证据读写、FSRS适配和聚合投影 |
| `app/server/src/learning/evidence-migration.ts`（新） | v3增量schema和保守迁移，返回审计摘要，原日志不改写 |
| `app/server/src/learning/schema.ts` | 注册新DDL；不在普通GET中激活策略或重放历史 |
| `app/server/src/learning/engine.ts`、`policy.ts`、`selection.ts` | 接入v3事件及队列；legacy路径以版本边界隔离，不再用book给v3晋级 |
| `app/server/src/study.ts` | 单一FSRS写入适配，避免重复调度和纠正清错词；旧写入口在v3中关闭 |
| `app/server/src/learning/routes.ts`、`app.ts`、`main.ts` | 新输入校验、exposure/views接口、启动迁移、旧写API保护 |
| `app/server/src/search.ts`、`word-status.ts`、`stats.ts` | 页面共同投影和新统计，旧历史口径保留 |
| `app/web/src/offline/runtime.ts`、`storage.ts` | 共享迁移、曝光/视图路由、持久化确认与迁移备份 |
| `app/web/src/views/LearningStudyView.vue`、`LearningHomeView.vue`、`WordBooksView.vue`、`ParentView.vue`、`WordView.vue`、`BrowseView.vue`、`app/web/src/App.vue` | 会话/完成文案、能力视图、词页暴露与返回、家长指标 |
| `app/web/src/components/FocusStudyCard.vue` | 纠正/独立成功反馈，不改已确认卡片样式 |
| `app/scripts/preview-learning-v3.ts`（新） | 只读快照预览和合成轨迹导出，不自动操作实际手机数据 |
| `app/scripts/mobile-seed.ts`、`mobile-assets.ts` | 新空表和默认策略种子，确保个人数据清空 |
| `app/android/app/src/main/java/cn/xiaobei/vocabulary/VaultStore.java`、`MobileVaultPlugin.java` | 专用迁移前备份能力；现有双槽不被当成永久备份 |
| `app/android/app/src/androidTest/java/cn/xiaobei/vocabulary/VaultStoreTest.java` | 迁移备份/失败注入 |

新增精简测试文件：`learning-evidence-policy.test.ts`、`learning-evidence-store.test.ts`、`learning-v3-migration.test.ts`、`learning-v3-queue.test.ts`、`learning-v3-views.test.ts`、`learning-v3-metrics.test.ts`、`learning-v3-helpers.ts`、`mobile-learning-v3.test.ts`。保留现有基础测试，教育规则已撤回的断言用新规则替换，并在测试说明中解释原因；不能仅为得到绿灯删除重复提交、故障回滚或兼容检查。

### 统一公开契约（先在Task 2定义）

```ts
export type EvidenceKind = 'probe_success' | 'probe_failure' | 'exposure'
  | 'correction' | 'technical_defer';
export type WordStage = 'new' | 'consolidating' | 'review';
export type LearningView = 'all' | 'new' | 'due' | 'priority' | 'stable'
  | 'weak_spell' | 'weak_dictation';
export interface ReviewPolicy {
  version: 3;
  exposureGuardMs: number;
  additionalProbesPerDay: number;
  missingEvidenceDays: number;
  delayedEvidenceMs: number;
  initialMode: LearningMode;
}
export interface AttemptEvidence {
  correct: boolean;
  assisted: boolean;
  nowMs: number;
  latestExposureMs: number | null;
  probeAlreadySaved: boolean;
}
export interface EvidenceDecision {
  kind: 'probe_success' | 'probe_failure' | 'correction';
  eligible: boolean;
  rating: 1 | 3 | null;
  reason: 'independent' | 'help' | 'wrong' | 'recent_exposure' | 'already_recorded';
}
export interface CapabilityNeed {
  cardId: number;
  mode: LearningMode;
  group: 'relearn' | 'due' | 'missing' | 'initial';
  dueAt: string;
  eligibleAt: string;
  lastAttemptAt: string | null;
}
export interface WordEvidenceState {
  stage: WordStage;
  priority: boolean;
  stable: boolean;
  dueAt: string | null;
  weakModes: LearningMode[];
}
export interface LearningSummaryV3 {
  policyVersion: 3; day: string; started: boolean;
  total: number; touched: number; resolved: number;
  needsConsolidation: number; pendingLater: number; deferred: number;
  ready: number; backlog: number; newWords: number; reviewWords: number;
  attempts: number;
}
export interface LearningResultV3 {
  policyVersion: 3; correct: boolean; assisted: boolean;
  evidenceKind: EvidenceKind; independentlyRecalled: boolean;
  expected: string; meaning: string;
  nextDue: string | null; needsConsolidation: boolean;
}
```

`LearningTurnV3`为`idle | card | waiting | done`的判别联合：card复用原LearningCard并加policyVersion=3与reason；waiting须有nextAt和summary；done须有summary及`reason: 'resolved'|'retry_budget'|'technical_defer'`。补测暂缓和任务清空不能混成一个done文案。

写接口请求统一携带`policyVersion:3`。consult/exposure增加`eventId:string`；重试沿用同一eventId，新的一次真实阅读才新建eventId。answer沿用answerId幂等，不用answerId代替probe事件唯一键。

## Task 1：执行预检、基线和合成轨迹

**Files:** Create `app/scripts/preview-learning-v3.ts`, `app/test/learning-v3-helpers.ts`；更新本计划执行记录。

**Inputs:** 当前代码、已有数据库安全工具`readSnapshot/verifiedBackup`（`server/src/guard.ts`）。**Outputs:** 库外基线报告、无个人数据的experience fixture、明确新分支和可恢复备份。

- [x] 核对`git status --short --branch`及`git log -3 --oneline`，执行前按隔离规则建立分支。任何已有改动先保留，不自动stash/reset。
- [x] 在`app`执行`npm test`与`npm run typecheck`，将结果存库外证据目录；565项是旧交付历史，不预先声称本次仍通过。记录锁定依赖，无升级任务。
- [x] 合成fixture只插入experience/经验及足够的其他词；helper导出`makeLegacyFixture(n:number):DB`；v3 fixture在Task 3添加，answerCurrent在Task 5添加，避免前置提交引用尚不存在的实现。
- [x] `preview-learning-v3.ts`参数固定为`--synthetic`或`--db <path> --dry-run --report <path>`：实际库只用readSnapshot进入内存、去除答案明文后输出计数与受影响卡ID，不产生库旁WAL/SHM，不输出Key或个人答案。真实库写迁移须在启动预检完成备份后运行，dry-run不得替代该预检。
- [x] 导出旧行为：干净首答 vs 两次求助后第三次一分钟内改对；记录book、due、ratings、help数量，作为新旧对照。若复现与本设计不符先核查基线，不据猜测修改。
- [x] 提交：`test: add synthetic evidence-review migration fixtures`，只显式stage上述文件。

验证：真实库预览前后文件SHA一致；合成报告不含孩子记录；源码未改变出题行为。

## Task 2：纯证据规则与能力选择

**Files:** Create `app/server/src/learning/evidence-policy.ts`、`app/test/learning-evidence-policy.test.ts`；Modify `app/shared/learning.ts`。

**Interfaces:** 导出`REVIEW_POLICY:ReviewPolicy`、`classifyEvidence(input:AttemptEvidence,policy:ReviewPolicy):EvidenceDecision`、`chooseCapability(needs:CapabilityNeed[],now:Date):CapabilityNeed|null`。选择按设计分组/时间；缺证据组先按最久未作独立尝试排序（null最先），其他组按due，spell只在最终同级同时间时解平局。

- [x] 先写以下失败测试，再运行`npx vitest run test/learning-evidence-policy.test.ts`确认缺实现失败。

```ts
it('does not turn two helped corrections into an independent success', () => {
  const base = {correct:true, nowMs:60000, latestExposureMs:0,
    probeAlreadySaved:false};
  expect(classifyEvidence({...base, assisted:false}, REVIEW_POLICY))
    .toMatchObject({kind:'correction', eligible:false, rating:null});
  expect(classifyEvidence({...base, assisted:true}, REVIEW_POLICY))
    .toMatchObject({rating:1, reason:'help'});
});
it('accepts an independent success only after the exposure guard', () => {
  expect(classifyEvidence({correct:true, assisted:false, nowMs:300000,
    latestExposureMs:0, probeAlreadySaved:false}, REVIEW_POLICY))
    .toMatchObject({kind:'probe_success', eligible:true, rating:3});
});
it('does not hide an earlier-due listening need for spelling priority', () => {
  const need = (cardId:number, mode:LearningMode, dueAt:string):CapabilityNeed =>
    ({cardId,mode,group:'due',dueAt,eligibleAt:dueAt,lastAttemptAt:null});
  const t = new Date('2026-10-21T09:00:00+08:00');
  expect(chooseCapability([
    need(1,'spell','2026-10-21T00:30:00.000Z'),
    need(2,'dictation','2026-10-20T00:00:00.000Z')],t)?.mode).toBe('dictation');
});
```

- [x] 实现纯函数，不读系统Date、不查DB；rating仅Again=1/Good=3/null。先处理probeAlreadySaved，再处理帮助，再处理recent_exposure；单次因不会求助的有效题是失败，已保存失败后的填写为correction。基础最近暴露早于本题时若本就不合格则不应发题；防御分支不再造第二次失败。
- [x] 明确测试边界：299999ms vs300000ms、无暴露、未来暴露时间、正确/错误、重复事件；听写正常播放不输入assisted；缺证据优先不会被新词填充挤掉。
- [x] 添加同组同时间spell优先、缺证据dictation/recognize轮到前面、成熟卡未到期不因三日保护被提前拉出，以及空needs返回null的确定性例子；不写“比例应接近1/3”断言。
- [x] 定向测试和typecheck通过后提交`feat: define independent-recall evidence policy`。

## Task 3：增量schema、迁移预览和可恢复切换

**Files:** Create `evidence-migration.ts`、`test/learning-v3-migration.test.ts`；Modify `schema.ts`、`scripts/preview-learning-v3.ts`、`server/src/main.ts`；在helper添加makeV3Fixture。

**Interfaces:** `migrateEvidenceSchema(db:DB):void`只做幂等DDL；`activateEvidencePolicy(db:DB,now:Date):MigrationReport`在已验证备份的启动阶段调用；`MigrationReport={version:3,affectedCards:number,preservedLogs:number,verifiedEvents:number,unknownCards:number}`。helper在本任务新增`makeV3Fixture(n:number,now:Date):DB`，仅迁移合成内存库。备份验证在调用方完成且单测覆盖调用顺序，不接受外部HTTP传入“backupVerified=true”跳过安全流程。

- [x] 失败测试覆盖旧v2、未用过learning API的legacy库、空新库；同日有done/未答/求助、没有关联issue的旧review_logs；重复激活的行数和结果相同。
- [x] 新表DDL必须包含：learning_events的event_key唯一、每题probe部分唯一索引；learning_card_state以card_id为主键；learning_policy_meta键值；learning_v3_snapshots保存受影响card原行和原book/当前计划投影，不保存模型配置。外键与clearSample级联/显式清理均测试。
- [x] 激活事务先保存原投影/受影响card快照；原review_logs及result_json逐字节不改。明确求助/失败的卡保守重建活动FSRS并排复核，来源未知的卡保留原间隔但带verification_required，旧assisted=0成功不自动导入v3的延迟成功，不把unknown当成功或全词归零。
- [x] 旧当天40名单不换词；关闭旧未答issue、保留旧已存答案幂等重放；迁移后保留已练数量，不把旧done伪装成稳定证据。后台恢复未完成项时不重复消费补测次数。
- [x] main启动调用`verifiedBackup`保存库外备份后才激活；生产路径沿用guard拒绝，本轮不添加默认allow。内存fixture以serialize字节留存恢复点，不要求真实文件。
- [x] 故障注入在snapshots写完/激活中途抛错，验证事务回滚、version仍2、原日志SHA和card行未变；在副本上演练恢复，不自动覆盖实际用户数据。
- [x] `npx vitest run test/learning-v3-migration.test.ts test/learning-engine.test.ts`；旧教育断言的预期变化记录在Task 6再统一替换，迁移测试本身不依赖其绿灯。提交`feat: migrate recall evidence without erasing learning history`。

## Task 4：事件持久化与唯一FSRS写入

**Files:** Create `evidence-store.ts`、`test/learning-evidence-store.test.ts`；Modify `study.ts`、`engine.ts`。

**Interfaces:** 在本任务同步更新consultLearning的v3结构输入和v2兼容adapter；`saveProbe(db:DB,issueId:string,decision:EvidenceDecision,now:Date):{eventId:string,applied:boolean}`；`saveExposure(db:DB,{wordId,issueId?,eventId,reason},now:Date):void`；`readWordEvidence(db:DB,wordId:number,now:Date):WordEvidenceState`。saveProbe以issueId派生唯一probe键，决定权只在引擎，不能接受客户端自报eligible/rating。

- [x] 失败测试先复现consult一次+consult重试+抄对：FSRS仅一次Again；无Hard/Good；事件有failure、exposure、correction；同answerId重试返回同一结果。
- [x] 将现有review函数中FSRS更新/日志写入共用为一个适配点，v3参数显式`{request_retention:0.9,enable_fuzz:false,learning_steps:[],relearning_steps:[]}`；短期复核统一在verification_due，不能与库内steps双重计时；不能在两个模块各写一遍cards。correction和exposure只写事件，不调scheduler、不触发旧markCorrectForWrong。
- [x] consult保存失败与暴露后才回ok；answer的probe/correction、review_log附加记录、当天计数一起事务提交。有效帮助事件text_correct=null，后续correction可为true；总文本正确不等于提取成功。
- [x] 更新global latestExposure覆盖同词三型；答后学习只加exposure，不倒扣既有成功。每次真实阅读使用新eventId，HTTP/持久化重试复用eventId；跨同词兄弟卡仍受保护。
- [x] 首次/失败后的verification_due单独保存，首个间隔≥24小时的有效成功才清除“延迟验证待确认”；同日成功只推进短期学习，不清失败后重点标签。重点退出必须满足设计的跨日有效成功条件，不因最后改对删除失败。
- [x] 持久化测试检查raw result_json/旧review_logs未被重写、重复失败不重复计数、旧错词毕业不被correction推进。
- [x] `npx vitest run test/learning-evidence-store.test.ts test/study.test.ts`及typecheck；提交`fix: distinguish helped corrections from recalled answers`。

## Task 5：词级预算和能力队列

**Files:** Modify `engine.ts`、`policy.ts`、`selection.ts`；Create `test/learning-v3-queue.test.ts`。

**Interfaces:** 复用`learningToday/startLearning/nextLearning/answerLearning/consultLearning/deferLearning`，由meta分派v2/v3；v3返回上述契约。读接口不迁移数据，next只发符合due/guard/budget的issue。

- [x] 先补测试helper的`answerCurrent(db:DB,now:Date,correct:boolean,id:string):LearningResultV3`：获取当前open/card并按mode填合成正确答案，提交新answerId；fixture首次只有一词时initialMode=spell。再写关键轨迹测试，用注入Date推进，不真实sleep。

```ts
it('keeps experience for delayed verification after a helped correction', () => {
  const t0 = new Date('2026-10-21T09:00:00+08:00');
  const db = makeV3Fixture(1,t0);
  startLearning(db,t0);
  const first = nextLearning(db,t0); // v3 fixture initialMode=spell
  consultLearning(db,{policyVersion:3,issueId:first.card.issueId,eventId:'help-1'},t0);
  const result = answerCurrent(db,t0,true,'copy-1');
  expect(result).toMatchObject({independentlyRecalled:false,needsConsolidation:true});
  expect(nextLearning(db,new Date(+t0+60000))).toMatchObject({kind:'waiting'});
  const later = new Date(+t0+300000);
  answerCurrent(db,later,true,'delayed-1');
  expect(readWordEvidence(db,1,later)).toMatchObject({priority:true,stable:false});
  expect(nextLearning(db,later).kind).toBe('done');
});
```

- [x] 因consult接口v3改为结构输入，legacy签名保留adapter并版本保护；上面新签名在shared类型与Task 7客户端同步，不能让v2调用混进新记忆。
- [x] 40唯一名单在POST start冻结，复习优先再新词；一天重复start不换名单。未初始化兄弟卡不以初始due=now淹没队列；其缺证据义务按引入日期计算。
- [x] 同词每次通常一个目标能力，干净有效成功当天结束；困难词增加的独立补测最多2次。计数以eligible probe计算，抄写和重试不消耗独立预算；达到上限保留次日复核，不假报掌握。
- [x] 等待时返回waiting.nextAt及可退出信息；继续有其他可做词则先发其他词，不能因为首词冷却而卡住全部。未来义务、技术暂缓和全部完成三种状态分别输出。
- [x] 定向反例：汉译英成功听写失败；听写成功汉译英失败；认义会但不会拼；同级同due拼写优先；更早到期听写不被拼写压制；缺证据组按最久未尝试轮换，反复spell失败不饿死兄弟卡；有延迟成功的成熟卡不因三天规则提前复习；超40到期显示backlog并不补新词；首次干净通过不额外出三型。
- [x] 午夜测试：23:59曝光后00:01不算延迟成功；24小时门槛独立于上海日期。已存answerId跨日重放相同；未存旧题返回409，不重复计分。
- [x] `npx vitest run test/learning-v3-queue.test.ts test/learning-once.test.ts`；将仅对应被替代教育规则的断言改为新语义，保留幂等/技术边界。提交`feat: schedule capability reviews from evidence and due dates`。

## Task 6：统一视图、旧入口保护与可解释统计

**Files:** Modify `search.ts`、`word-status.ts`、`stats.ts`、`learning/routes.ts`、`server/src/app.ts`；Create `test/learning-v3-views.test.ts`、`learning-v3-metrics.test.ts`；更新`learning-routes.test.ts`、`lesson-status.test.ts`、`browse.test.ts`、`parent.test.ts`。

**Interfaces:** GET`/api/learning/views?view=<LearningView>&page=1`返回`{policyVersion:3,view,counts,items,total,page,size}`；exposure POST`/api/learning/exposure`；词详情增加`evidenceState`及每型证据摘要；旧book/status仍返回兼容key，但新页面用统一新投影。

- [x] 失败测试验证priority和due允许重叠、unknown不进stable、筛选总数不要求加起来等于全部；主页、词页、搜索、词表对同一词一致。
- [x] 增加查询和写入的输入验证：view白名单、正整数分页、eventId≤100字符、word/issue归属、policyVersion=3；请求不能自填rating、nextDue或stage。
- [x] 对v3已激活库保护`/api/review`、`/api/check`、`/api/answer`旧学习写入口以及对应offline路径，返回409与新入口提示。旧读接口保留。错词手动收藏类旧操作不得改v3能力状态。
- [x] 指标SQL按卡/日只取首个eligible probe：failure/help入失败，correction/exposure/technical_defer不入分母；距该能力前次有效尝试及同词最近答案暴露均≥24小时才另列延迟指标，零样本返回null。保存原始其他probe，不误把统计去重当调度去重。
- [x] 旧daily_stats文本正确和新版独立首测率分别标注，迁移不改历史打卡与已练天数，旧mastered_new不直接充当“新增较稳”。有效耗时使用客户端前台计时，仅展示，不自动Hard。
- [x] 用同一合成轨迹比较API/SQL结果和词视图，确保失败后最后改对仍首测失败；`npx vitest run test/learning-v3-views.test.ts test/learning-v3-metrics.test.ts test/learning-routes.test.ts test/parent.test.ts test/browse.test.ts`。
- [x] 提交`feat: expose evidence-based word views and first-recall metrics`。

## Task 7：专注卡片、词页曝光与前台计时

**Files:** Modify `LearningStudyView.vue`、`LearningHomeView.vue`、`WordBooksView.vue`、`ParentView.vue`、`WordView.vue`、`BrowseView.vue`、`App.vue`、`FocusStudyCard.vue`；更新`test/learning-ui.test.ts`及相关现有UI检查。

**Interfaces:** 写请求携带policyVersion=3；复用PendingSubmitter保证eventId/answerId重试；App发词页进入/退出事件触发exposure，不在GET词详情里隐式写库。

- [x] 先增加交互断言：原题保留、consult失败不先打开讲解；返回先保存exposure再恢复；答后可学习但只记暴露，不能倒扣原正确；保存未确认不可下一题。
- [x] 卡片反馈：独立成功“答对了 👍”；抄对“这次记住了，稍后再独立试试”；失败显示答案与学习入口；不显示熟悉/不熟羞辱性标签，不暴露内部评分参数。
- [x] 首页/结束页使用touched/resolved/pendingLater/needsConsolidation，不再将全部resolved表述全部掌握。示例文案：“今天练了40个词，8个还需巩固”；waiting展示“本段练习已结束，稍后还有2个词需要复查”，可回首页，无阻塞倒计时。
- [x] WordBooksView保留文件与导航入口，替换为设计中的可重叠筛选；词页能力详情紧凑展示，不影响默认发音拼写tab、AI侧栏和录音。
- [x] 前台计时在visibilitychange、props.active和xiaobei暂停时停止；恢复继续累计，讲解阅读不算答题时长。时间异常提交不影响rating，只标记计时不可用。
- [x] 定向UI检查后在隔离学习库用浏览器实测桌面/手机尺寸；按frontend-testing-debugging技能选择可用浏览器工具，不能把源文本断言冒充交互验收。核验横线、竖线、键盘Enter、👍和右上角按钮均保留。
- [x] 提交`ui: present consolidation and delayed recall without false mastery`。

## Task 8：Node与sql.js一致、迁移备份和持久化失败

**Files:** Modify `offline/runtime.ts`、`offline/storage.ts`、`scripts/mobile-seed.ts`、`mobile-assets.ts`、`VaultStore.java`、`MobileVaultPlugin.java`、`VaultStoreTest.java`；Create `test/mobile-learning-v3.test.ts`；更新`mobile-runtime.test.ts`、`mobile-sqlite.test.ts`、`mobile-seed.test.ts`及`mobile-storage.test.ts`（若执行时该文件不存在则新建）。

**Interfaces:** `learningStorage.createMigrationBackup(bytes:Uint8Array,version:3):Promise<void>`在原生调用`MobileVault.createMigrationBackup({version:3,data:base64})`，只允许v3专用固定文件名，不接受任意路径；浏览器用独立IndexedDB键`learning-pre-v3`。备份首次创建并回读哈希/大小校验，相同再次请求不覆盖，冲突明确失败。协议只保存学习DB，不读取profiles/Key。

- [x] 先写保存失败/迁移重启测试：加载旧snapshot→专用备份→内存迁移→写新槽→更新指针→显示页面，任何一步失败都不能回退新种子，也不能先宣布升级完成。
- [x] 原生备份用固定app-private文件、临时写入+fsync+原子重命名+目录同步，回读校验；重启保留，不被双槽轮换覆盖。失败不修改原指针，不能通过普通vault set绕过；不把完整DB放SharedPreferences。
- [x] startOfflineRuntime对existing saved和fresh seed都调用共享schema/激活逻辑；已有库先备份后激活，持久化成功才注册可写runtime。GET不静默激活。fresh库记录元数据但不产生个人练习事件。
- [x] 同一合成事件序列在better-sqlite3/sql.js分别执行并比较事件、cards、due、视图和summary；export/reopen后再比一次。计时注入相同，不能只比表是否存在。
- [x] store保存失败要保持原题及待保存请求，未确认新状态不能继续出题；进程内现有故障封锁不被重载解除。后台返回/断网重启保证暴露保护和补测预算不丢失。
- [x] 种子审计新增events/meta/state/snapshot个人表为空；只允许策略版本/默认配置所需固定值。不复制测试fixture或迁移备份到APK。
- [x] `npx vitest run test/mobile-learning-v3.test.ts test/mobile-runtime.test.ts test/mobile-sqlite.test.ts test/mobile-seed.test.ts`；原生仅显式`ANDROID_SERIAL=emulator-5556 ./android/gradlew -p android :app:connectedDebugAndroidTest`，先核对adb设备且不得自动换真机。
- [x] 提交`feat: persist evidence migration safely in offline Android`。

## Task 9：全量验收、包审计与候选交付

**Files:** Modify `app/README.md`、`app/ANDROID.md`；Create `app/qa/learning-v3/README.md`、`verification.json`；包版本涉及`android/app/build.gradle`和`offline/runtime.ts`现有version响应（执行时先查真实版本声明，禁止只改文件名）。

**Inputs:** Tasks 1—8可交互候选。**Outputs:** 可审阅行为轨迹、实测证据、1.0.2候选APK和SHA；未获合并/发送指令不外发。

- [x] 用合成经验词完整走：独立失败→求助→纠正→1分钟受保护→5分钟有效补测→次日不足24h不记延迟成功→足24h后独立成功。界面与底层事件/FSRS一致，无Hard，历史失败保留。
- [x] 验证反例：选择题会但拼不出、汉译英会但听写错、声音能拼但中文提取困难、技术暂缓、超过40到期、两次补测仍不会、答后再学、重复提交、暂停后台、跨午夜与保存失败恢复。
- [x] 执行一次全量`npm test`、`npm run typecheck`、`npm run build`、`npm run mobile:build`；失败先定位，不把旧565数量当硬目标，不删技术测试凑数量。新变化后只重跑受影响检查并在最终完整构建前确认全量结果。
- [x] 按已授权工作流由Codex审查schema/事务/幂等、评分语义与浏览器/安卓证据；不得以Coder自报或截图单独宣布完成。需要额外独立agent审查时先确认本轮有明确授权，不在此计划中自动派生团队。
- [x] 在任务模拟器用原同签名1.0.1合成学习库覆盖升级；飞行模式开启、Wi-Fi关闭。分别记录升级前后词数、旧日志摘要、AI配置是否仍存在（不打印值）、专用迁移备份存在和哈希；强制结束冷启动后任务、事件和等待时间保持。全新安装用独立测试包/隔离实例，不能卸载已有正式数据来伪造首启验收。
- [x] 构建1.0.2/versionCode3，沿用源码库外签名；APK校验zipalign、apksigner、manifest、资源逐字节、1608录音哈希与干净种子。原生变动执行lintDebug和上述instrumentation并记录实际数量。
- [x] 库外保存APK、安装说明、SHA、测试日志及截图；仓库qa仅保留摘要、命令、实际源码提交、完成/未验边界，不放APK/原始DB/Key/原始Coder会话。
- [x] 在隔离副本演练迁移前备份恢复，说明恢复会丢失切换后进度；不要把安装旧包当安全回滚。
- [x] 提交`docs: verify evidence-based review and Android upgrade`。按AGENTS约定在实际交付里程碑询问是否追加Wiki；计划的归档授权不自动等于新APK里程碑的归档授权。

## 2. Coder的任务边界与验收门

Codex负责：设计、参数语义、迁移/恢复、FSRS评分映射、调度取舍、最终审查与真实验收。Coder承接规则明确且能用合成fixture验证的小任务，例如纯策略单元、类型、分页视图、限定Vue组件；迁移安全及跨平台整合不整包交给Coder自由发挥。

执行时每次先读`~/.codex/memories/claude-code-routing.md`并核验本机路由，使用实际`claude --model coder`，关闭不必要MCP/外部服务，不以CLI自报模型名判断后端。不在计划中复制带token配置或复用云端Key。不运行本轮尚未核验的CLI旗标组合；先从本机help确认。

每个Coder委托包含：精确文件白名单、上面的输入输出类型、2—5个失败案例、允许运行的测试命令、明确禁止项和本轮时间/输出边界。先提供合成数据，模型只输出草稿或在限定文件实现；Codex检查diff、运行指定测试后才接下一任务。结构错误、扩大范围、修改测试掩盖失败、绕过事务任一出现即退回；一次有界修正仍不合格由Codex接手，不无限重试。

建议委托顺序：Task 2纯函数→Task 6只读视图的一小块→Task 7已定文案的组件。Task 3/4/5核心语义、Task 8原生持久化由Codex主写，Coder只做有明确断言的辅助。没有要求必须为每个代码动作调用CLI；维护模型调用记录但不把大段原稿入库。

## 3. 最终验收矩阵

| 要求 | 必须通过的证据 | 负责任务 |
|---|---|---|
| 提示后填对不等于独立成功 | consult幂等、Again一次、correction不调FSRS | 2、4、5 |
| 第三次短时改对不晋级 | 最近暴露保护、重点保留、延迟复核 | 2、4、5、9 |
| 会的词不被强刷九题 | 首次干净成功当日结束，剩余能力跨日债务可见 | 5 |
| 拼写优先而非均分 | 同级优先、逾期听写不饿死、无比例断言 | 2、5 |
| 三型不互相冒领通过 | 三种反例的每卡状态与视图 | 4、5、6 |
| 40唯一词与题数分开 | 冻结名单、补测计数、backlog与未完状态 | 5、7 |
| 等待不阻塞也不假报全会 | waiting/预算/技术暂缓文案与返回 | 5、7 |
| 全页面状态一致 | 首页、词页、词表、筛选、家长API同源投影 | 6、7 |
| 旧数据不丢且不虚构 | 原日志摘要、迁移幂等、unknown边界、恢复演练 | 1、3、8、9 |
| 安卓断网与保存失败 | sql.js与Node一致、原生故障测试、升级冷启动 | 8、9 |
| 内容资源不退步 | 1600/1608/813/819、录音哈希、干净种子 | 9 |

## 4. 自检与交接状态

- 设计每条要求已映射任务；API改动覆盖Node与offline；原生备份新增能力有单独测试；老页面状态映射列入范围。
- 候选5分钟/2次/3日/稳定筛选及首遇汉译英均明示为本计划待审阅产品值，不称已获研究验证。决定接受计划后按该明确候选执行，若用户改参数先修设计与单测案例。
- 已按用户2026-10-21“实施”指令完成。下方是实际执行记录；611项为本轮新跑结果，565仅作执行前基线。


## 5. 实际执行与验收（2026-10-21）

已完成Tasks1—9，分支 `feat/evidence-based-review`，独立托管worktree。应用实现截至`cd1b887`，最后仅补积压测试与本交接文档。产出Android1.0.2/versionCode3；未合并推送、未操作真机、未邮件外发。

- 基线：76文件/565测试；本轮：85文件/611测试，类型检查、Web/mobile/release构建通过。原生存储16项与lintDebug通过。
- Task1 `2bbd3aa`；Task2 `6d90f13`；Task3 `ef80d98`；Task4/5因共享事务与公开接口合为`cc37724`；Task6 `0081965`；Task7 `15ea929`；Task8 `20d2e91`；边界与离线读取优化`cd1b887`。没有以v2断言替代v3验收；保留v2兼容测试，新增显式激活的v3轨迹。
- Coder执行2次本地Ollama草稿。第一轮二次排序破坏最久未练优先，测试抓到后Codex修正；第二轮旧book映射及初始化遗漏也由Codex修正。没有启动额外代理。
- 阅读事件用独立LessonNavigation保留eventId与导航回调，答案仍用PendingSubmitter。sql.js先复制输入；原生备份改用文件锁+原子rename，原因是实际Android拒绝硬链接。首次原生编译的阻碍是新worktree缺少Capacitor生成目录，补齐后跑实际故障测试。
- 桌面/手机浏览器跑通experience完整交互、纠正/独立成功、等待/返回、重点筛选，控制台无错误。浏览器IndexedDB故障与恢复演练通过。
- 指定模拟器从1.0.1同签名覆盖升级，备份SHA匹配旧确认快照、旧3条日志逐字段保留；断网听写people、答后学习及原卡返回、冷启动保持通过。独立debug包首启个人表全零。
- APK有1600词、1608份录音；813多音节词/819映射内容测试保持。个人表种子全空，资源逐字节、录音哈希、签名/版本/zipalign验证通过。

可复核结果及交付边界：[QA说明](../../../app/qa/learning-v3/README.md)、[verification.json](../../../app/qa/learning-v3/verification.json)。库外日志、模拟库、截图、APK在`/Users/caogong/Documents/Codex/2026-10-21/vocab-evidence-review/`。真机、长期学习效果及试用参数效果仍待实际使用验证。
