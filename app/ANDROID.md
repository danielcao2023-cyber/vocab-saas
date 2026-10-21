# 小北记单词 Android 本地安装包

包名 `cn.xiaobei.vocabulary`，版本 `1.0.2`（versionCode 3）。最低 Android 6 / API 23，构建与目标 API 35。应用使用 Capacitor 7 和本地 `mobile-dist`；不需要电脑服务或局域网地址。首次安装没有学习记录或 AI 配置；后续学习数据保存在当前设备私有目录，以两份 SQLite 快照和已确认指针保护持久化。AI 仅在用户自行配置后发起在线请求。

## 1.0.2 独立回忆升级（2026-10-21）

已实现证据驱动复习：求助记失败、抄对记纠正，答对一次可结束当天；近期暴露保护、两次独立补测上限、按能力到期/缺证据安排复核。入口改为可重叠的待复习/重点巩固/长期较稳等筛选。试用参数和验收见 [learning-v3/README.md](qa/learning-v3/README.md)。

用同一签名覆盖安装保留旧记录和AI配置。首次切换v3会在应用私有目录生成独立 `files/learning-pre-v3.db` 并验证；该文件不随a/b存档轮换覆盖。`MobileVault.createMigrationBackup({version:3,data:base64})` 仅接受固定版本和路径；普通set/remove不能修改备份字段。备份或存储失败会保留旧数据并停止继续，不回退空种子。恢复仅在隔离副本演练；降级安装旧APK不等于安全回滚，恢复旧备份会失去切换后的新进度。

本轮611项Web/共享引擎测试、16项原生存储测试与lint、类型检查、桌面/移动/release构建通过；Android15模拟器断网覆盖升级与冷启动验证通过，真实手机需安装后补验。内容维持1600词、1608录音、813多音节条目/819映射。完整审核结果见 [verification.json](qa/learning-v3/verification.json)。

## 构建

需要 Node/npm、JDK 21、已安装且已接受许可的 Android SDK API 35 / build-tools 35.0.0。已设置 `android.builder.sdkDownload=false`，仅使用现有 SDK；此流程不运行 `sdkmanager --licenses`，也不接受额外条款。Gradle wrapper 8.14.3 首次构建需要下载已有配置对应的 Maven 依赖。

在 `app` 目录运行：

```sh
npm ci
npm run mobile:build
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
./android/build-local-release.sh
```

脚本检查 `mobile-dist/offline/seed.db` 和 `offline/sql-wasm.wasm` 存在后，先 `cap sync android`，只复制 `mobile-dist`，然后构建 release、zipalign、本机签名并校验。输出：

- `android/app/build/outputs/apk/release/xiaobei-vocabulary-1.0.2.apk`
- 同路径 `.apk.sha256` 文件

这是本机签名、可直接安装的 APK。签名材料保存在源码目录外的 `~/.codex/signing/xiaobei-android`，目录权限 700、文件权限 600。可以通过 `XIAOBEI_SIGNING_DIR` 指定独立安全目录；不要把该目录、密钥或密码文件加入仓库。后续覆盖安装必须保留同一签名密钥。已有签名材料不完整时脚本会停止，避免意外替换密钥。

## 安装

将 APK 传到手机，在系统提示下允许对应文件管理器“安装未知应用”，点击 APK 安装。首次打开建议关闭网络，确认词典、背词和已打包发音正常；录音缺失时按界面提示处理。卸载会删除本机学习记录与配置。应用关闭 Android 云备份和设备迁移备份。

ADB 安装请显式指定设备序列号；先运行 `adb devices -l` 核对设备。仅示例模拟器：

```sh
"$ANDROID_HOME/platform-tools/adb" -s emulator-5556 install -r \
  android/app/build/outputs/apk/release/xiaobei-vocabulary-1.0.2.apk
"$ANDROID_HOME/platform-tools/adb" -s emulator-5556 shell am start \
  -n cn.xiaobei.vocabulary/.MainActivity
```

不自动安装到真机。覆盖安装保留数据；若曾安装不同签名的调试包，需要先卸载，该操作会删除原本机记录。

## 原生接口与验证

`MobileVault` 提供 `get({key}) → {value: string | null}`、`set({key,value})`、`remove({key})`，以及 `writeSnapshot({slot: 'a' | 'b', data: base64}) → void`。Web 端可用 `registerPlugin('MobileVault')` 调用。配置 JSON 在 AndroidKeystore 生成的 AES-256 密钥下使用 GCM 加密，随机 IV、存储字段作为 AAD；密文保存在 app-private SharedPreferences。写入与删除 `commit()` 成功才返回。学习快照仅允许原生合并方法写入：先校验当前指针，拒绝覆盖当前已确认槽，再写入另一个 app-private 文件、同步文件和父目录，最后提交加密指针。`learning-slot-v1` 是保留字段，普通 set/remove 无法修改。任何提交失败或快照写入/同步失败都会在进程内静态标记存储不可用，后续所有 get/set/remove/writeSnapshot 均拒绝；Activity 重建和 WebView 重载无法清除该状态，完整进程重启后才重新从磁盘读取。若指针为空而 a/b 快照已有任何一份，或指针指向的文件缺失，则明确报错并保留数据，不能当作全新安装。读取失败不回退明文。Capacitor 日志关闭，插件错误不包含输入值。

返回键派发可取消的 `window` 事件 `xiaobei:back`。Web 同步调用 `event.preventDefault()` 消费弹窗/页面返回；无人消费时，原生按 WebView 历史返回，根页退出。Android system bars/cutout 用实际 WindowInsets 为内容预留空间。

调试构建包名为 `cn.xiaobei.vocabulary.debug`，与正式包分离；原生测试只安装到显式指定模拟器，不覆盖正式应用：

```sh
npm exec cap sync android
ANDROID_SERIAL=emulator-5556 ./android/gradlew -p android :app:connectedDebugAndroidTest
```

测试覆盖：首读为空、密文中无输入明文、重新创建存储实例后读取、重复写入随机 IV、删除后为空、GCM 拒绝跨字段密文、损坏记录拒绝且保留；并覆盖内存值已更新后的 commit(false)、set/remove 失败封锁、重新实例化后仍封锁、半写/同步失败保留旧槽与旧指针、指针丢失或当前槽丢失拒绝、禁止绕过合并写入。测试 APK 不属于交付包。完整交付还需核验 APK ZIP 仅包含审计过的词条种子/录音，实际模拟器断网学习后强制结束并冷启动验证进度、页面返回与发音；真机兼容性需在实际设备补验。

原生安全机制参考 Android 官方文档：[Android Keystore / AES GCM](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec)、[禁用 Gradle 自动下载 SDK](https://developer.android.com/studio/intro/update#download-with-gradle)。

## 本轮已验证范围（2026-10-20）

在现有 `pixel_6` ARM64 AVD（Android 15 / API 35，`emulator-5556`）上，原生存储 instrumentation 12 项测试通过；`lintDebug` 与 release 构建通过。已用本机独立签名 APK 覆盖此前测试壳并启动，未安装到物理手机。APK 已通过 ZIP 完整性、zipalign、apksigner v1/v2/v3 与清单核验，release 不含 debuggable、备份或明文流量许可。

首版包包含 1600 份讲解和 1599 份录音，词库为 1600 个词与 4670 条词形；学习、反馈、AI任务/缓存等个人表均为空，9 项学习设置逐项匹配代码固定默认值。打包资源与 `mobile-dist` 逐字节对应，额外仅 Capacitor 生成的两个空 Cordova 兼容文件。签名及包内容报告在 `android/build/reports/xiaobei-signature.txt`、`xiaobei-apk-audit.json`；这些报告与 SHA256 应在每次重建后更新。页面与学习流程的完整离线验收由集成流程记录，以上不代表真机验收已完成。

本轮 GUI 验收的模拟器通过库外 macOS `.app` 包装识别（官方 Qt 可执行文件本身没有应用 bundle，CUA 无法按“Android Emulator”找到它）。当前可用 `cua.getApp('cn.xiaobei.android-emulator')`，窗口名 `Android Emulator - pixel_6:5556`。包装位置为 `~/.codex/tools/xiaobei-emulator/Xiaobei Android Emulator.app`，未修改 SDK 原文件，不属于 APK；AVD 磁盘数据在重开时保留。需要继续使用时应保留该本机包装，应用在手机运行不依赖它。

存储审查后的原生构建与失败注入证据位于 `android/build/reports/storage-review-build.txt` 和 `storage-review-tests.txt`；已将修复后的原生代码与采用 writeSnapshot 的 Web 输出共同重建，并以同签名覆盖安装；更新前后均在断网状态读回原有 40 词计划和已完成 0 个状态。覆盖安装未卸载正式应用。

## 集成验收结论

2026-10-20 在用户明确允许 Android 官方 adb/测试框架后，仅对 emulator-5556 进行操作；飞行模式开启且 Wi-Fi 关闭。实际验证汉译英 as 独立答对进入熟悉、听写 people 播放本地录音并在看过讲解后正确标记“稍后独立再测”、下一题切换英译汉 government 且正确判分。答题后“学习该词”仍可点击，government 默认“发音与拼写”内容可离线显示。系统返回从讲解回原卡片、从卡片暂停回首页；强制停止并冷启动后已完成 1 个、熟悉 1 个、不熟 1 个、生词 1598 个保持一致，继续学习回到 government。离线搜索 animal 命中并能打开讲解。AI 对话为空、已配置模型为空，未保存测试 Key，也未调用真实云模型。媒体系统记录到应用 UID 的 44.1kHz 本地播放及非零输出帧；没有以此声称对全部录音进行了逐条听审。

应用全量 Vitest 为 75 文件 / 556 项通过，移动和桌面构建通过；原生存储 12 项失败注入测试通过。独立审查发现的 commit(false) 内存指针与空指针误判首启问题已修复并复审。本次未操作物理手机或原电脑学习库。验收截图和测试日志保留在 Studio 的 `/Users/caogong/Documents/Codex/2026-10-20/vocab-android/`，测试中产生的记录仅在模拟器，分发 APK 的种子个人表仍为零。

## 1.0.1 内容更新（2026-10-20）

上面的 1599 录音、31 个拼写对照属于 1.0.0 历史快照。1.0.1 补齐剩余 782 个多音节课程条目，813 个候选条目全部覆盖；混合词条拆开计为 819 份独立拼写对照。内置录音增至 1608 份：1600 个主词全部有录音，另含 actress、anyone、empress、everyone、hostess、policewoman、princess、someone 8 个补充词形。underground 使用英式名词首音节重读录音与对应映射；actress 的实际 /ɪs/ 尾音变体与图中 /əs/ 差异在界面说明。

新增混合词形选择，播放和失败重试跟随所选词，保留 Chinese/Mr 等原始大小写；切换词形会停止旧录音并忽略迟到错误。按钮改为中性“听整词录音”，说明实际录音口音。服务端仅在课程已有主词范围内支持混合词条的各词形。

本轮 76 文件 / 565 项测试、类型检查、桌面与移动构建通过；在独立静态离线页面验证默认 tab、分段提示、actor/actress 切换和录音说明，浏览器错误/警告日志为空。Android15模拟器在飞行模式且Wi-Fi关闭时加载新版、播放underground与actress；同签名覆盖1.0.0后强制关闭再启动，原已完成2、熟悉2、不熟1、生词1597保持。打包种子仍是零个人记录，不含模拟器验收状态。APK ZIP资产与mobile-dist逐字节一致，1608录音哈希和许可元数据均匹配；签名证书沿用原证书。

交付目录 `/Users/caogong/Documents/Codex/2026-10-20/vocab-android/`，文件 `小北记单词-1.0.1-离线版.apk`、`安装说明-1.0.1.md`、`SHA256-1.0.1.txt`。原始模型草稿、截图、构建/测试和APK审计证据在同日期的 `vocab-sound-spelling-complete/`，不进入源码包或学习数据库。
