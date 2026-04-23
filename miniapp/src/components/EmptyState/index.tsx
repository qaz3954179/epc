import { View, Text } from '@tarojs/components';
import './index.scss';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <View className='empty-state'>
      <Text className='empty-state__icon'>{icon}</Text>
      <Text className='empty-state__title'>{title}</Text>
      {description && <Text className='empty-state__desc'>{description}</Text>}
    </View>
  );
}
