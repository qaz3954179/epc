import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import type { AchievementPublic } from '../../types';
import './index.scss';

interface AchievementDetailModalProps {
  visible: boolean;
  achievement: AchievementPublic | null;
  onClose: () => void;
}

export default function AchievementDetailModal({
  visible,
  achievement,
  onClose,
}: AchievementDetailModalProps) {
  const [showCelebrate, setShowCelebrate] = useState(false);

  useEffect(() => {
    if (visible && achievement) {
      setShowCelebrate(true);
      const timer = setTimeout(() => setShowCelebrate(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, achievement]);

  if (!visible || !achievement) return null;

  const unlockedDate = achievement.unlocked_at
    ? new Date(achievement.unlocked_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <View className='achievement-detail-modal' onClick={onClose}>
      <View className='achievement-detail-modal__content' onClick={(e) => e.stopPropagation()}>
        {/* 庆祝动画 */}
        {showCelebrate && (
          <View className='achievement-detail-modal__particles'>
            {Array.from({ length: 16 }).map((_, i) => (
              <View
                key={i}
                className={`achievement-detail-modal__particle achievement-detail-modal__particle--${i}`}
              />
            ))}
          </View>
        )}

        {/* 成就图标 */}
        <Text className='achievement-detail-modal__emoji'>{achievement.icon}</Text>

        {/* 成就名称 */}
        <Text className='achievement-detail-modal__name'>{achievement.name}</Text>

        {/* 成就描述 */}
        <Text className='achievement-detail-modal__desc'>{achievement.description}</Text>

        {/* 解锁消息 */}
        {achievement.reveal_message && (
          <View className='achievement-detail-modal__message'>
            <Text className='achievement-detail-modal__message-label'>🌟 解锁寄语</Text>
            <Text className='achievement-detail-modal__message-text'>
              "{achievement.reveal_message}"
            </Text>
          </View>
        )}

        {/* 解锁时间 */}
        {unlockedDate && (
          <Text className='achievement-detail-modal__time'>
            解锁于 {unlockedDate}
          </Text>
        )}

        {/* 分类标签 */}
        <View className='achievement-detail-modal__category-tag'>
          <Text>{achievement.category}</Text>
        </View>

        {/* 关闭按钮 */}
        <View className='achievement-detail-modal__close' onClick={onClose}>
          <Text>我知道了 👍</Text>
        </View>
      </View>
    </View>
  );
}
