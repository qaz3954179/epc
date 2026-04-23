import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { api } from '../../../services/api';
import AchievementCard from '../../../components/AchievementCard';
import AchievementDetailModal from '../../../components/AchievementDetailModal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import type { AchievementPublic, AchievementSummary } from '../../../types';
import './achievements.scss';

type FilterType = 'all' | 'unlocked' | 'locked';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementPublic[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementPublic | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        api.get<AchievementPublic[]>('/achievements/child/'),
        api.get<AchievementSummary>('/achievements/child/summary'),
      ]);
      setAchievements(list);
      setSummary(sum);
    } catch (err) {
      console.error('AchievementsPage fetchData', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => { fetchData(); });

  const handleCardClick = (achievement: AchievementPublic) => {
    setSelectedAchievement(achievement);
    setDetailVisible(true);
  };

  const handleModalClose = () => {
    setDetailVisible(false);
    setSelectedAchievement(null);
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  const unlockedCount = summary?.unlocked ?? achievements.filter((a) => a.unlocked).length;
  const totalCount = summary?.total ?? achievements.length;

  return (
    <View className='page-container achievements-page'>
      {/* 成就概览头卡 */}
      <View className='achievements-page__header'>
        <View className='achievements-page__progress'>
          <View className='achievements-page__progress-ring'>
            <View
              className='achievements-page__progress-fill'
              style={{
                background: `conic-gradient(#667eea ${(unlockedCount / Math.max(totalCount, 1)) * 360}deg, #e8e8e8 0deg)`,
              }}
            >
              <View className='achievements-page__progress-inner'>
                <Text className='achievements-page__progress-number'>{unlockedCount}</Text>
                <Text className='achievements-page__progress-label'>/ {totalCount}</Text>
              </View>
            </View>
          </View>
          <View className='achievements-page__header-text'>
            <Text className='achievements-page__header-title'>🏆 我的成就</Text>
            <Text className='achievements-page__header-desc'>
              已解锁 {unlockedCount}/{totalCount} 个成就
            </Text>
          </View>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className='achievements-page__filter'>
        <View
          className={`achievements-page__filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`achievements-page__filter-pill ${filter === 'unlocked' ? 'active' : ''}`}
          onClick={() => setFilter('unlocked')}
        >
          <Text>已解锁</Text>
        </View>
        <View
          className={`achievements-page__filter-pill ${filter === 'locked' ? 'active' : ''}`}
          onClick={() => setFilter('locked')}
        >
          <Text>未解锁</Text>
        </View>
      </View>

      {/* 成就网格 */}
      {filteredAchievements.length > 0 ? (
        <View className='achievements-page__grid'>
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClick={handleCardClick}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon='🔍'
          title='暂无成就'
          description={filter !== 'all' ? '该分类下没有成就' : '快去完成任务解锁成就吧！'}
        />
      )}

      {/* 成就详情弹窗 */}
      <AchievementDetailModal
        visible={detailVisible}
        achievement={selectedAchievement}
        onClose={handleModalClose}
      />
    </View>
  );
}
