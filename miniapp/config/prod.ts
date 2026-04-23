import type { UserConfig } from '@tarojs/cli';

export default {
  env: {
    TARO_APP_API_URL: '"https://api.epc.example.com"',
  },
  mini: {},
  h5: {},
} satisfies UserConfig;
