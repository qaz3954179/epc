import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useAuthStore } from '../../../store';
import { api } from '../../../services/api';
import WishReviewCard from '../../../components/WishReviewCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import type { WishPublic } from '../../../types';
import './wish-review.scss';

export default function WishReviewPage() {
  const { childId } = useAuthStore();
  const [wishes, setWishes] = useState<WishPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!childId) return;
    try {
      setLoading(true);
      const list = await api.get<WishPublic[]>(`/parent/pending-wishes/${childId}`);
      setWishes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useDidShow(() => { fetchData(); });
  usePullDownRefresh(() => { fetchData().finally(() => Taro.stopPullDownRefresh()); });

  const handleApprove = async (wishId: string) => {
    try {
      await api.post(`/planets/wishes/${wishId}/respond`, { action: 'approve' });
      setWishes((prev) => prev.map((w) => w.id === wishId ? { ...w, status: 'approved' as const } : w));
      Taro.showToast({ title: '已种种子 🌱', icon: 'success' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  const handleDefer = async (wishId: string) => {
    try {
      await api.post(`/planets/wishes/${wishId}/respond`, { action: 'defer' });
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      Taro.showToast({ title: '已放一放', icon: 'none' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  if (loading) return <LoadingSpinner />;

  const pending = wishes.filter((w) => w.status === 'pending');
  const handled = wishes.filter((w) => w.status !== 'pending');

  return (
    <View className='page-container wish-review-page'>
      {pending.length > 0 && (
        <View className='section'>
          <Text className='section__title'>🌟 待审核 ({pending.length})</Text>
          {pending.map((w) => (
            <WishReviewCard key={w.id} wish={w} onApprove={handleApprove} onDefer={handleDefer} />
          ))}
        </View>
      )}

      {handled.length > 0 && (
        <View className='section'>
          <Text className='section__title'>📋 已处理</Text>
          {handled.map((w) => (
            <WishReviewCard key={w.id} wish={w} />
          ))}
        </View>
      )}

      {wishes.length === 0 && (
        <EmptyState icon='🌟' title='暂无愿望' description='宝贝还没有许愿哦' />
      )}
    </View>
  );
}
