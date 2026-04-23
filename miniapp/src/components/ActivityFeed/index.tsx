import { View, Text } from '@tarojs/components';
import type { ActivityItem } from '../../types';
import { relativeTime } from '../../utils';
import './index.scss';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const typeEmoji: Record<string, string> = {
  task_complete: '✅',
  exam_complete: '📝',
  redeem: '🎁',
  achievement: '🏆',
  wish: '🌟',
};

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (!items.length) return null;

  return (
    <View className='activity-feed'>
      {items.map((item, idx) => (
        <View key={item.id} className='activity-feed__item'>
          <View className='activity-feed__timeline'>
            <View className='activity-feed__dot' />
            {idx < items.length - 1 && <View className='activity-feed__line' />}
          </View>
          <View className='activity-feed__content'>
            <View className='activity-feed__header'>
              <Text className='activity-feed__emoji'>{typeEmoji[item.type] || '📌'}</Text>
              <Text className='activity-feed__title'>{item.title}</Text>
            </View>
            <Text className='activity-feed__desc'>{item.description}</Text>
            <Text className='activity-feed__time'>{relativeTime(item.created_at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
