import { View, Text } from '@tarojs/components';
import type { AchievementPublic } from '../../types';
import './index.scss';

interface AchievementCardProps {
  achievement: AchievementPublic;
  onClick: (achievement: AchievementPublic) => void;
}

export default function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const { unlocked } = achievement;

  return (
    <View
      className={`achievement-card ${unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
      onClick={() => unlocked && onClick(achievement)}
    >
      <View className='achievement-card__icon'>
        {unlocked ? (
          <Text className='achievement-card__emoji'>{achievement.icon}</Text>
        ) : (
          <Text className='achievement-card__lock'>🔒</Text>
        )}
      </View>
      <Text className='achievement-card__name'>
        {unlocked ? achievement.name : '???'}
      </Text>
      <Text className='achievement-card__category'>
        {unlocked ? achievement.category : '未解锁'}
      </Text>
    </View>
  );
}
