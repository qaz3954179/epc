import { View, Text } from '@tarojs/components';
import type { TodayTaskPublic } from '../../types';
import { categoryEmoji } from '../../utils';
import './index.scss';

interface TaskCardProps {
  task: TodayTaskPublic;
  onComplete?: (itemId: string) => void;
  variant?: 'home' | 'tasks';
}

export default function TaskCard({ task, onComplete, variant = 'tasks' }: TaskCardProps) {
  const isCompleted = task.completed_today;
  const inProgress = task.completed_count > 0 && task.completed_count < task.target_count;

  const handleComplete = () => {
    if (!isCompleted && onComplete) {
      onComplete(task.item_id);
    }
  };

  return (
    <View className={`task-card task-card--${variant} ${isCompleted ? 'task-card--done' : ''}`}>
      <View className='task-card__left'>
        <Text className='task-card__icon'>{categoryEmoji(task.category)}</Text>
        <View className='task-card__info'>
          <Text className='task-card__title'>{task.title}</Text>
          {variant === 'tasks' && task.description && (
            <Text className='task-card__desc'>{task.description}</Text>
          )}
          <View className='task-card__meta'>
            <Text className='task-card__category'>{task.category}</Text>
            <Text className='task-card__reward'>+{task.coins_reward} 🪙</Text>
          </View>
        </View>
      </View>

      <View className='task-card__right'>
        {isCompleted ? (
          <View className='task-card__status task-card__status--done'>
            <Text>✅</Text>
            <Text className='task-card__status-text'>已完成</Text>
          </View>
        ) : inProgress ? (
          <View className='task-card__status task-card__status--progress'>
            <Text className='task-card__progress-text'>
              {task.completed_count}/{task.target_count}
            </Text>
            <View className='task-card__btn task-card__btn--progress' onClick={handleComplete}>
              <Text>继续</Text>
            </View>
          </View>
        ) : (
          <View className='task-card__btn task-card__btn--primary' onClick={handleComplete}>
            <Text>打卡</Text>
          </View>
        )}
      </View>
    </View>
  );
}
