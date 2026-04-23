import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';
import WishReviewCard from '../../components/WishReviewCard';
import ExamBookingCard from '../../components/ExamBookingCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import type { WishPublic, ExamBookingPublic, RedemptionPublic } from '../../types';
import './store.scss';

export default function StorePage() {
  const { role, childId } = useAuthStore();
  const [wishes, setWishes] = useState<WishPublic[]>([]);
  const [exams, setExams] = useState<ExamBookingPublic[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (role !== 'parent' || !childId) return;
    try {
      setLoading(true);
      const [wishList, examList, redeemList] = await Promise.all([
        api.get<WishPublic[]>(`/parent/pending-wishes/${childId}`),
        api.get<ExamBookingPublic[]>('/exams/bookings'),
        api.get<RedemptionPublic[]>('/redemptions/parent/pending'),
      ]);
      setWishes(wishList);
      setExams(examList);
      setRedemptions(redeemList);
    } catch (err) {
      console.error('StorePage fetchData', err);
    } finally {
      setLoading(false);
    }
  }, [role, childId]);

  useDidShow(() => { fetchData(); });
  usePullDownRefresh(() => { fetchData().finally(() => Taro.stopPullDownRefresh()); });

  const handleApproveWish = async (wishId: string) => {
    try {
      await api.post(`/planets/wishes/${wishId}/respond`, { action: 'approve' });
      setWishes((prev) => prev.map((w) => w.id === wishId ? { ...w, status: 'approved' as const } : w));
      Taro.showToast({ title: '已种种子 🌱', icon: 'success' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  const handleDeferWish = async (wishId: string) => {
    try {
      await api.post(`/planets/wishes/${wishId}/respond`, { action: 'defer' });
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      Taro.showToast({ title: '已放一放', icon: 'none' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  const handleApproveRedeem = async (id: string) => {
    try {
      await api.patch(`/redemptions/${id}`, { status: 'processing' });
      setRedemptions((prev) => prev.filter((r) => r.id !== id));
      Taro.showToast({ title: '已确认', icon: 'success' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  const handleRejectRedeem = async (id: string) => {
    try {
      await api.patch(`/redemptions/${id}`, { status: 'cancelled' });
      setRedemptions((prev) => prev.filter((r) => r.id !== id));
      Taro.showToast({ title: '已拒绝', icon: 'none' });
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }); }
  };

  if (role !== 'parent') {
    return <View className='page-container'><EmptyState icon='🔒' title='请切换到家长身份' /></View>;
  }
  if (loading) return <LoadingSpinner />;

  const pendingWishes = wishes.filter((w) => w.status === 'pending');
  const hasContent = pendingWishes.length > 0 || exams.length > 0 || redemptions.length > 0;

  return (
    <View className='page-container approval-page'>
      {/* Wishes */}
      {pendingWishes.length > 0 && (
        <View className='section'>
          <View className='section__title'>
            <Text>🪐 新愿望</Text>
            <View className='section__badge'>{pendingWishes.length}</View>
          </View>
          {pendingWishes.map((wish) => (
            <WishReviewCard key={wish.id} wish={wish} onApprove={handleApproveWish} onDefer={handleDeferWish} />
          ))}
        </View>
      )}

      {/* Exam Schedule */}
      {exams.length > 0 && (
        <View className='section'>
          <Text className='section__title'>📝 考试安排</Text>
          {exams.map((exam) => (
            <ExamBookingCard key={exam.id} booking={exam} />
          ))}
        </View>
      )}

      {/* Redemption Approvals */}
      {redemptions.length > 0 && (
        <View className='section'>
          <View className='section__title'>
            <Text>🎁 兑换审批</Text>
            <View className='section__badge'>{redemptions.length}</View>
          </View>
          {redemptions.map((r) => (
            <View key={r.id} className='redeem-approval-card'>
              <View className='redeem-approval-card__info'>
                <Text className='redeem-approval-card__title'>{r.prize_title}</Text>
                <Text className='redeem-approval-card__cost'>🪙 {r.coins_cost}</Text>
                <Text className='redeem-approval-card__time'>
                  {new Date(r.created_at).toLocaleDateString('zh-CN')}
                </Text>
              </View>
              <View className='redeem-approval-card__actions'>
                <View className='redeem-approval-card__btn redeem-approval-card__btn--approve' onClick={() => handleApproveRedeem(r.id)}>
                  <Text>确认</Text>
                </View>
                <View className='redeem-approval-card__btn redeem-approval-card__btn--reject' onClick={() => handleRejectRedeem(r.id)}>
                  <Text>拒绝</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {!hasContent && <EmptyState icon='✨' title='暂无待处理事项' description='所有审批已处理完毕' />}
    </View>
  );
}
