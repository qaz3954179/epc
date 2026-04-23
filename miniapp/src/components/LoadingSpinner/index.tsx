import { View, Text } from '@tarojs/components';
import './index.scss';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ text = '加载中...', size = 'medium' }: LoadingSpinnerProps) {
  return (
    <View className={`loading-spinner loading-spinner--${size}`}>
      <View className='loading-spinner__dot-wrapper'>
        <View className='loading-spinner__dot' />
        <View className='loading-spinner__dot' />
        <View className='loading-spinner__dot' />
      </View>
      {text && <Text className='loading-spinner__text'>{text}</Text>}
    </View>
  );
}
