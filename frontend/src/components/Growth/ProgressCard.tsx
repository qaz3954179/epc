import { Box, Flex, Text } from "@chakra-ui/react"
import type { ProgressReport } from "@/client"

const CATEGORY_NAMES: Record<string, string> = {
  daily: "日常",
  exam: "考试",
  game: "游戏",
  pe: "体育",
  other: "其他",
}

const CATEGORY_COLORS: Record<string, string> = {
  daily: "#4A90E2",
  exam: "#FF6B6B",
  game: "#50C878",
  pe: "#FFB347",
  other: "#9B9B9B",
}

interface ProgressCardProps {
  data: ProgressReport
}

const ProgressCard = ({ data }: ProgressCardProps) => {
  const { comparison, category_stats, daily_trend, summary, period } = data
  const periodLabel = period === "week" ? "本周" : "本月"
  const prevLabel = period === "week" ? "上周" : "上月"

  // Find max for daily trend bar height
  const maxCount = Math.max(1, ...daily_trend.map((d) => d.count))

  return (
    <Box>
      {/* Summary */}
      <Box
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        borderRadius={12}
        p={5}
        mb={5}
        color="white"
      >
        <Text fontSize="md" fontWeight="medium">
          📊 {summary}
        </Text>
      </Box>

      {/* Comparison cards */}
      <Flex gap={4} mb={5} flexWrap="wrap">
        <Box flex="1" minW="140px" bg="white" borderRadius={12} p={4} boxShadow="sm">
          <Text fontSize="xs" color="description" mb={1}>{periodLabel}完成任务</Text>
          <Text fontSize="2xl" fontWeight="bold">{comparison.current_count}</Text>
          <Flex align="center" gap={1} mt={1}>
            {comparison.change_rate > 0 ? (
              <Text fontSize="xs" color="green.500">▲ {comparison.change_rate}%</Text>
            ) : comparison.change_rate < 0 ? (
              <Text fontSize="xs" color="red.500">▼ {Math.abs(comparison.change_rate)}%</Text>
            ) : (
              <Text fontSize="xs" color="description">持平</Text>
            )}
            <Text fontSize="xs" color="description">vs {prevLabel} {comparison.previous_count}</Text>
          </Flex>
        </Box>

        <Box flex="1" minW="140px" bg="white" borderRadius={12} p={4} boxShadow="sm">
          <Text fontSize="xs" color="description" mb={1}>{periodLabel}获得学习币</Text>
          <Text fontSize="2xl" fontWeight="bold" color="primary">{comparison.current_coins}</Text>
          <Flex align="center" gap={1} mt={1}>
            <Text fontSize="xs" color="description">{prevLabel} {comparison.previous_coins}</Text>
          </Flex>
        </Box>
      </Flex>

      {/* Daily trend - bar chart */}
      <Box mb={5}>
        <Text fontSize="sm" fontWeight="bold" mb={3}>每日完成趋势</Text>
        <Flex align="flex-end" gap={1} h="100px">
          {daily_trend.map((d) => {
            const height = maxCount > 0 ? (d.count / maxCount) * 80 : 0
            const dayLabel = new Date(d.date).getDate().toString()
            return (
              <Flex
                key={d.date}
                direction="column"
                align="center"
                flex="1"
                minW="20px"
              >
                <Text fontSize="9px" color="description" mb={1}>
                  {d.count > 0 ? d.count : ""}
                </Text>
                <Box
                  w="100%"
                  maxW="28px"
                  h={`${Math.max(height, 2)}px`}
                  bg={d.count > 0 ? "primary" : "#ebedf0"}
                  borderRadius="4px 4px 0 0"
                  title={`${d.date}: ${d.count} 次`}
                />
                <Text fontSize="9px" color="description" mt={1}>
                  {dayLabel}
                </Text>
              </Flex>
            )
          })}
        </Flex>
      </Box>

      {/* Category breakdown */}
      {category_stats.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={3}>分类统计</Text>
          <Flex direction="column" gap={2}>
            {category_stats.map((cat) => {
              const totalCount = category_stats.reduce((s, c) => s + c.count, 0)
              const pct = totalCount > 0 ? (cat.count / totalCount) * 100 : 0
              const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other
              const name = CATEGORY_NAMES[cat.category] || cat.category

              return (
                <Box key={cat.category}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="xs">{name}</Text>
                    <Text fontSize="xs" color="description">
                      {cat.count} 次 · {cat.coins_earned} 币
                    </Text>
                  </Flex>
                  <Box bg="#ebedf0" h="8px" borderRadius="4px" overflow="hidden">
                    <Box
                      bg={color}
                      h="100%"
                      w={`${pct}%`}
                      borderRadius="4px"
                      transition="width 0.3s"
                    />
                  </Box>
                </Box>
              )
            })}
          </Flex>
        </Box>
      )}
    </Box>
  )
}

export default ProgressCard
