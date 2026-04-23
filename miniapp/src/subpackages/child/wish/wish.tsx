import { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePlanetStore } from '../../../store';
import './wish.scss';

const CATEGORIES = [
  { label: '🧸 玩具', value: '玩具' },
  { label: '✈️ 旅行', value: '旅行' },
  { label: '🍰 美食', value: '美食' },
  { label: '📚 学习', value: '学习' },
  { label: '💫 其他', value: '其他' },
];

const EMOJIS = ['🌟', '🎈', '🦄', '🌈', '🎁', '🚀', '🐱', '🍦', '🎨', '⚽', '🎵', '🌻'];

export default function WishPage() {
  const { createWish } = usePlanetStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '写下你的愿望吧~', icon: 'none' });
      return;
    }
    try {
      setSubmitting(true);
      await createWish({
        content: content.trim(),
        category: category || undefined,
        emoji: emoji || undefined,
      });
      setSubmitted(true);
    } catch {
      Taro.showToast({ title: '许愿失败了，再试一次吧', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className='page-container wish-page wish-page--success'>
        <View className='wish-success'>
          <Text className='wish-success__star'>✨</Text>
          <Text className='wish-success__title'>你的愿望已飞向星空 ✨</Text>
          <Text className='wish-success__desc'>爸爸妈妈会看到你的愿望哦，耐心等待吧~</Text>
          <View className='wish-success__btn' onClick={() => Taro.navigateBack()}>
            <Text>好的！</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='page-container wish-page'>
      <View className='wish-header'>
        <Text className='wish-header__icon'>🌠</Text>
        <Text className='wish-header__title'>许一个愿望吧</Text>
        <Text className='wish-header__desc'>告诉星星你最想要什么~</Text>
      </View>

      {/* 愿望输入 */}
      <View className='wish-input-card'>
        <Textarea
          className='wish-input-card__textarea'
          placeholder='我想要...'
          placeholderClass='wish-input-card__placeholder'
          maxlength={200}
          value={content}
          onInput={(e) => setContent(e.detail.value)}
        />
        <Text className='wish-input-card__count'>{content.length}/200</Text>
      </View>

      {/* 分类选择 */}
      <View className='wish-section'>
        <Text className='wish-section__title'>选一个分类</Text>
        <View className='wish-categories'>
          {CATEGORIES.map((cat) => (
            <View
              key={cat.value}
              className={`wish-categories__item ${category === cat.value ? 'wish-categories__item--active' : ''}`}
              onClick={() => setCategory(category === cat.value ? '' : cat.value)}
            >
              <Text>{cat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Emoji 选择 */}
      <View className='wish-section'>
        <Text className='wish-section__title'>选一个表情</Text>
        <View className='wish-emojis'>
          {EMOJIS.map((e) => (
            <View
              key={e}
              className={`wish-emojis__item ${emoji === e ? 'wish-emojis__item--active' : ''}`}
              onClick={() => setEmoji(emoji === e ? '' : e)}
            >
              <Text>{e}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 提交按钮 */}
      <View
        className={`wish-submit ${submitting ? 'wish-submit--disabled' : ''}`}
        onClick={submitting ? undefined : handleSubmit}
      >
        <Text className='wish-submit__text'>🚀 发射愿望！</Text>
      </View>
    </View>
  );
}
