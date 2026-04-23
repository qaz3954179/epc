import { View, Text } from '@tarojs/components';
import type { PlanetDetail, PlanetStage } from '../../types';
import './index.scss';

interface PlanetViewProps {
  planet: PlanetDetail;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const SIZE_MAP = { small: 100, medium: 160, large: 240 };

const STAGE_LABELS: Record<PlanetStage, string> = {
  seed: '种子',
  sprout: '发芽',
  growing: '成长中',
  thriving: '茁壮',
  born: '诞生 ✨',
  dimming: '暗淡中…',
};

/** 根据已完成里程碑数量生成地形纹理路径 */
function terrainPaths(completed: number, r: number): string[] {
  const paths: string[] = [];
  const cx = r;
  const cy = r;
  if (completed >= 1) {
    paths.push(`M${cx - r * 0.3},${cy + r * 0.1} Q${cx},${cy - r * 0.2} ${cx + r * 0.35},${cy + r * 0.15}`);
  }
  if (completed >= 2) {
    paths.push(`M${cx - r * 0.2},${cy + r * 0.35} Q${cx + r * 0.1},${cy + r * 0.2} ${cx + r * 0.3},${cy + r * 0.4}`);
  }
  if (completed >= 3) {
    paths.push(`M${cx - r * 0.4},${cy - r * 0.15} Q${cx - r * 0.15},${cy - r * 0.35} ${cx + r * 0.1},${cy - r * 0.2}`);
  }
  return paths;
}

/** 里程碑完成后出现的生命元素 */
const LIFE_ICONS = ['🌿', '🌸', '🍀', '🌈', '⭐'];

export default function PlanetView({ planet, size = 'medium', onClick }: PlanetViewProps) {
  const px = SIZE_MAP[size];
  const r = px / 2;
  const isDimming = planet.stage === 'dimming';
  const isBorn = planet.stage === 'born';
  const brightness = Math.max(0.3, Math.min(1, planet.brightness / 100));
  const completedCount = planet.completed_milestones;

  const containerClass = [
    'planet-view',
    `planet-view--${size}`,
    isDimming ? 'planet-view--dimming' : '',
    isBorn ? 'planet-view--born' : '',
  ].filter(Boolean).join(' ');

  return (
    <View className={containerClass} onClick={onClick} style={{ width: `${px}px`, height: `${px}px` }}>
      {/* SVG 星球主体 */}
      <View className='planet-view__svg-wrap'>
        <svg viewBox={`0 0 ${px} ${px}`} width={px} height={px} xmlns='http://www.w3.org/2000/svg'>
          <defs>
            <radialGradient id={`grad-${planet.id}`} cx='40%' cy='35%' r='60%'>
              <stop offset='0%' stopColor='#fff' stopOpacity='0.3' />
              <stop offset='100%' stopColor={planet.color || '#667eea'} stopOpacity='1' />
            </radialGradient>
            <clipPath id={`clip-${planet.id}`}>
              <circle cx={r} cy={r} r={r - 2} />
            </clipPath>
          </defs>

          {/* Layer 0: 基底圆 */}
          <circle
            cx={r} cy={r} r={r - 2}
            fill={`url(#grad-${planet.id})`}
            opacity={brightness}
          />

          {/* Layer 2: 地形纹理 */}
          <g clipPath={`url(#clip-${planet.id})`}>
            {terrainPaths(completedCount, r).map((d, i) => (
              <path
                key={i}
                d={d}
                fill='none'
                stroke='rgba(255,255,255,0.25)'
                strokeWidth={size === 'large' ? 4 : 2}
                strokeLinecap='round'
              />
            ))}
          </g>

          {/* 高光 */}
          <circle
            cx={r * 0.65} cy={r * 0.55}
            r={r * 0.18}
            fill='rgba(255,255,255,0.2)'
          />
        </svg>
      </View>

      {/* Layer 1: 大气层光晕 (CSS) */}
      <View
        className='planet-view__glow'
        style={{
          background: planet.color || '#667eea',
          width: `${px + 20}px`,
          height: `${px + 20}px`,
        }}
      />

      {/* Layer 3: 生命元素 */}
      {completedCount > 0 && (
        <View className='planet-view__life'>
          {LIFE_ICONS.slice(0, Math.min(completedCount, 5)).map((icon, i) => (
            <Text
              key={i}
              className='planet-view__life-icon'
              style={{
                transform: `rotate(${i * 72}deg) translateY(-${r * 0.55}px)`,
                fontSize: size === 'large' ? '20px' : size === 'medium' ? '14px' : '10px',
              }}
            >
              {icon}
            </Text>
          ))}
        </View>
      )}

      {/* Emoji */}
      <View className='planet-view__emoji'>
        <Text>{planet.emoji || '🪐'}</Text>
      </View>

      {/* Born 闪光特效 */}
      {isBorn && <View className='planet-view__sparkle' />}

      {/* Stage 标签 */}
      <View className='planet-view__stage'>
        <Text className='planet-view__stage-text'>{STAGE_LABELS[planet.stage]}</Text>
      </View>
    </View>
  );
}
