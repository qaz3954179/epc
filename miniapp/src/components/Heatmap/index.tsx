import { View, Text } from '@tarojs/components';
import type { HeatmapDay } from '../../types';
import './index.scss';

interface HeatmapProps {
  data: HeatmapDay[];
  days?: number;
  onDayClick?: (day: HeatmapDay) => void;
}

function getColor(count: number): string {
  if (count === 0) return '#ebedf0';
  if (count <= 2) return '#9be9a8';
  if (count <= 5) return '#40c463';
  return '#30a14e';
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Heatmap({ data, days = 30, onDayClick }: HeatmapProps) {
  // Build a map for quick lookup
  const dayMap = new Map(data.map((d) => [d.date, d.count]));

  // Generate date cells for the last N days
  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({ date: dateStr, count: dayMap.get(dateStr) || 0 });
  }

  return (
    <View className='heatmap'>
      <View className='heatmap__weekdays'>
        {WEEKDAYS.map((w) => (
          <Text key={w} className='heatmap__weekday'>{w}</Text>
        ))}
      </View>
      <View className='heatmap__grid'>
        {cells.map((cell) => (
          <View
            key={cell.date}
            className='heatmap__cell'
            style={{ backgroundColor: getColor(cell.count) }}
            onClick={() => onDayClick?.({ date: cell.date, count: cell.count })}
          />
        ))}
      </View>
      <View className='heatmap__legend'>
        <Text className='heatmap__legend-text'>少</Text>
        {[0, 1, 3, 6].map((v) => (
          <View key={v} className='heatmap__legend-cell' style={{ backgroundColor: getColor(v) }} />
        ))}
        <Text className='heatmap__legend-text'>多</Text>
      </View>
    </View>
  );
}
