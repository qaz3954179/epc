import { Box, Flex, Text } from "@chakra-ui/react"
import type { RewardSummary } from "@/client"

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

interface RewardsPanelProps {
  data: RewardSummary
}

const RewardsPanel = ({ data }: RewardsPanelProps) => {
  const totalEarnings = data.category_earnings.reduce((s, c) => s + c.coins_earned, 0) || 1

  return (
    <Box>
      {/* Balance overview */}
      <Flex gap={4} mb={5} flexWrap="wrap">
        <Box flex="1" minW="120px" bg="green.50" borderRadius={12} p={4} textAlign="center">
          <Text fontSize="xs" color="description">总收入</Text>
          <Text fontSize="xl" fontWeight="bold" color="green.500">
            +{data.total_coins_earned}
          </Text>
        </Box>
        <Box flex="1" minW="120px" bg="red.50" borderRadius={12} p={4} textAlign="center">
          <Text fontSize="xs" color="description">总支出</Text>
          <Text fontSize="xl" fontWeight="bold" color="red.500">
            -{data.total_coins_spent}
          </Text>
        </Box>
        <Box flex="1" minW="120px" bg="blue.50" borderRadius={12} p={4} textAlign="center">
          <Text fontSize="xs" color="description">当前余额</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.500">
            {data.current_balance}
          </Text>
        </Box>
      </Flex>

      {/* Earnings by category (donut-style as horizontal bars) */}
      {data.category_earnings.length > 0 && (
        <Box mb={5}>
          <Text fontSize="sm" fontWeight="bold" mb={3}>收入来源</Text>
          {/* Stacked bar */}
          <Flex h="24px" borderRadius="12px" overflow="hidden" mb={3}>
            {data.category_earnings.map((cat) => {
              const pct = (cat.coins_earned / totalEarnings) * 100
              const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other
              return (
                <Box
                  key={cat.category}
                  w={`${pct}%`}
                  bg={color}
                  title={`${CATEGORY_NAMES[cat.category] || cat.category}: ${cat.coins_earned} 币`}
                  minW={pct > 0 ? "4px" : "0"}
                />
              )
            })}
          </Flex>
          {/* Legend */}
          <Flex gap={4} flexWrap="wrap">
            {data.category_earnings.map((cat) => {
              const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other
              const name = CATEGORY_NAMES[cat.category] || cat.category
              const pct = ((cat.coins_earned / totalEarnings) * 100).toFixed(0)
              return (
                <Flex key={cat.category} align="center" gap={1}>
                  <Box w="10px" h="10px" bg={color} borderRadius="2px" />
                  <Text fontSize="xs" color="description">
                    {name} {pct}% ({cat.coins_earned} 币)
                  </Text>
                </Flex>
              )
            })}
          </Flex>
        </Box>
      )}

      {/* Recent redemptions */}
      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={3}>最近兑换</Text>
        {data.recent_redemptions.length === 0 ? (
          <Flex
            justify="center"
            align="center"
            h="80px"
            color="description"
            bg="content.bg"
            borderRadius={8}
          >
            <Text>还没有兑换记录哦~</Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={2}>
            {data.recent_redemptions.map((r) => (
              <Flex
                key={r.id}
                bg="content.bg"
                p={3}
                borderRadius={8}
                justify="space-between"
                align="center"
              >
                <Box>
                  <Text fontSize="sm" fontWeight="medium">🎁 {r.prize_name}</Text>
                  <Text fontSize="xs" color="description">
                    {new Date(r.redeemed_at).toLocaleString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Box>
                <Text fontSize="sm" color="red.500" fontWeight="bold">
                  -{r.coins_spent} 币
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  )
}

export default RewardsPanel
