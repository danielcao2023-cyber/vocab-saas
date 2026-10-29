# 异读词旧版至新版：安卓隔离升级验收

2026-10-30 在 Android 模拟器 `emulator-5556` 测试：从旧提交 `6978cf98` 和新提交 `c4bfac79` 的源码分别构建临时 debug APK；两者使用专属隔离 applicationId `cn.xiaobei.vocabulary.upgradeaudit20261030`，签名证书 SHA-256 一致、versionCode 均为 3。用 Android SDK 官方 adb 对同一模拟器执行覆盖安装 `install -r`，返回 Success。该包与原应用、原 debug 包的 applicationId 不同；未操作真机或原应用学习数据，未发布 APK。

构建两份 APK 时曾因测试构建共享 Capacitor Android 中间目录出现旧临时包缺类；将旧、新依赖模块复制为相互隔离目录、串行重建后旧包正常启动。此问题发生在临时测试构建中，不能据此判断正式发布包存在同一缺陷。

## 旧数据与准备

旧包使用无既有学习记录的公开数据源副本初始化。测试通过旧版应用 API 提交一次正确拼写答题；确认隔离包活跃快照为 catalog v158、学习策略 v3、1 条 review_log，且 `learning_issues` 没有 `audio_variant` 列。然后停止该隔离包，在其临时快照中**人为构造**一条同日未答的 bow 听写题并回写隔离包。人工构造的题目仅用于覆盖旧 schema 的迁移，并未在升级前实际播放，不能说明历史设备播放了何种读音。

升级前测试快照 SHA-256 为 `a02c229a224b76defb0fc8948efbf0bff2b8d20db64a7d1e0d487dcfe4199211`；adb 从隔离包回读的活跃文件与该值相同。

## 覆盖安装和恢复结果

- 新包安装并启动后，隔离应用目录生成 `learning-pre-dictation-variant-v1.db`；回读 SHA-256 与升级前活跃快照一致，说明迁移备份包含原样升级前数据。
- 后续生成 `learning-pre-vocabulary-159.db`，其中 catalog 仍为 v158，旧听写题已经记录为 noun；新活跃库 catalog 为 v159，原未答题保持原题 ID、未答状态并绑定 noun。
- 升级前后 review_logs 的全部行逐行一致；先前测试答题的已答 issue 和答题时间仍在。真实新版 WebView 点击“继续背单词”后，实际 `Audio` 来源为本地 `bow-noun-28cb5360e5f7.mp3`。
- 强制停止并重启隔离应用后，学习 API 再次返回同一未答 bow 题与 noun 绑定。测试仅观察文件和请求，**未人工听审**，不证明扬声器输出或音质。

测试后通过 adb 卸载临时隔离包、移除该测试的端口转发和 `/data/local/tmp` 临时文件；检查原 `cn.xiaobei.vocabulary`、`cn.xiaobei.vocabulary.debug` 包仍存在。用于核验的脱敏测试快照和构建日志留在本机 `/tmp/xiaobei-android-upgrade-old`、`/tmp/xiaobei-android-upgrade-new`，并非交付产物。

## 验证边界

本次是 debug 证书、相同 versionCode 的隔离覆盖安装，只证明这一测试包组合的升级过程；不证明正式发行签名、versionCode 增长及回退策略、真实手机、其他安卓版本或设备存储状态。测试未覆盖旧题升级前真实播放、contract 的真实设备升级或离线新发 verb 题，也未验证人工听感。仓库中的其他在线/离线自动化测试覆盖部分异读词和题目交错，但不能替代上述设备场景。
