import { View, Text } from '@tarojs/components';
import './index.scss';

interface CoinBadgeProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  showSign?: boolean;
}

export default function CoinBadge({ amount, size = 'medium', showSign = false }: CoinBadgeProps) {
  const sign = showSign && amount > 0 ? '+' : '';
  const isNegative = amount < 0;

  return (
    <View className={`coin-badge coin-badge--${size} ${isNegative ? 'coin-badge--negative' : ''}`}>
      <Text className='coin-badge__icon'>🪙</Text>
      <Text className='coin-badge__amount'>{sign}{amount.toLocaleString()}</Text>
    </View>
  );
}
