import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { GrowthService } from "@/client"
import HeatmapChart from "@/components/Growth/HeatmapChart"
import ProgressCard from "@/components/Growth/ProgressCard"
import RewardsPanel from "@/components/Growth/RewardsPanel"
import PendingItems from "@/components/Pending/PendingItems"

const Growth = () => {
  const [period, setPeriod] = useState<"week" | "month">("week")

  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ["growth", "heatmap"],
    queryFn: () => GrowthService.getHeatmap({ days: 90 }),
  })

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["growth", "progress", period],
    queryFn: () => GrowthService.getProgress({ period }),
  })

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["growth", "rewards"],
    queryFn: () => GrowthService.getRewards({}),
  })

  if (heatmapLoading && progressLoading && rewardsLoading) {
    return <PendingItems />
  }

  return (
    <Container maxW="full" pb={8}>
      <Heading size="lg" mb={6}>
        成长记录
      </Heading>

      {/* Heatmap Section */}
      <Box bg="white" borderRadius={16} p={6} mb={6} boxShadow="sm">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight="bold" fontSize="lg">
            🔥 习惯热力图
          </Text>
          <Text fontSize="xs" color="description">
            最近 90 天
          </Text>
        </Flex>
        {heatmap ? (
          <HeatmapChart data={heatmap} />
        ) : (
          <Flex justify="center" align="center" h="100px" color="description">
            <Text>加载中...</Text>
          </Flex>
        )}
      </Box>

      {/* Progress + Rewards row */}
      <Flex gap={6} direction={{ base: "column", lg: "row" }}>
        {/* Progress Report */}
        <Box flex="1" bg="white" borderRadius={16} p={6} boxShadow="sm">
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" fontSize="lg">
              📈 进步报告
            </Text>
            <Flex
              bg="content.bg"
              borderRadius={8}
              overflow="hidden"
              fontSize="xs"
            >
              <Box
                px={3}
                py={1}
                cursor="pointer"
                bg={period === "week" ? "primary" : "transparent"}
                color={period === "week" ? "white" : "description"}
                fontWeight={period === "week" ? "bold" : "normal"}
                onClick={() => setPeriod("week")}
                transition="all 0.2s"
              >
                本周
              </Box>
              <Box
                px={3}
                py={1}
                cursor="pointer"
                bg={period === "month" ? "primary" : "transparent"}
                color={period === "month" ? "white" : "description"}
                fontWeight={period === "month" ? "bold" : "normal"}
                onClick={() => setPeriod("month")}
                transition="all 0.2s"
              >
                本月
              </Box>
            </Flex>
          </Flex>
          {progress ? (
            <ProgressCard data={progress} />
          ) : (
            <Flex justify="center" align="center" h="100px" color="description">
              <Text>加载中...</Text>
            </Flex>
          )}
        </Box>

        {/* Rewards */}
        <Box flex="1" bg="white" borderRadius={16} p={6} boxShadow="sm">
          <Text fontWeight="bold" fontSize="lg" mb={4}>
            🎁 奖励记录
          </Text>
          {rewards ? (
            <RewardsPanel data={rewards} />
          ) : (
            <Flex justify="center" align="center" h="100px" color="description">
              <Text>加载中...</Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/growth")({
  component: Growth,
})
