import { View, Text, Image } from '@tarojs/components';
import type { PrizePublic } from '../../types';
import './index.scss';

interface PrizeCardProps {
  prize: PrizePublic;
  onRedeem?: (prize: PrizePublic) => void;
  balance?: number;
}

export default function PrizeCard({ prize, onRedeem, balance = 0 }: PrizeCardProps) {
  const outOfStock = prize.stock <= 0;
  const canAfford = balance >= prize.coins_cost;

  return (
    <View className={`prize-card ${outOfStock ? 'prize-card--disabled' : ''}`}>
      <View className='prize-card__img-wrapper'>
        {prize.image_url ? (
          <Image className='prize-card__img' src={prize.image_url} mode='aspectFill' />
        ) : (
          <View className='prize-card__img-placeholder'>🎁</View>
        )}
        {outOfStock && <View className='prize-card__sold-out'>已兑完</View>}
      </View>
      <Text className='prize-card__name'>{prize.title}</Text>
      <View className='prize-card__footer'>
        <Text className='prize-card__price'>🪙 {prize.coins_cost}</Text>
        {!outOfStock && (
          <View
            className={`prize-card__btn ${canAfford ? 'prize-card__btn--active' : ''}`}
            onClick={() => canAfford && onRedeem?.(prize)}
          >
            <Text>{canAfford ? '兑换' : '攒币中'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
