import { View, Text } from '@tarojs/components';
import './index.scss';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onClick?: () => void;
}

export default function MenuItem({ icon, title, subtitle, danger, onClick }: MenuItemProps) {
  return (
    <View className={`menu-item ${danger ? 'menu-item--danger' : ''}`} onClick={onClick}>
      <Text className='menu-item__icon'>{icon}</Text>
      <View className='menu-item__content'>
        <Text className='menu-item__title'>{title}</Text>
        {subtitle && <Text className='menu-item__subtitle'>{subtitle}</Text>}
      </View>
      <Text className='menu-item__arrow'>›</Text>
    </View>
  );
}
