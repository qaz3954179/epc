import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { usePlanetStore } from '../../../store';
import PlanetView from '../../../components/PlanetView';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './planet-detail.scss';

const DIFFICULTY_LABEL = { easy: '简单', medium: '中等', hard: '困难' };

export default function PlanetDetailPage() {
  const router = useRouter();
  const planetId = router.params.id || '';
  const { currentPlanet, loading, fetchPlanet, clearCurrent } = usePlanetStore();

  useEffect(() => {
    if (planetId) fetchPlanet(planetId);
    return () => clearCurrent();
  }, [planetId]);

  if (loading || !currentPlanet) return <LoadingSpinner />;

  const progress = currentPlanet.total_milestones > 0
    ? Math.round((currentPlanet.completed_milestones / currentPlanet.total_milestones) * 100)
    : 0;

  return (
    <View className='page-container planet-detail-page'>
      {/* 星球展示区 */}
      <View className='planet-hero'>
        <PlanetView planet={currentPlanet} size='large' />
        <Text className='planet-hero__name'>{currentPlanet.name}</Text>
        <Text className='planet-hero__wish'>"{currentPlanet.wish?.content}"</Text>
        <View className='planet-hero__progress'>
          <View className='planet-hero__progress-bar'>
            <View className='planet-hero__progress-fill' style={{ width: `${progress}%` }} />
          </View>
          <Text className='planet-hero__progress-text'>
            成长进度 {currentPlanet.completed_milestones}/{currentPlanet.total_milestones}
          </Text>
        </View>
      </View>

      {/* 里程碑 */}
      {currentPlanet.milestones.length > 0 && (
        <View className='section'>
          <Text className='section__title'>🎯 成长里程碑</Text>
          {currentPlanet.milestones.map((m) => (
            <View key={m.id} className={`milestone-item ${m.is_completed ? 'milestone-item--done' : ''}`}>
              <View className='milestone-item__icon'>
                <Text>{m.is_completed ? '✅' : '⭕'}</Text>
              </View>
              <View className='milestone-item__info'>
                <Text className='milestone-item__title'>{m.title}</Text>
                {m.description && (
                  <Text className='milestone-item__desc'>{m.description}</Text>
                )}
                <View className='milestone-item__bar'>
                  <View
                    className='milestone-item__bar-fill'
                    style={{ width: `${m.target_value > 0 ? Math.min(100, (m.current_value / m.target_value) * 100) : 0}%` }}
                  />
                </View>
                <Text className='milestone-item__progress'>
                  {m.current_value}/{m.target_value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 知识卡片 */}
      {currentPlanet.cards.length > 0 && (
        <View className='section'>
          <Text className='section__title'>📚 知识卡片</Text>
          <View className='card-list'>
            {currentPlanet.cards.map((card) => (
              <View
                key={card.id}
                className={`card-item ${card.is_read ? 'card-item--read' : ''}`}
                onClick={() => {
                  Taro.navigateTo({
                    url: `/subpackages/child/card-reader/card-reader?planetId=${currentPlanet.id}&cardId=${card.id}`,
                  });
                }}
              >
                <View className='card-item__header'>
                  <Text className='card-item__title'>{card.title}</Text>
                  <Text className='card-item__badge'>
                    {DIFFICULTY_LABEL[card.difficulty] || card.difficulty}
                  </Text>
                </View>
                <Text className='card-item__preview'>
                  {card.content.slice(0, 40)}{card.content.length > 40 ? '...' : ''}
                </Text>
                <View className='card-item__footer'>
                  {card.is_read ? (
                    <Text className='card-item__status card-item__status--read'>✅ 已读</Text>
                  ) : (
                    <Text className='card-item__status'>📖 去阅读</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
