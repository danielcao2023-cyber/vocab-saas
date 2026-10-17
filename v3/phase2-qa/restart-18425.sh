#!/bin/bash
# 只管 18425（第二期测试实例）：停掉 wt-v3p2 启动的实例，用 base-18425.db 的新副本重启。
# base-18425.db = 第一期合成历史库 hist-b4429a2.db + 词形 + 日常高频(ECDICT) + 模拟模型中考打分 + 试点词模拟讲解；由 setup-18425.mts 生成。
set -e
Q=/workspace/vocab-saas/v3/phase2-qa; W=/workspace/vocab-saas/wt-v3p2
pid=$(ss -ltnp | grep '127.0.0.1:18425 ' | grep -o 'pid=[0-9]*' | cut -d= -f2 || true)
if [ -n "$pid" ]; then [ "$(readlink /proc/$pid/cwd)" = "$W" ] && kill $pid; sleep 1; fi
mkdir -p $W/data
cp $Q/base-18425.db $W/data/qa-v3p2.db; rm -f $W/data/qa-v3p2.db-wal $W/data/qa-v3p2.db-shm
cd $W && PATH=/workspace/vocab-saas/.node/bin:$PATH PORT=18425 HOST=127.0.0.1 DB_PATH=data/qa-v3p2.db STATIC_DIR=$Q/dist-18425 nohup npx --no-install tsx server/src/main.ts > $Q/server-18425.log 2>&1 &
for i in $(seq 1 20); do curl -sf localhost:18425/health >/dev/null && break; sleep 0.5; done; curl -s localhost:18425/health; echo
