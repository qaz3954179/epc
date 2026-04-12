import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Select,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { z } from "zod"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

import { ParentService } from "@/client"
import type { ChildAccountPublic } from "@/client"
import { sdiService, type SDIDashboard } from "@/client/achievementService"
import PendingItems from "@/components/Pending/PendingItems"
import RouteGuard from "@/components/Common/RouteGuard"

const getDefaultAvatar = (gender: string | null) =>
  gender === "boy"
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=boy&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=girl&backgroundColor=ffd5dc"

// ── 雷达图 ────────────────────────────────────────────
const SDIRadarChart = ({ dashboard }: { dashboard: SDIDashboard }) => {
  const data = [
    { dimension: "主动性", score: dashboard.initiative_score, fullMark: 100 },
    { dimension: "探索性", score: dashboard.exploration_score, fullMark: 100 },
    { dimension: "持续性", score: dashboard.persistence_score, fullMark: 100 },
    { dimension: "质量", score: dashboard.quality_score, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#718096", fontSize: 14 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#a0aec0", fontSize: 12 }} />
        <Radar
          name="得分"
          dataKey="score"
          stroke="#ff6b35"
          fill="#ff6b35"
          fillOpacity={0.6}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ── 趋势图 ────────────────────────────────────────────
const SDITrendChart = ({ dashboard }: { dashboard: SDIDashboard }) => {
  const data = dashboard.trend.map((r) => ({
    date: r.record_date.slice(5), // MM-DD
    SDI: r.sdi_score,
    主动性: r.initiative_score,
    探索性: r.exploration_score,
    持续性: r.persistence_score,
    质量: r.quality_score,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fill: "#718096", fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#718096", fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="SDI" stroke="#ff6b35" strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="主动性" stroke="#4299e1" strokeWidth={2} />
        <Line type="monotone" dataKey="探索性" stroke="#48bb78" strokeWidth={2} />
        <Line type="monotone" dataKey="持续性" stroke="#ed8936" strokeWidth={2} />
        <Line type="monotone" dataKey="质量" stroke="#9f7aea" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── 主页面 ────────────────────────────────────────────
const ParentSDI = () => {
  const navigate = useNavigate()
  const { child: urlChild } = Route.useSearch()

  const { data: children, isLoading: childrenLoading } = useQuery<ChildAccountPublic[]>({
    queryFn: () => ParentService.getMyChildren(),
    queryKey: ["parentChildren"],
  })

  const childId = useMemo(() => {
    if (urlChild && children?.some((c) => c.id === urlChild)) return urlChild
    if (children && children.length > 0) return children[0].id
    return null
  }, [urlChild, children])

  const handleChildChange = (id: string) => {
    navigate({ search: { child: id } })
  }

  const child = children?.find((c) => c.id === childId) ?? null

  const { data: dashboard, isLoading: dashLoading } = useQuery<SDIDashboard>({
    queryKey: ["sdi", "dashboard", childId],
    queryFn: () => sdiService.getChildDashboard(childId!, 30).then((r) => r.data),
    enabled: !!childId,
  })

  if (childrenLoading) return <PendingItems />

  if (!children || children.length === 0) {
    return (
      <RouteGuard allowedRoles={["admin", "parent"]}>
        <Container maxW="full">
          <Flex
            direction="column"
            align="center"
            gap={4}
            py={16}
            bg="white"
            borderRadius={16}
          >
            <Text fontSize="5xl">👶</Text>
            <Text fontSize="lg" color="gray.500">
              还没有宝贝哦
            </Text>
            <Text fontSize="sm" color="gray.400">
              请先在「我的宝贝」页面添加宝贝
            </Text>
          </Flex>
        </Container>
      </RouteGuard>
    )
  }

  const avatarUrl = child?.avatar_url || getDefaultAvatar(child?.gender ?? null)
  const displayName = child?.nickname || child?.username || "宝贝"

  return (
    <RouteGuard allowedRoles={["admin", "parent"]}>
      <Container maxW="full" pb={8}>
        {/* 头部 */}
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <Flex align="center" gap={4}>
            <Image
              src={avatarUrl}
              alt={displayName}
              w="56px"
              h="56px"
              borderRadius="full"
              borderWidth="2px"
              borderColor="orange.200"
            />
            <Box>
              <Heading size="lg">📊 自驱力仪表盘</Heading>
              <Text color="gray.500" fontSize="sm">
                了解孩子的学习动力和成长轨迹
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={3}>
            <Text fontSize="sm" color="gray.500">
              当前宝贝：
            </Text>
            <Select.Root
              value={childId ? [childId] : []}
              onValueChange={({ value }) => value[0] && handleChildChange(value[0])}
              width="200px"
            >
              <Select.Control>
                <Select.Trigger borderRadius={10}>
                  <Select.ValueText placeholder="选择宝贝" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content borderRadius={10}>
                  {children.map((c) => (
                    <Select.Item item={c.id} key={c.id}>
                      {c.nickname || c.username}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Flex>
        </Flex>

        {dashLoading ? (
          <PendingItems />
        ) : dashboard ? (
          <>
            {/* SDI 得分卡片 */}
            <Box bg="white" borderRadius={16} p={6} mb={6} boxShadow="sm">
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="bold" fontSize="lg">
                  🎯 自驱力指数（SDI）
                </Text>
                {dashboard.score_change !== null && (
                  <Badge
                    colorPalette={dashboard.score_change >= 0 ? "green" : "red"}
                    borderRadius={8}
                    px={3}
                    py={1}
                  >
                    {dashboard.score_change >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(dashboard.score_change).toFixed(1)}
                  </Badge>
                )}
              </Flex>
              <Flex align="baseline" gap={2} mb={2}>
                <Text fontSize="5xl" fontWeight="bold" color="orange.500">
                  {dashboard.current_score.toFixed(1)}
                </Text>
                <Text fontSize="lg" color="gray.400">
                  / 100
                </Text>
              </Flex>
              {dashboard.previous_score !== null && (
                <Text fontSize="sm" color="gray.500">
                  上次得分：{dashboard.previous_score.toFixed(1)}
                </Text>
              )}
            </Box>

            {/* 四维雷达图 + 趋势图 */}
            <Grid
              templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
              gap={6}
              mb={6}
            >
              <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>
                  📐 四维分析
                </Text>
                <SDIRadarChart dashboard={dashboard} />
              </Box>

              <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
                <Text fontWeight="bold" fontSize="lg" mb={4}>
                  📈 趋势变化（近30天）
                </Text>
                <SDITrendChart dashboard={dashboard} />
              </Box>
            </Grid>

            {/* 行为分析 */}
            <Box bg="white" borderRadius={16} p={6} mb={6} boxShadow="sm">
              <Text fontWeight="bold" fontSize="lg" mb={4}>
                🔍 行为分析
              </Text>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                {/* 主动性 */}
                <Box bg="blue.50" borderRadius={12} p={4}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color="blue.700">
                      主动性
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {dashboard.initiative_score.toFixed(1)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="blue.600">
                    {dashboard.analysis.initiative?.summary || "暂无数据"}
                  </Text>
                  <Flex gap={2} mt={2} fontSize="xs" color="blue.500">
                    <Text>
                      主动 {dashboard.analysis.initiative?.self_initiated || 0}
                    </Text>
                    <Text>
                      提醒 {dashboard.analysis.initiative?.parent_reminded || 0}
                    </Text>
                    <Text>
                      拖延 {dashboard.analysis.initiative?.deadline_driven || 0}
                    </Text>
                  </Flex>
                </Box>

                {/* 探索性 */}
                <Box bg="green.50" borderRadius={12} p={4}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color="green.700">
                      探索性
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                      {dashboard.exploration_score.toFixed(1)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="green.600" mb={1}>
                    已尝试：
                    {dashboard.analysis.exploration?.categories_tried?.join("、") ||
                      "无"}
                  </Text>
                  {dashboard.analysis.exploration?.categories_missing?.length >
                    0 && (
                    <Text fontSize="xs" color="green.500">
                      未尝试：
                      {dashboard.analysis.exploration.categories_missing.join(
                        "、",
                      )}
                    </Text>
                  )}
                </Box>

                {/* 持续性 */}
                <Box bg="orange.50" borderRadius={12} p={4}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color="orange.700">
                      持续性
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="orange.600">
                      {dashboard.persistence_score.toFixed(1)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="orange.600">
                    连续学习{" "}
                    {dashboard.analysis.persistence?.current_streak || 0} 天
                  </Text>
                  <Text fontSize="xs" color="orange.500" mt={1}>
                    目标 {dashboard.analysis.persistence?.target_days || 21} 天
                    （进度{" "}
                    {dashboard.analysis.persistence?.progress_rate?.toFixed(0) ||
                      0}
                    %）
                  </Text>
                </Box>

                {/* 质量 */}
                <Box bg="purple.50" borderRadius={12} p={4}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color="purple.700">
                      质量
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="purple.600">
                      {dashboard.quality_score.toFixed(1)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="purple.600">
                    平均评分{" "}
                    {dashboard.analysis.quality?.avg_score?.toFixed(1) || "—"} /
                    5
                  </Text>
                  <Text fontSize="xs" color="purple.500" mt={1}>
                    超额完成 {dashboard.analysis.quality?.extra_count || 0} 次
                  </Text>
                </Box>
              </Grid>
            </Box>

            {/* 个性化建议 */}
            <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
              <Text fontWeight="bold" fontSize="lg" mb={4}>
                💡 个性化建议
              </Text>
              <Flex direction="column" gap={3}>
                {dashboard.suggestions.map((s, i) => (
                  <Flex key={i} align="start" gap={3}>
                    <Box
                      bg="orange.100"
                      color="orange.600"
                      w="24px"
                      h="24px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xs"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {i + 1}
                    </Box>
                    <Text fontSize="sm" color="gray.700" lineHeight="tall">
                      {s}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </>
        ) : (
          <Flex
            direction="column"
            align="center"
            gap={3}
            py={12}
            bg="white"
            borderRadius={16}
          >
            <Text fontSize="4xl">📊</Text>
            <Text color="gray.500">暂无数据</Text>
          </Flex>
        )}
      </Container>
    </RouteGuard>
  )
}

const sdiSearchSchema = z.object({
  child: z.string().optional(),
})

export const Route = createFileRoute("/_layout/parent/sdi")({
  component: ParentSDI,
  validateSearch: (search) => sdiSearchSchema.parse(search),
})
