import { View, Text, Image } from '@tarojs/components';
import type { PrizePublic } from '../../types';
import './index.scss';

interface RedeemConfirmModalProps {
  visible: boolean;
  prize: PrizePublic | null;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RedeemConfirmModal({ visible, prize, balance, onConfirm, onCancel }: RedeemConfirmModalProps) {
  if (!visible || !prize) return null;

  const afterBalance = balance - prize.coins_cost;

  return (
    <View className='redeem-modal' onClick={onCancel}>
      <View className='redeem-modal__content' onClick={(e) => e.stopPropagation()}>
        <Text className='redeem-modal__title'>确认兑换</Text>

        <View className='redeem-modal__prize'>
          {prize.image_url ? (
            <Image className='redeem-modal__img' src={prize.image_url} mode='aspectFill' />
          ) : (
            <View className='redeem-modal__img-placeholder'>🎁</View>
          )}
          <Text className='redeem-modal__name'>{prize.title}</Text>
        </View>

        <View className='redeem-modal__info'>
          <View className='redeem-modal__row'>
            <Text>需要</Text>
            <Text className='redeem-modal__cost'>🪙 {prize.coins_cost}</Text>
          </View>
          <View className='redeem-modal__row'>
            <Text>余额</Text>
            <Text>🪙 {balance}</Text>
          </View>
          <View className='redeem-modal__row'>
            <Text>兑换后</Text>
            <Text className='redeem-modal__after'>🪙 {afterBalance}</Text>
          </View>
        </View>

        <View className='redeem-modal__actions'>
          <View className='redeem-modal__btn redeem-modal__btn--cancel' onClick={onCancel}>
            <Text>取消</Text>
          </View>
          <View className='redeem-modal__btn redeem-modal__btn--confirm' onClick={onConfirm}>
            <Text>确认兑换</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
