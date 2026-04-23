import { useState, useCallback } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useAuthStore } from '../../../store';
import { api } from '../../../services/api';
import EmptyState from '../../../components/EmptyState';
import LoadingSpinner from '../../../components/LoadingSpinner';
import type { ChildPublic, ChildCreate } from '../../../types';
import './child-manage.scss';

const GENDERS = [
  { label: '男孩', value: 'male' },
  { label: '女孩', value: 'female' },
  { label: '其他', value: 'other' },
];

export default function ChildManagePage() {
  const router = useRouter();
  const isNew = router.params.new === '1';
  const { switchChild } = useAuthStore();
  const [children, setChildren] = useState<ChildPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(isNew);
  const [form, setForm] = useState<ChildCreate>({ nickname: '', gender: 'male' });
  const [submitting, setSubmitting] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.get<ChildPublic[]>('/children/');
      setChildren(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => { fetchChildren(); });

  const handleAdd = async () => {
    if (!form.nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    try {
      setSubmitting(true);
      const child = await api.post<ChildPublic>('/children/', form);
      switchChild(child.id);
      setShowAdd(false);
      setForm({ nickname: '', gender: 'male' });
      await fetchChildren();
      Taro.showToast({ title: '添加成功', icon: 'success' });
      if (isNew) {
        Taro.switchTab({ url: '/pages/index/index' });
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '添加失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (child: ChildPublic) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除 ${child.nickname} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.delete(`/children/${child.id}`);
            await fetchChildren();
            Taro.showToast({ title: '已删除', icon: 'success' });
          } catch { Taro.showToast({ title: '删除失败', icon: 'none' }); }
        }
      },
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View className='page-container child-manage'>
      {isNew && (
        <View className='child-manage__welcome'>
          <Text className='child-manage__welcome-emoji'>🎉</Text>
          <Text className='child-manage__welcome-text'>欢迎！先添加一个宝贝吧</Text>
        </View>
      )}

      {/* Child List */}
      {children.length > 0 && (
        <View className='child-manage__list'>
          {children.map((child) => (
            <View key={child.id} className='child-manage__item'>
              <Text className='child-manage__item-avatar'>
                {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}
              </Text>
              <View className='child-manage__item-info'>
                <Text className='child-manage__item-name'>{child.nickname}</Text>
                <Text className='child-manage__item-meta'>
                  🪙 {child.coins} · ⭐ {child.streak_days}天
                </Text>
              </View>
              <Text className='child-manage__item-delete' onClick={() => handleDelete(child)}>删除</Text>
            </View>
          ))}
        </View>
      )}

      {children.length === 0 && !showAdd && (
        <EmptyState icon='👶' title='还没有宝贝' description='点击下方按钮添加' />
      )}

      {/* Add Form */}
      {showAdd && (
        <View className='child-manage__form'>
          <Text className='child-manage__form-title'>添加宝贝</Text>
          <Input
            className='child-manage__input'
            placeholder='宝贝昵称'
            value={form.nickname}
            onInput={(e) => setForm({ ...form, nickname: e.detail.value })}
          />
          <Picker
            mode='selector'
            range={GENDERS.map((g) => g.label)}
            value={GENDERS.findIndex((g) => g.value === form.gender)}
            onChange={(e) => setForm({ ...form, gender: GENDERS[Number(e.detail.value)].value as ChildCreate['gender'] })}
          >
            <View className='child-manage__picker'>
              <Text>性别：{GENDERS.find((g) => g.value === form.gender)?.label}</Text>
              <Text className='child-manage__picker-arrow'>▼</Text>
            </View>
          </Picker>
          <View className={`child-manage__submit ${submitting ? 'child-manage__submit--loading' : ''}`} onClick={handleAdd}>
            <Text>确认添加</Text>
          </View>
        </View>
      )}

      {!showAdd && (
        <View className='child-manage__add-btn' onClick={() => setShowAdd(true)}>
          <Text>+ 添加宝贝</Text>
        </View>
      )}
    </View>
  );
}
