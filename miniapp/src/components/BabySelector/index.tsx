import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import type { ChildPublic } from '../../types';
import './index.scss';

interface BabySelectorProps {
  children: ChildPublic[];
  currentId: string | null;
  onSelect: (childId: string) => void;
}

export default function BabySelector({ children: childList, currentId, onSelect }: BabySelectorProps) {
  const [open, setOpen] = useState(false);
  const current = childList.find((c) => c.id === currentId) || childList[0];

  if (!childList.length) return null;

  return (
    <View className='baby-selector'>
      <View className='baby-selector__trigger' onClick={() => setOpen(!open)}>
        <Text className='baby-selector__avatar'>{current?.avatar_url ? '' : '👶'}</Text>
        <Text className='baby-selector__name'>{current?.nickname || '选择宝贝'}</Text>
        <Text className={`baby-selector__arrow ${open ? 'baby-selector__arrow--open' : ''}`}>▼</Text>
      </View>

      {open && (
        <View className='baby-selector__dropdown'>
          {childList.map((child) => (
            <View
              key={child.id}
              className={`baby-selector__option ${child.id === currentId ? 'baby-selector__option--active' : ''}`}
              onClick={() => { onSelect(child.id); setOpen(false); }}
            >
              <Text className='baby-selector__option-avatar'>👶</Text>
              <Text className='baby-selector__option-name'>{child.nickname}</Text>
              {child.id === currentId && <Text className='baby-selector__check'>✓</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
