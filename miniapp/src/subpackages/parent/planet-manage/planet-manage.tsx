import { useState, useCallback } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useAuthStore, usePlanetStore } from '../../../store';
import { planetApi } from '../../../services/planet';
import PlanetView from '../../../components/PlanetView';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import './planet-manage.scss';

const DIFFICULTY_OPTIONS = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

export default function PlanetManagePage() {
  const { childId } = useAuthStore();
  const { planets, loading, fetchPlanets } = usePlanetStore();
  const [showAddCard, setShowAddCard] = useState(false);
  const [targetPlanetId, setTargetPlanetId] = useState('');
  const [cardForm, setCardForm] = useState({ title: '', content: '', fun_fact: '', difficulty: 'easy' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (childId) await fetchPlanets(childId);
  }, [childId, fetchPlanets]);

  useDidShow(() => { loadData(); });
  usePullDownRefresh(() => { loadData().finally(() => Taro.stopPullDownRefresh()); });

  const handleAddCard = (planetId: string) => {
    setTargetPlanetId(planetId);
    setCardForm({ title: '', content: '', fun_fact: '', difficulty: 'easy' });
    setShowAddCard(true);
  };

  const handleSubmitCard = async () => {
    if (!cardForm.title.trim() || !cardForm.content.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' });
      return;
    }
    try {
      setSubmitting(true);
      await planetApi.createCard(targetPlanetId, {
        title: cardForm.title.trim(),
        content: cardForm.content.trim(),
        fun_fact: cardForm.fun_fact.trim() || undefined,
        difficulty: cardForm.difficulty,
      });
      Taro.showToast({ title: '卡片已添加', icon: 'success' });
      setShowAddCard(false);
      loadData();
    } catch {
      Taro.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && planets.length === 0) return <LoadingSpinner />;

  return (
    <View className='page-container planet-manage-page'>
      {planets.length === 0 ? (
        <EmptyState icon='🪐' title='暂无星球' description='孩子许愿并通过审核后会生成星球' />
      ) : (
        <View className='planet-list'>
          {planets.map((planet) => (
            <View key={planet.id} className='planet-card'>
              <View className='planet-card__top'>
                <View className='planet-card__visual'>
                  <PlanetView
                    planet={planet}
                    size='small'
                    onClick={() => {
                      Taro.navigateTo({
                        url: `/subpackages/child/planet-detail/planet-detail?id=${planet.id}`,
                      });
                    }}
                  />
                </View>
                <View className='planet-card__info'>
                  <Text className='planet-card__name'>{planet.name}</Text>
                  <Text className='planet-card__wish'>"{planet.wish?.content}"</Text>
                  <View className='planet-card__stats'>
                    <Text className='planet-card__stat'>
                      里程碑 {planet.completed_milestones}/{planet.total_milestones}
                    </Text>
                    <Text className='planet-card__stat'>
                      卡片 {planet.cards.length}
                    </Text>
                  </View>
                </View>
              </View>
              <View className='planet-card__actions'>
                <View className='planet-card__btn' onClick={() => handleAddCard(planet.id)}>
                  <Text>📝 添加知识卡片</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 添加卡片弹窗 */}
      {showAddCard && (
        <View className='modal-mask' onClick={() => setShowAddCard(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-content__title'>添加知识卡片</Text>

            <View className='form-group'>
              <Text className='form-group__label'>标题</Text>
              <Input
                className='form-group__input'
                placeholder='卡片标题'
                value={cardForm.title}
                onInput={(e) => setCardForm((f) => ({ ...f, title: e.detail.value }))}
              />
            </View>

            <View className='form-group'>
              <Text className='form-group__label'>内容</Text>
              <Textarea
                className='form-group__textarea'
                placeholder='知识内容，用孩子能理解的语言'
                value={cardForm.content}
                onInput={(e) => setCardForm((f) => ({ ...f, content: e.detail.value }))}
              />
            </View>

            <View className='form-group'>
              <Text className='form-group__label'>趣味知识（选填）</Text>
              <Input
                className='form-group__input'
                placeholder='一个有趣的小知识'
                value={cardForm.fun_fact}
                onInput={(e) => setCardForm((f) => ({ ...f, fun_fact: e.detail.value }))}
              />
            </View>

            <View className='form-group'>
              <Text className='form-group__label'>难度</Text>
              <View className='difficulty-picker'>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <View
                    key={opt.value}
                    className={`difficulty-picker__item ${cardForm.difficulty === opt.value ? 'difficulty-picker__item--active' : ''}`}
                    onClick={() => setCardForm((f) => ({ ...f, difficulty: opt.value }))}
                  >
                    <Text>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className='modal-content__actions'>
              <View className='modal-content__btn modal-content__btn--cancel' onClick={() => setShowAddCard(false)}>
                <Text>取消</Text>
              </View>
              <View
                className={`modal-content__btn modal-content__btn--confirm ${submitting ? 'modal-content__btn--disabled' : ''}`}
                onClick={submitting ? undefined : handleSubmitCard}
              >
                <Text>添加</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
