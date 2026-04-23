import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../../../store';
import { api } from '../../../services/api';
import type { LoginResponse, UserPublic } from '../../../types';
import './login.scss';

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleWechatLogin = async () => {
    try {
      setLoading(true);
      const { code } = await Taro.login();
      const res = await api.post<LoginResponse>('/oauth/wechat/callback', { code });
      const user = await api.get<UserPublic>('/users/me');
      setAuth(res.access_token, user);

      if (res.is_new_user) {
        Taro.redirectTo({ url: '/subpackages/parent/child-manage/child-manage?new=1' });
      } else if (user.roles?.length > 1) {
        showRoleSelector(user);
      } else {
        Taro.switchTab({ url: '/pages/index/index' });
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Taro.showToast({ title: '请填写邮箱和密码', icon: 'none' });
      return;
    }
    try {
      setLoading(true);
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post<LoginResponse>('/login/access-token', formData.toString());
      const user = await api.get<UserPublic>('/users/me');
      setAuth(res.access_token, user);
      Taro.switchTab({ url: '/pages/index/index' });
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const showRoleSelector = (user: UserPublic) => {
    Taro.showActionSheet({
      itemList: ['👤 家长 - 管理宝贝的学习计划', '👶 我是宝贝 - 打卡、兑奖品'],
      success: (res) => {
        const { switchRole } = useAuthStore.getState();
        switchRole(res.tapIndex === 0 ? 'parent' : 'child');
        Taro.switchTab({ url: '/pages/index/index' });
      },
    });
  };

  return (
    <View className='login-page'>
      <View className='login-page__header'>
        <Text className='login-page__logo'>📚</Text>
        <Text className='login-page__title'>EPC 教育平台</Text>
        <Text className='login-page__subtitle'>让学习更有趣</Text>
      </View>

      <View className='login-page__actions'>
        <View className={`login-page__btn login-page__btn--wechat ${loading ? 'login-page__btn--loading' : ''}`} onClick={handleWechatLogin}>
          <Text>微信一键登录</Text>
        </View>

        <View className='login-page__divider'>
          <View className='login-page__divider-line' />
          <Text className='login-page__divider-text'>或</Text>
          <View className='login-page__divider-line' />
        </View>

        {showEmail ? (
          <View className='login-page__email-form'>
            <Input
              className='login-page__input'
              placeholder='邮箱'
              type='text'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
            <Input
              className='login-page__input'
              placeholder='密码'
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className={`login-page__btn login-page__btn--email ${loading ? 'login-page__btn--loading' : ''}`} onClick={handleEmailLogin}>
              <Text>登录</Text>
            </View>
          </View>
        ) : (
          <View className='login-page__btn login-page__btn--secondary' onClick={() => setShowEmail(true)}>
            <Text>邮箱登录</Text>
          </View>
        )}
      </View>

      <View className='login-page__footer'>
        <Text className='login-page__link'>没有账号？注册 →</Text>
      </View>
    </View>
  );
}
