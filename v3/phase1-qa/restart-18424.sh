#!/bin/bash
# 只管 18424：停掉本目录启动的实例，用合成历史库的新副本重启
set -e
Q=/workspace/vocab-saas/v3/phase1-qa; W=/workspace/vocab-saas/wt-v3
pid=$(ss -ltnp | grep '127.0.0.1:18424 ' | grep -o 'pid=[0-9]*' | cut -d= -f2 || true)
if [ -n "$pid" ]; then [ "$(readlink /proc/$pid/cwd)" = "$W" ] && kill $pid; sleep 1; fi
cp $Q/hist-b4429a2.db $W/data/qa-v3-hist.db; rm -f $W/data/qa-v3-hist.db-wal $W/data/qa-v3-hist.db-shm
cd $W && PATH=/workspace/vocab-saas/.node/bin:$PATH PORT=18424 HOST=127.0.0.1 DB_PATH=data/qa-v3-hist.db STATIC_DIR=$Q/dist-18424 nohup npx --no-install tsx server/src/main.ts > $Q/server-18424.log 2>&1 &
for i in $(seq 1 20); do curl -sf localhost:18424/health >/dev/null && break; sleep 0.5; done; curl -s localhost:18424/health; echo
