import { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';
import BabySelector from '../../components/BabySelector';
import WishReviewCard from '../../components/WishReviewCard';
import ActivityFeed from '../../components/ActivityFeed';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import type { ChildPublic, ParentMonitor, WishPublic, ActivityItem } from '../../types';
import './index.scss';

export default function IndexPage() {
  const { role, childId, switchChild } = useAuthStore();
  const [children, setChildren] = useState<ChildPublic[]>([]);
  const [monitor, setMonitor] = useState<ParentMonitor | null>(null);
  const [wishes, setWishes] = useState<WishPublic[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (role !== 'parent') return;
    try {
      setLoading(true);
      const childList = await api.get<ChildPublic[]>('/children/');
      setChildren(childList);

      const currentChildId = childId || childList[0]?.id;
      if (currentChildId && !childId) switchChild(currentChildId);

      if (currentChildId) {
        const [mon, wishList, actList] = await Promise.all([
          api.get<ParentMonitor>(`/parent/monitor/${currentChildId}`),
          api.get<WishPublic[]>(`/parent/pending-wishes/${currentChildId}`),
          api.get<ActivityItem[]>(`/parent/activities/${currentChildId}`),
        ]);
        setMonitor(mon);
        setWishes(wishList);
        setActivities(actList);
      }
    } catch (err) {
      console.error('fetchData error', err);
    } finally {
      setLoading(false);
    }
  }, [role, childId, switchChild]);

  useDidShow(() => { fetchData(); });

  usePullDownRefresh(() => {
    fetchData().finally(() => Taro.stopPullDownRefresh());
  });

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

  if (role !== 'parent') {
    return (
      <View className='page-container'>
        <EmptyState icon='🔒' title='请切换到家长身份' />
      </View>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <View className='page-container garden-page'>
      <BabySelector children={children} currentId={childId} onSelect={switchChild} />

      {/* Baby Card */}
      {monitor && (
        <View className='baby-card'>
          <View className='baby-card__header'>
            <Text className='baby-card__avatar'>👶</Text>
            <View className='baby-card__info'>
              <Text className='baby-card__name'>{monitor.child_nickname}</Text>
              <Text className='baby-card__coins'>🪙 {monitor.coins.toLocaleString()} 学习币</Text>
            </View>
          </View>
          <View className='baby-card__stats'>
            <View className='baby-card__stat'>
              <Text className='baby-card__stat-value'>⭐ {monitor.streak_days}</Text>
              <Text className='baby-card__stat-label'>连续打卡</Text>
            </View>
            <View className='baby-card__stat'>
              <Text className='baby-card__stat-value'>📊 {monitor.today_completed}/{monitor.today_total}</Text>
              <Text className='baby-card__stat-label'>今日任务</Text>
            </View>
          </View>
          <View
            className='baby-card__detail-link'
            onClick={() => Taro.switchTab({ url: '/pages/tasks/tasks' })}
          >
            <Text>查看详情 →</Text>
          </View>
        </View>
      )}

      {/* Planet List Placeholder */}
      <View className='section'>
        <Text className='section__title'>🪐 星球</Text>
        <View className='planet-placeholder'>
          <Text className='planet-placeholder__text'>🪐 我的星球（即将上线）</Text>
        </View>
      </View>

      {/* Todo List - Wishes */}
      {wishes.length > 0 && (
        <View className='section'>
          <View className='section__title'>
            <Text>🌟 待处理愿望</Text>
            <View className='section__badge'>{wishes.filter((w) => w.status === 'pending').length}</View>
          </View>
          {wishes.map((wish) => (
            <WishReviewCard
              key={wish.id}
              wish={wish}
              onApprove={handleApproveWish}
              onDefer={handleDeferWish}
            />
          ))}
        </View>
      )}

      {/* Activity Feed */}
      {activities.length > 0 && (
        <View className='section'>
          <Text className='section__title'>📋 最近动态</Text>
          <ActivityFeed items={activities} />
        </View>
      )}

      {!wishes.length && !activities.length && !monitor && (
        <EmptyState icon='🌱' title='还没有数据' description='添加宝贝后开始使用' />
      )}
    </View>
  );
}
