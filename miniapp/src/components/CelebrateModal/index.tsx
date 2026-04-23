import { View, Text } from '@tarojs/components';
import './index.scss';

interface CelebrateModalProps {
  visible: boolean;
  coins?: number;
  onClose: () => void;
}

export default function CelebrateModal({ visible, coins = 0, onClose }: CelebrateModalProps) {
  if (!visible) return null;

  return (
    <View className='celebrate-modal' onClick={onClose}>
      <View className='celebrate-modal__content' onClick={(e) => e.stopPropagation()}>
        <View className='celebrate-modal__particles'>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} className={`celebrate-modal__particle celebrate-modal__particle--${i}`} />
          ))}
        </View>
        <Text className='celebrate-modal__emoji'>🎉</Text>
        <Text className='celebrate-modal__title'>太棒了！</Text>
        {coins > 0 && <Text className='celebrate-modal__coins'>+{coins} 🪙</Text>}
      </View>
    </View>
  );
}
