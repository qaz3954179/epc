import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { ExamBookingPublic } from '../../types';
import { subjectEmoji } from '../../utils';
import './index.scss';

interface ExamBookingCardProps {
  booking: ExamBookingPublic;
}

export default function ExamBookingCard({ booking }: ExamBookingCardProps) {
  const scheduledDate = new Date(booking.scheduled_at);
  const now = new Date();
  const isReady = scheduledDate <= now && booking.status === 'booked';
  const isStarted = booking.status === 'started';

  const handleStart = () => {
    Taro.navigateTo({ url: `/subpackages/child/exam-play/exam-play?bookingId=${booking.id}` });
  };

  return (
    <View className='exam-booking-card'>
      <View className='exam-booking-card__left'>
        <Text className='exam-booking-card__emoji'>{subjectEmoji(booking.subject)}</Text>
        <View className='exam-booking-card__info'>
          <Text className='exam-booking-card__title'>{booking.template_title}</Text>
          <Text className='exam-booking-card__time'>
            {scheduledDate.toLocaleDateString('zh-CN')} {scheduledDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      <View className='exam-booking-card__right'>
        {booking.status === 'completed' ? (
          <Text className='exam-booking-card__tag exam-booking-card__tag--done'>已完成</Text>
        ) : isStarted ? (
          <View className='exam-booking-card__btn' onClick={handleStart}>
            <Text>继续考试</Text>
          </View>
        ) : isReady ? (
          <View className='exam-booking-card__btn' onClick={handleStart}>
            <Text>开始考试 →</Text>
          </View>
        ) : (
          <Text className='exam-booking-card__tag exam-booking-card__tag--wait'>已预约</Text>
        )}
      </View>
    </View>
  );
}
