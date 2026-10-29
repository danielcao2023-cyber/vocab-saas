# LJSpeech 官方包和逐句检索（2026-10-30）

**后续完整校验：**官方包已下载到隔离临时目录 `/tmp/ljspeech-official-verify-20261030/`，实得 2,748,572,632 字节；实际 SHA-256 `be1a30453f28eb8dd26af4101ae40cbf2c50413b1bb21936cbcdc6fae3de8aa5` 与下述 PyTorch 值一致。顺序读取压缩包，同 ID 的五条镜像 WAV 与官方文件逐字节一致；独立数据见 `ljspeech-official-five-byte-comparison-2026-10-30.json`。下载日志为临时目录 `download.log`，完整包及音频不进入仓库。这只验证五条，不能推断镜像全部一致；未人工试听、未切段。下文关于未下载与未比对描述是校验前的历史状态。

## 实测和校验信息

- [官方 1.1 压缩包](https://data.keithito.com/data/speech/LJSpeech-1.1.tar.bz2) HEAD 返回 2,748,572,632 字节（约 2.56 GiB）。本次请求字节 `0-1023` 返回 HTTP 206、`Content-Range: bytes 0-1023/2748572632`，实际得到 1,024 字节。HTTP Range 可用并不意味着能够直接随机提取压缩 tar 中的任意音频：需要可用的压缩块索引和解码方案，或顺序流式解包。
- [PyTorch torchaudio 的 LJSpeech 数据集实现](https://docs.pytorch.org/audio/2.0.1/_modules/torchaudio/datasets/ljspeech.html)给该官方 URL 列出期望 SHA-256 `be1a30453f28eb8dd26af4101ae40cbf2c50413b1bb21936cbcdc6fae3de8aa5`。这是第三方公布的校验值；本次未下载完整包、未亲自计算其完整哈希，也未取得数据集作者另行发布的校验值。
- [逐句镜像](https://huggingface.co/datasets/flexthink/ljspeech) 的 README 标示 1.0，并介绍 1.1 移除了 30 个没有对应文本的音频；这并不证明具体镜像文件与 1.1 官方包逐字节一致。五个已下载句子与官方包的相同 ID 尚未比对。

## 匹配和低成本获取方法

同目录 `ljspeech-42-phrase-index-2026-10-30.json` 保存本轮高中缺口与镜像 metadata 的文本筛选结果：42 个不同目标短语至少有一条嵌入句，按各短语计共有 224 次句内命中（同一句可能计入多个目标），精确整条文本命中数为 0。42 个总数包含已保存的五项，并非另外 42 项；按目标词组计还有 37 项未在上述五条样本中覆盖。每项 `embeddedSample` 是样本而非该词组所有命中，完整筛查须重新扫描 metadata。原始 metadata 本次 SHA-256 为 `852bce5c79e5184ba5bf2ea98aad4bcf49a5d787def5fd1f04fa2ab8aa6dc535`。

可先依据 metadata 的 ID、原句和规范化文本筛选语境，逐个请求 `https://huggingface.co/datasets/flexthink/ljspeech/resolve/main/wavs/<ID>.wav`，核对 HTTP 状态、文件格式和实际 SHA-256，记录请求 URL、数据集版本、原句及原始作者与许可来源。实际 HEAD 检查 `LJ001-0100`、`LJ048-0075`、`LJ014-0291` 的镜像文件可访问，大小分别为 378,726、292,710、316,262 字节；这三条仅检查头信息，未下载或听审。此方法无需取得完整官方包，但仍须处理镜像与官方原包一致性及授权核验；数量和文件大小不代表所有候选均可成功取得或适合截段。

[LJSpeech 官方说明](https://keithito.com/LJ-Speech-Dataset/)称数据是 public domain；[LibriVox 说明](https://librivox.org/pages/public-domain/)称录音在美国属于公有领域，其他地区可能不同。镜像来源、逐文件哈希、上游数据版本及适用地区权利需分别保留和核查；不可直接等同全球 CC0。文本匹配、自动转写或自动切分均不是人工听审；导入前仍需验证词组边界、发音和教学适配。本次未接入音频或修改 manifest。
