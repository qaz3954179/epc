import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';
import BabySelector from '../../components/BabySelector';
import StatCard from '../../components/StatCard';
import Heatmap from '../../components/Heatmap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatNumber, formatTime, relativeTime } from '../../utils';
import type {
  ChildPublic,
  ParentMonitor,
  HeatmapDay,
  TaskCompletionPublic,
  CoinLogPublic,
} from '../../types';
import './tasks.scss';

export default function TasksPage() {
  const { role, childId, switchChild } = useAuthStore();
  const [children, setChildren] = useState<ChildPublic[]>([]);
  const [monitor, setMonitor] = useState<ParentMonitor | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [completions, setCompletions] = useState<TaskCompletionPublic[]>([]);
  const [coinLogs, setCoinLogs] = useState<CoinLogPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (role !== 'parent') return;
    try {
      setLoading(true);
      const childList = await api.get<ChildPublic[]>('/children/');
      setChildren(childList);
      const cid = childId || childList[0]?.id;
      if (cid && !childId) switchChild(cid);

      if (cid) {
        const [mon, hm, comps, logs] = await Promise.all([
          api.get<ParentMonitor>(`/parent/monitor/${cid}`),
          api.get<HeatmapDay[]>(`/growth/heatmap?child_id=${cid}&days=30`),
          api.get<TaskCompletionPublic[]>(`/task-completions/child/${cid}/completions?days=7`),
          api.get<CoinLogPublic[]>(`/coin-logs/?child_id=${cid}&limit=20`),
        ]);
        setMonitor(mon);
        setHeatmap(hm);
        setCompletions(comps);
        setCoinLogs(logs);
      }
    } catch (err) {
      console.error('TasksPage fetchData', err);
    } finally {
      setLoading(false);
    }
  }, [role, childId, switchChild]);

  useDidShow(() => { fetchData(); });
  usePullDownRefresh(() => { fetchData().finally(() => Taro.stopPullDownRefresh()); });

  if (role !== 'parent') {
    return <View className='page-container'><EmptyState icon='🔒' title='请切换到家长身份' /></View>;
  }
  if (loading) return <LoadingSpinner />;

  return (
    <View className='page-container data-page'>
      <BabySelector children={children} currentId={childId} onSelect={switchChild} />

      {/* Stats Row */}
      {monitor && (
        <View className='data-page__stats'>
          <StatCard icon='🪙' value={formatNumber(monitor.coins)} label='余额' />
          <StatCard icon='✅' value={`${monitor.today_completed}/${monitor.today_total}`} label='今日' />
          <StatCard icon='📊' value={`${Math.round(monitor.accuracy_rate * 100)}%`} label='正确率' />
          <StatCard icon='🔥' value={`${monitor.streak_days}天`} label='连续' />
        </View>
      )}

      {/* Heatmap */}
      <View className='section'>
        <Text className='section__title'>📅 任务完成热力图</Text>
        <View className='data-page__heatmap-card'>
          <Heatmap data={heatmap} days={30} onDayClick={(day) => {
            Taro.showToast({ title: `${day.date}: ${day.count} 次`, icon: 'none' });
          }} />
        </View>
      </View>

      {/* Recent Completions */}
      <View className='section'>
        <Text className='section__title'>📋 最近完成</Text>
        {completions.length > 0 ? (
          <View className='data-page__completions'>
            {completions.slice(0, 10).map((c) => (
              <View key={c.id} className='completion-item'>
                <Text className='completion-item__time'>{formatTime(c.completed_at)}</Text>
                <View className='completion-item__info'>
                  <Text className='completion-item__title'>{c.item_title}</Text>
                  {c.quality_rating != null && (
                    <Text className='completion-item__rating'>
                      {'⭐'.repeat(c.quality_rating)}{'☆'.repeat(5 - c.quality_rating)}
                    </Text>
                  )}
                </View>
                <Text className='completion-item__coins'>+{c.coins_earned} 🪙</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon='📋' title='暂无完成记录' />
        )}
      </View>

      {/* Coin Logs */}
      <View className='section'>
        <Text className='section__title'>🪙 学习币明细</Text>
        {coinLogs.length > 0 ? (
          <View className='data-page__coin-logs'>
            {coinLogs.slice(0, 15).map((log) => (
              <View key={log.id} className='coin-log-item'>
                <View className='coin-log-item__info'>
                  <Text className='coin-log-item__desc'>{log.description}</Text>
                  <Text className='coin-log-item__time'>{relativeTime(log.created_at)}</Text>
                </View>
                <Text className={`coin-log-item__amount coin-log-item__amount--${log.amount >= 0 ? 'earn' : 'spend'}`}>
                  {log.amount >= 0 ? '+' : ''}{log.amount}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon='🪙' title='暂无记录' />
        )}
      </View>
    </View>
  );
}
