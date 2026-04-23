import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { api } from '../../../services/api';
import ExamBookingCard from '../../../components/ExamBookingCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import type { ExamBookingPublic } from '../../../types';
import './exam-schedule.scss';

export default function ExamSchedulePage() {
  const [bookings, setBookings] = useState<ExamBookingPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.get<ExamBookingPublic[]>('/exams/bookings');
      setBookings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => { fetchData(); });
  usePullDownRefresh(() => { fetchData().finally(() => Taro.stopPullDownRefresh()); });

  if (loading) return <LoadingSpinner />;

  const upcoming = bookings.filter((b) => b.status === 'booked');
  const inProgress = bookings.filter((b) => b.status === 'started');
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <View className='page-container exam-schedule-page'>
      {inProgress.length > 0 && (
        <View className='section'>
          <Text className='section__title'>🔴 进行中</Text>
          {inProgress.map((b) => <ExamBookingCard key={b.id} booking={b} />)}
        </View>
      )}

      {upcoming.length > 0 && (
        <View className='section'>
          <Text className='section__title'>📅 即将开始</Text>
          {upcoming.map((b) => <ExamBookingCard key={b.id} booking={b} />)}
        </View>
      )}

      {completed.length > 0 && (
        <View className='section'>
          <Text className='section__title'>✅ 已完成</Text>
          {completed.map((b) => <ExamBookingCard key={b.id} booking={b} />)}
        </View>
      )}

      {bookings.length === 0 && (
        <EmptyState icon='📝' title='暂无考试安排' description='可以在 Web 端安排考试' />
      )}
    </View>
  );
}
