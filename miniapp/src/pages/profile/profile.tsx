import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';
import ProfileHeader from '../../components/ProfileHeader';
import MenuItem from '../../components/MenuItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ChildPublic, ReferralStats, AchievementSummary } from '../../types';
import './profile.scss';

export default function ProfilePage() {
  const { user, role, switchRole, logout } = useAuthStore();
  const [children, setChildren] = useState<ChildPublic[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [achievementSummary, setAchievementSummary] = useState<AchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (role === 'parent') {
        const [childList, refStats] = await Promise.all([
          api.get<ChildPublic[]>('/children/'),
          api.get<ReferralStats>('/referrals/stats').catch(() => null),
        ]);
        setChildren(childList);
        setReferral(refStats);
      } else {
        // child role: fetch achievement summary
        const [achSummary] = await Promise.all([
          api.get<AchievementSummary>('/achievements/child/summary').catch(() => null),
        ]);
        setAchievementSummary(achSummary);
      }
    } catch (err) {
      console.error('ProfilePage fetchData', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useDidShow(() => { fetchData(); });

  useShareAppMessage(() => ({
    title: 'EPC 教育平台 - 让学习更有趣',
    path: referral ? `/subpackages/auth/login/login?ref=${referral.referral_code}` : '/subpackages/auth/login/login',
  }));

  const handleSwitchRole = () => {
    switchRole(role === 'parent' ? 'child' : 'parent');
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => { if (res.confirm) logout(); },
    });
  };

  const handleCopyReferral = () => {
    if (!referral) return;
    Taro.setClipboardData({
      data: referral.referral_code,
      success: () => Taro.showToast({ title: '已复制推荐码', icon: 'success' }),
    });
  };

  if (loading) return <LoadingSpinner />;

  // ============ Child View ============
  if (role === 'child') {
    return (
      <View className='page-container profile-page'>
        <ProfileHeader user={user} variant='child' />

        <View className='profile-page__menu'>
          <MenuItem
            icon='🏆'
            title='我的成就'
            subtitle={achievementSummary ? `已解锁 ${achievementSummary.unlocked}/${achievementSummary.total}` : ''}
            onClick={() => Taro.navigateTo({ url: '/subpackages/child/achievements/achievements' })}
          />
          <MenuItem
            icon='📈'
            title='成长记录'
            subtitle='本周完成统计'
            onClick={() => {
              Taro.showToast({ title: '功能开发中', icon: 'none' });
            }}
          />
          <MenuItem
            icon='📋'
            title='我的兑换记录'
            onClick={() => {
              Taro.showToast({ title: '功能开发中', icon: 'none' });
            }}
          />
          <MenuItem
            icon='🪐'
            title='我的星球'
            subtitle='Phase 1 即将上线'
            onClick={() => {
              Taro.showToast({ title: '功能开发中', icon: 'none' });
            }}
          />

          <View className='divider' />

          <MenuItem icon='📮' title='意见反馈' onClick={() => {
            Taro.showToast({ title: '功能开发中', icon: 'none' });
          }} />
          <MenuItem icon='⚙️' title='设置' onClick={() => {
            Taro.showToast({ title: '功能开发中', icon: 'none' });
          }} />
          <MenuItem icon='🔄' title='切换身份' subtitle='切换到家长' onClick={handleSwitchRole} />
          <MenuItem icon='🚪' title='退出登录' danger onClick={handleLogout} />
        </View>
      </View>
    );
  }

  // ============ Parent View ============
  const childNames = children.map((c) => c.nickname).join(' · ');

  return (
    <View className='page-container profile-page'>
      <ProfileHeader user={user} variant='parent' />

      <View className='profile-page__menu'>
        <MenuItem
          icon='👶'
          title='我的宝贝'
          subtitle={childNames || '暂无'}
          onClick={() => Taro.navigateTo({ url: '/subpackages/parent/child-manage/child-manage' })}
        />
        <MenuItem
          icon='📋'
          title='任务管理'
          subtitle='跳转 Web 端'
          onClick={() => Taro.navigateTo({ url: '/subpackages/parent/task-manage/task-manage' })}
        />
        <MenuItem
          icon='🎁'
          title='奖品管理'
          subtitle='跳转 Web 端'
          onClick={() => Taro.navigateTo({ url: '/subpackages/parent/task-manage/task-manage' })}
        />

        {referral && (
          <MenuItem
            icon='📣'
            title='推广邀请'
            subtitle={`已邀请 ${referral.total_invited} 人`}
            onClick={handleCopyReferral}
          />
        )}

        <View className='divider' />

        <MenuItem icon='📮' title='意见反馈' onClick={() => {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }} />
        <MenuItem icon='⚙️' title='设置' onClick={() => {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }} />
        <MenuItem icon='🔄' title='切换身份' subtitle='切换到孩子' onClick={handleSwitchRole} />
        <MenuItem icon='🚪' title='退出登录' danger onClick={handleLogout} />
      </View>

      {/* Referral Card */}
      {referral && (
        <View className='profile-page__referral'>
          <Text className='profile-page__referral-title'>📣 推广邀请</Text>
          <View className='profile-page__referral-stats'>
            <View className='profile-page__referral-stat'>
              <Text className='profile-page__referral-value'>{referral.total_invited}</Text>
              <Text className='profile-page__referral-label'>已邀请</Text>
            </View>
            <View className='profile-page__referral-stat'>
              <Text className='profile-page__referral-value'>{referral.total_rewards}</Text>
              <Text className='profile-page__referral-label'>获得奖励</Text>
            </View>
          </View>
          <View className='profile-page__referral-code'>
            <Text>推荐码：{referral.referral_code}</Text>
            <Text className='profile-page__referral-copy' onClick={handleCopyReferral}>复制</Text>
          </View>
        </View>
      )}
    </View>
  );
}
