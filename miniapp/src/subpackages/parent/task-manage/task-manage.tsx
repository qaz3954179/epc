import { View, Text, WebView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../../../store';
import './task-manage.scss';

const WEB_BASE = process.env.TARO_APP_WEB_URL || '';

export default function TaskManagePage() {
  const { token } = useAuthStore();
  const webUrl = `${WEB_BASE}/tasks?token=${token || ''}`;

  if (!WEB_BASE) {
    return (
      <View className='page-container task-manage'>
        <View className='task-manage__placeholder'>
          <Text className='task-manage__icon'>📋</Text>
          <Text className='task-manage__title'>任务管理</Text>
          <Text className='task-manage__desc'>
            任务管理功能需要在 Web 端操作，请使用浏览器访问管理后台。
          </Text>
          <View className='task-manage__btn' onClick={() => {
            Taro.setClipboardData({
              data: 'https://epc.example.com/tasks',
              success: () => Taro.showToast({ title: '链接已复制', icon: 'success' }),
            });
          }}>
            <Text>复制链接</Text>
          </View>
        </View>
      </View>
    );
  }

  return <WebView src={webUrl} />;
}
