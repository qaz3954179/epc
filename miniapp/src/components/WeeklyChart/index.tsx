import { View, Text } from '@tarojs/components';
import './index.scss';

interface WeeklyChartProps {
  data: { day: string; count: number }[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const today = new Date().getDay(); // 0=Sun

  return (
    <View className='weekly-chart'>
      <View className='weekly-chart__bars'>
        {data.map((item, idx) => {
          const heightPct = (item.count / maxCount) * 100;
          const isToday = idx === (today === 0 ? 6 : today - 1);
          return (
            <View key={item.day} className='weekly-chart__col'>
              <View className='weekly-chart__bar-wrapper'>
                <View
                  className={`weekly-chart__bar ${isToday ? 'weekly-chart__bar--today' : ''}`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </View>
              <Text className='weekly-chart__count'>{item.count}</Text>
              <Text className={`weekly-chart__label ${isToday ? 'weekly-chart__label--today' : ''}`}>
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
