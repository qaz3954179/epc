import type { UserConfig } from '@tarojs/cli';

export default {
  env: {
    TARO_APP_API_URL: '"https://api-dev.epc.example.com"',
  },
  mini: {},
  h5: {},
} satisfies UserConfig;
