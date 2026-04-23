import { View, Text } from '@tarojs/components';
import type { UserPublic } from '../../types';
import { formatNumber } from '../../utils';
import './index.scss';

interface ProfileHeaderProps {
  user: UserPublic | null;
  variant: 'parent' | 'child';
}

export default function ProfileHeader({ user, variant }: ProfileHeaderProps) {
  if (!user) return null;

  return (
    <View className={`profile-header profile-header--${variant}`}>
      <View className='profile-header__avatar-wrapper'>
        <Text className='profile-header__avatar'>
          {user.avatar_url ? '' : variant === 'parent' ? '👤' : '👶'}
        </Text>
      </View>
      <View className='profile-header__info'>
        <Text className='profile-header__name'>{user.nickname || user.full_name}</Text>
        <View className='profile-header__stats'>
          <Text className='profile-header__stat'>🪙 {formatNumber(user.coins)} 学习币</Text>
          <Text className='profile-header__stat'>⭐ 连续打卡 {user.streak_days} 天</Text>
        </View>
      </View>
    </View>
  );
}
