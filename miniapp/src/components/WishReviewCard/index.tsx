import { View, Text } from '@tarojs/components';
import type { WishPublic } from '../../types';
import './index.scss';

interface WishReviewCardProps {
  wish: WishPublic;
  onApprove?: (wishId: string) => void;
  onDefer?: (wishId: string) => void;
}

export default function WishReviewCard({ wish, onApprove, onDefer }: WishReviewCardProps) {
  const isPending = wish.status === 'pending';

  return (
    <View className={`wish-review-card ${!isPending ? 'wish-review-card--handled' : ''}`}>
      <View className='wish-review-card__header'>
        <Text className='wish-review-card__child'>👶 {wish.child_nickname}</Text>
        <Text className='wish-review-card__time'>
          {new Date(wish.created_at).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      <Text className='wish-review-card__content'>"{wish.content}"</Text>
      {wish.cards_count > 0 && (
        <Text className='wish-review-card__cards'>📚 系统已生成 {wish.cards_count} 张知识卡片</Text>
      )}
      {isPending ? (
        <View className='wish-review-card__actions'>
          <View className='wish-review-card__btn wish-review-card__btn--approve' onClick={() => onApprove?.(wish.id)}>
            <Text>🌱 种种子</Text>
          </View>
          <View className='wish-review-card__btn wish-review-card__btn--defer' onClick={() => onDefer?.(wish.id)}>
            <Text>放一放</Text>
          </View>
        </View>
      ) : (
        <View className='wish-review-card__status'>
          <Text>{wish.status === 'approved' ? '✅ 已种种子' : '⏸ 已放一放'}</Text>
        </View>
      )}
    </View>
  );
}
