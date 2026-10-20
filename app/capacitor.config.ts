import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cn.xiaobei.vocabulary',
  appName: '小北记单词',
  webDir: 'mobile-dist',
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f5f3ee',
  },
};

export default config;
