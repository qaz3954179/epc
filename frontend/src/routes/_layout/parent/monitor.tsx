import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Select,
  Table,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { z } from "zod"
import { FiClock, FiTrendingUp, FiZap } from "react-icons/fi"

import { ItemsService, ParentService } from "@/client"
import type { ChildAccountPublic, CoinLogPublic, PrizeRedemptionPublic, TaskCompletionPublic } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import RouteGuard from "@/components/Common/RouteGuard"

// ── 辅助映射 ─────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  daily: "日常任务",
  exam: "模拟考试",
  game: "互动游戏",
  pe: "体能项目",
}
const CATEGORY_COLOR: Record<string, string> = {
  daily: "blue",
  exam: "orange",
  game: "purple",
  pe: "green",
}

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  task_completion: "任务完成",
  prize_redemption: "奖品兑换",
  admin_adjustment: "管理调整",
  refund: "退款",
  referral_bonus: "推荐奖励",
}

const REDEMPTION_STATUS_MAP: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
}
const REDEMPTION_STATUS_COLOR: Record<string, string> = {
  pending: "yellow",
  processing: "blue",
  completed: "green",
  cancelled: "gray",
  refunded: "red",
}

const TABS = ["概览", "任务记录", "学习币明细", "兑换记录"] as const
type Tab = (typeof TABS)[number]

interface ChildDashboard {
  child_id: string
  nickname: string | null
  coins: number
  today_tasks: number
  total_tasks: number
}

const getDefaultAvatar = (gender: string | null) =>
  gender === "boy"
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=boy&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=girl&backgroundColor=ffd5dc"

const formatTime = (iso?: string) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// ── 主页面 ────────────────────────────────────────────
const ParentMonitor = () => {
  const [activeTab, setActiveTab] = useState<Tab>("概览")
  const navigate = useNavigate()
  const { child: urlChild } = Route.useSearch()

  const { data: children, isLoading: childrenLoading } = useQuery<ChildAccountPublic[]>({
    queryFn: () => ParentService.getMyChildren(),
    queryKey: ["parentChildren"],
  })

  // 优先使用 URL 中的 child 参数，否则默认选第一个
  const childId = useMemo(() => {
    if (urlChild && children?.some((c) => c.id === urlChild)) return urlChild
    if (children && children.length > 0) return children[0].id
    return null
  }, [urlChild, children])

  const handleChildChange = (id: string) => {
    navigate({ search: { child: id } })
    setActiveTab("概览")
  }

  const child = children?.find((c) => c.id === childId) ?? null
  const { data: dashboard, isLoading: dashLoading } = useQuery<ChildDashboard>({
    queryKey: ["childDashboard", childId],
    queryFn: () =>
      ParentService.getChildDashboard({ childId: childId! }),
    enabled: !!childId,
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskCompletionPublic[]>({
    queryKey: ["childTasks", childId],
    queryFn: () =>
      ParentService.getChildTaskCompletions({ childId: childId!, limit: 100 }),
    enabled: !!childId && activeTab === "任务记录",
  })

  const { data: itemsMap, isLoading: itemsLoading } = useQuery({
    queryKey: ["allItems"],
    queryFn: () => ItemsService.readItems({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: coins, isLoading: coinsLoading } = useQuery<{ data: CoinLogPublic[]; count: number }>({
    queryKey: ["childCoins", childId],
    queryFn: () =>
      ParentService.getChildCoinLogs({ childId: childId!, limit: 100 }),
    enabled: !!childId && activeTab === "学习币明细",
  })

  const { data: redemptions, isLoading: redemptionsLoading } = useQuery<{ data: PrizeRedemptionPublic[]; count: number }>({
    queryKey: ["childRedemptions", childId],
    queryFn: () =>
      ParentService.getChildRedemptions({ childId: childId!, limit: 100 }),
    enabled: !!childId && activeTab === "兑换记录",
  })

  // ── itemsMap 辅助 ───────────────────────────────────
  const itemLookup = useMemo(() => {
    const map = new Map<string, { title: string; category?: string | null; coins_reward?: number }>()
    itemsMap?.data?.forEach((item) => {
      map.set(item.id, { title: item.title, category: item.category, coins_reward: item.coins_reward })
    })
    return map
  }, [itemsMap])

  // ── 渲染：空状态 ────────────────────────────────────
  if (childrenLoading) return <PendingItems />

  if (!children || children.length === 0) {
    return (
      <RouteGuard allowedRoles={["admin", "parent"]}>
        <Container maxW="full">
          <Flex direction="column" align="center" gap={4} py={16} bg="white" borderRadius={16}>
            <Text fontSize="5xl">👶</Text>
            <Text fontSize="lg" color="gray.500">还没有宝贝哦</Text>
            <Text fontSize="sm" color="gray.400">请先在「我的宝贝」页面添加宝贝</Text>
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
        {/* 头部：宝贝选择器 */}
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
              <Heading size="lg">📊 家长监控面板</Heading>
              <Text color="gray.500" fontSize="sm">查看宝贝的学习数据和成长轨迹</Text>
            </Box>
          </Flex>

          <Flex align="center" gap={3}>
            <Text fontSize="sm" color="gray.500">当前宝贝：</Text>
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

        {/* Tab 切换 */}
        <Flex gap={2} mb={6} flexWrap="wrap">
          {TABS.map((tab) => (
            <Box
              key={tab}
              px={5}
              py={2}
              borderRadius={10}
              bg={activeTab === tab ? "orange.500" : "white"}
              color={activeTab === tab ? "white" : "gray.600"}
              fontWeight={activeTab === tab ? "bold" : "medium"}
              fontSize="sm"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: activeTab === tab ? "orange.600" : "orange.50" }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Box>
          ))}
        </Flex>

        {/* ── 概览 ──────────────────────────────────── */}
        {activeTab === "概览" && (
          <>
            {dashLoading ? <PendingItems /> : dashboard ? (
              <>
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
                  <StatCard
                    icon="🪙"
                    label="学习币余额"
                    value={dashboard.coins}
                    color="orange"
                  />
                  <StatCard
                    icon={<FiZap />}
                    label="今日完成任务"
                    value={dashboard.today_tasks}
                    color="blue"
                  />
                  <StatCard
                    icon={<FiTrendingUp />}
                    label="累计完成任务"
                    value={dashboard.total_tasks}
                    color="green"
                  />
                  <StatCard
                    icon={<FiClock />}
                    label="上次更新"
                    value={new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    color="purple"
                  />
                </Grid>

                {/* 最近任务 & 最近兑换 双栏 */}
                <Flex gap={6} direction={{ base: "column", lg: "row" }}>
                  <Box flex="1" bg="white" borderRadius={16} p={6} boxShadow="sm">
                    <Text fontWeight="bold" fontSize="lg" mb={4}>📋 最近任务完成</Text>
                    {tasksLoading ? (
                      <Text color="gray.400" fontSize="sm">加载中...</Text>
                    ) : tasks && tasks.length > 0 ? (
                      <Flex direction="column" gap={3}>
                        {tasks.slice(0, 8).map((t) => {
                          const item = itemLookup.get(t.item_id)
                          return (
                            <Flex key={t.id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor="gray.50">
                              <Flex align="center" gap={3}>
                                {item?.category && (
                                  <Badge colorPalette={CATEGORY_COLOR[item.category] || "gray"} borderRadius={8} px={2} fontSize="xs">
                                    {CATEGORY_MAP[item.category] || item.category}
                                  </Badge>
                                )}
                                <Text fontSize="sm" fontWeight="medium">
                                  {item?.title || "未知任务"}
                                </Text>
                              </Flex>
                              <Text fontSize="xs" color="gray.400">
                                {formatTime(t.completed_at)}
                              </Text>
                            </Flex>
                          )
                        })}
                      </Flex>
                    ) : (
                      <Text color="gray.400" fontSize="sm">暂无任务记录</Text>
                    )}
                  </Box>

                  <Box flex="1" bg="white" borderRadius={16} p={6} boxShadow="sm">
                    <Text fontWeight="bold" fontSize="lg" mb={4}>🎁 最近兑换记录</Text>
                    {redemptionsLoading ? (
                      <Text color="gray.400" fontSize="sm">加载中...</Text>
                    ) : redemptions && redemptions.data.length > 0 ? (
                      <Flex direction="column" gap={3}>
                        {redemptions.data.slice(0, 8).map((r) => (
                          <Flex key={r.id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor="gray.50">
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">{r.prize_name}</Text>
                              <Text fontSize="xs" color="orange.500">-{r.coins_spent} 学习币</Text>
                            </Box>
                            <Badge colorPalette={REDEMPTION_STATUS_COLOR[r.status] || "gray"} borderRadius={8} px={2} fontSize="xs">
                              {REDEMPTION_STATUS_MAP[r.status] || r.status}
                            </Badge>
                          </Flex>
                        ))}
                      </Flex>
                    ) : (
                      <Text color="gray.400" fontSize="sm">暂无兑换记录</Text>
                    )}
                  </Box>
                </Flex>
              </>
            ) : (
              <Flex direction="column" align="center" gap={3} py={12} bg="white" borderRadius={16}>
                <Text fontSize="4xl">📊</Text>
                <Text color="gray.500">暂无数据</Text>
              </Flex>
            )}
          </>
        )}

        {/* ── 任务记录 ─────────────────────────────── */}
        {activeTab === "任务记录" && (
          <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="bold" fontSize="lg">📋 任务完成记录</Text>
              <Text fontSize="xs" color="gray.400">
                {tasks?.length ?? 0} 条
              </Text>
            </Flex>
            {tasksLoading ? (
              <PendingItems />
            ) : tasks && tasks.length > 0 ? (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">任务名称</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">分类</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">奖励</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">完成时间</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tasks.map((t) => {
                    const item = itemLookup.get(t.item_id)
                    return (
                      <Table.Row key={t.id} _hover={{ bg: "orange.50" }}>
                        <Table.Cell fontWeight="medium">{item?.title || "未知任务"}</Table.Cell>
                        <Table.Cell>
                          {item?.category ? (
                            <Badge colorPalette={CATEGORY_COLOR[item.category] || "gray"} borderRadius={8} px={2}>
                              {CATEGORY_MAP[item.category]}
                            </Badge>
                          ) : (
                            <Text color="gray.300">—</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette="yellow" borderRadius={8}>
                            +{item?.coins_reward ?? "?"} 🪙
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="sm" color="gray.500">
                          {formatTime(t.completed_at)}
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table.Root>
            ) : (
              <Flex direction="column" align="center" gap={3} py={8}>
                <Text fontSize="3xl">📋</Text>
                <Text color="gray.400" fontSize="sm">暂无任务完成记录</Text>
              </Flex>
            )}
          </Box>
        )}

        {/* ── 学习币明细 ───────────────────────────── */}
        {activeTab === "学习币明细" && (
          <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="bold" fontSize="lg">🪙 学习币明细</Text>
              <Text fontSize="xs" color="gray.400">共 {coins?.count ?? 0} 条</Text>
            </Flex>
            {coinsLoading ? (
              <PendingItems />
            ) : coins && coins.data.length > 0 ? (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">类型</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">变动</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">变动后余额</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">说明</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">时间</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {coins.data.map((log) => (
                    <Table.Row key={log.id} _hover={{ bg: "orange.50" }}>
                      <Table.Cell>
                        <Badge colorPalette={log.amount > 0 ? "green" : "red"} borderRadius={8} px={2}>
                          {TRANSACTION_TYPE_MAP[log.transaction_type] || log.transaction_type}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontWeight="bold" color={log.amount > 0 ? "green.500" : "red.500"}>
                        {log.amount > 0 ? "+" : ""}{log.amount}
                      </Table.Cell>
                      <Table.Cell>{log.balance_after}</Table.Cell>
                      <Table.Cell fontSize="sm" truncate maxW="200px">{log.description}</Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.500">{formatTime(log.created_at)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            ) : (
              <Flex direction="column" align="center" gap={3} py={8}>
                <Text fontSize="3xl">🪙</Text>
                <Text color="gray.400" fontSize="sm">暂无学习币记录</Text>
              </Flex>
            )}
          </Box>
        )}

        {/* ── 兑换记录 ─────────────────────────────── */}
        {activeTab === "兑换记录" && (
          <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="bold" fontSize="lg">🎁 兑换记录</Text>
              <Text fontSize="xs" color="gray.400">共 {redemptions?.count ?? 0} 条</Text>
            </Flex>
            {redemptionsLoading ? (
              <PendingItems />
            ) : redemptions && redemptions.data.length > 0 ? (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">奖品名称</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">类型</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">消耗学习币</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">状态</Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="semibold" color="gray.600">兑换时间</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {redemptions.data.map((r) => (
                    <Table.Row key={r.id} _hover={{ bg: "orange.50" }}>
                      <Table.Cell fontWeight="medium">{r.prize_name}</Table.Cell>
                      <Table.Cell>
                        <Badge variant="outline" borderRadius={8} px={2} fontSize="xs">
                          {r.prize_type === "virtual" ? "虚拟" : "实物"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell color="orange.500" fontWeight="bold">-{r.coins_spent}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={REDEMPTION_STATUS_COLOR[r.status] || "gray"} borderRadius={8} px={2}>
                          {REDEMPTION_STATUS_MAP[r.status] || r.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.500">{formatTime(r.redeemed_at)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            ) : (
              <Flex direction="column" align="center" gap={3} py={8}>
                <Text fontSize="3xl">🎁</Text>
                <Text color="gray.400" fontSize="sm">暂无兑换记录</Text>
              </Flex>
            )}
          </Box>
        )}
      </Container>
    </RouteGuard>
  )
}

// ── 统计卡片子组件 ────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) => (
  <Box
    bg="white"
    borderRadius={16}
    p={5}
    boxShadow="sm"
    transition="all 0.2s"
    _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
  >
    <Flex align="center" gap={3} mb={3}>
      <Box
        w="40px"
        h="40px"
        borderRadius={12}
        bg={`${color}.50`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="lg"
        color={`${color}.500`}
      >
        {typeof icon === "string" ? icon : icon}
      </Box>
    </Flex>
    <Text fontSize="2xl" fontWeight="bold" color={`${color}.600`}>
      {value}
    </Text>
    <Text fontSize="sm" color="gray.500" mt={1}>
      {label}
    </Text>
  </Box>
)

const monitorSearchSchema = z.object({
  child: z.string().optional(),
})

export const Route = createFileRoute("/_layout/parent/monitor")({
  component: ParentMonitor,
  validateSearch: (search) => monitorSearchSchema.parse(search),
})
