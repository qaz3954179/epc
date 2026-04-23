import { View, Text } from '@tarojs/components';
import './index.scss';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  onClick?: () => void;
}

export default function StatCard({ icon, value, label, onClick }: StatCardProps) {
  return (
    <View className='stat-card' onClick={onClick}>
      <Text className='stat-card__icon'>{icon}</Text>
      <Text className='stat-card__value'>{value}</Text>
      <Text className='stat-card__label'>{label}</Text>
    </View>
  );
}
