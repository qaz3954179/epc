import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { usePlanetStore } from '../../../store';
import { planetApi } from '../../../services/planet';
import LoadingSpinner from '../../../components/LoadingSpinner';
import type { KnowledgeCardPublic } from '../../../types';
import './card-reader.scss';

export default function CardReaderPage() {
  const router = useRouter();
  const planetId = router.params.planetId || '';
  const cardId = router.params.cardId || '';
  const { markCardRead } = usePlanetStore();
  const [card, setCard] = useState<KnowledgeCardPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!planetId) return;
    planetApi.getCards(planetId).then((res) => {
      const found = res.data.find((c) => c.id === cardId);
      if (found) setCard(found);
    }).catch((err) => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, [planetId, cardId]);

  const handleMarkRead = async () => {
    if (!card || card.is_read || marking) return;
    try {
      setMarking(true);
      await markCardRead(planetId, cardId);
      setCard((prev) => prev ? { ...prev, is_read: true } : prev);
      Taro.showToast({ title: '太棒了！🎉', icon: 'success' });
    } catch {
      Taro.showToast({ title: '标记失败了', icon: 'none' });
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!card) {
    return (
      <View className='page-container card-reader-page'>
        <View className='card-reader-empty'>
          <Text>找不到这张卡片 😢</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='page-container card-reader-page'>
      <View className='card-reader'>
        {/* 卡片标题 */}
        <View className='card-reader__header'>
          <Text className='card-reader__title'>{card.title}</Text>
          <Text className='card-reader__difficulty'>
            {card.difficulty === 'easy' ? '⭐' : card.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
          </Text>
        </View>

        {/* 主要内容 */}
        <View className='card-reader__body'>
          <Text className='card-reader__content'>{card.content}</Text>
        </View>

        {/* 趣味知识 */}
        {card.fun_fact && (
          <View className='card-reader__funfact'>
            <Text className='card-reader__funfact-label'>💡 你知道吗？</Text>
            <Text className='card-reader__funfact-text'>{card.fun_fact}</Text>
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      <View className='card-reader__bottom'>
        {card.is_read ? (
          <View className='card-reader__btn card-reader__btn--done'>
            <Text>✅ 已经读过啦</Text>
          </View>
        ) : (
          <View
            className={`card-reader__btn card-reader__btn--primary ${marking ? 'card-reader__btn--disabled' : ''}`}
            onClick={handleMarkRead}
          >
            <Text>🎉 我读完了！</Text>
          </View>
        )}
      </View>
    </View>
  );
}
