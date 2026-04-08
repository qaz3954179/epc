import { TaskCompletionsService } from "@/client"
import type { TodayTaskPublic, TaskCompletionPublic } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import { Box, Button, Container, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AiOutlineClockCircle } from "react-icons/ai"
import useCustomToast from "@/hooks/useCustomToast"
import type { ApiError } from "@/client/core/ApiError"
import { handleError } from "@/utils"

const CATEGORY_EMOJI: Record<string, string> = {
  daily: "📚",
  exam: "📝",
  game: "🎮",
  pe: "🏃",
}

// 每个分类对应的渐变色
const CATEGORY_GRADIENT: Record<string, string> = {
  daily: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  exam:  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  game:  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  pe:    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
}

const ENCOURAGEMENTS = ["加油！💪", "你最棒！⭐", "冲鸭！🦆", "继续！🔥"]

function getTodayTasksQueryOptions() {
  return {
    queryFn: () => TaskCompletionsService.getTodayTasks(),
    queryKey: ["today-tasks"],
  }
}

function getHistoryQueryOptions(itemId: string) {
  return {
    queryFn: () => TaskCompletionsService.getHistory({ itemId }),
    queryKey: ["task-history", itemId],
  }
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

// 顶部彩虹进度横幅
const HeroBanner = ({ completed, total, userName }: { completed: number; total: number; userName?: string }) => {
  const allDone = completed === total && total > 0
  const pct = total === 0 ? 0 : completed / total

  return (
    <Box
      borderRadius={28}
      mb={6}
      overflow="hidden"
      boxShadow="xl"
      bg={allDone
        ? "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"
        : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"}
      p={7}
      position="relative"
    >
      {/* 装饰星星 */}
      {["⭐","🌟","✨"].map((s, i) => (
        <Text key={i} position="absolute" fontSize="2xl" opacity={0.3}
          top={`${10 + i * 25}%`} right={`${8 + i * 6}%`}
          style={{ transform: `rotate(${i * 20}deg)` }}
        >{s}</Text>
      ))}

      <Text fontSize="2xl" fontWeight="black" color="white" mb={1}>
        {allDone ? "🏆 全部完成啦！" : `${userName ? `${userName}，` : ""}今天加油哦！`}
      </Text>
      <Text color="whiteAlpha.900" fontSize="lg" mb={4}>
        {allDone ? "你真的太厉害了！🎉🎉🎉" : `已完成 ${completed} / ${total} 个任务`}
      </Text>

      {/* 进度条 */}
      <Box bg="whiteAlpha.400" borderRadius="full" h="14px" overflow="hidden">
        <Box
          h="full" borderRadius="full"
          bg="white"
          w={`${pct * 100}%`}
          transition="width 0.6s ease"
          boxShadow="0 0 8px rgba(255,255,255,0.8)"
        />
      </Box>
      <Text color="whiteAlpha.900" fontSize="sm" mt={2} textAlign="right">
        {Math.round(pct * 100)}% 完成
      </Text>
    </Box>
  )
}

const TaskCard = ({ task, index }: { task: TodayTaskPublic; index: number }) => {
  const [showHistory, setShowHistory] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data: history } = useQuery({
    ...getHistoryQueryOptions(task.id),
    enabled: showHistory,
  })

  const completeMutation = useMutation({
    mutationFn: () => TaskCompletionsService.completeTask({ itemId: task.id }),
    onSuccess: () => {
      showSuccessToast("太棒了！打卡成功 🎉")
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-history", task.id] })
    },
    onError: (err: ApiError) => handleError(err),
  })

  const isCompleted = task.completed_today
  const progress = task.completed_count
  const target = task.target_count
  const pct = target === 0 ? 0 : Math.min(progress / target, 1)
  const emoji = CATEGORY_EMOJI[task.category || ""] || "✅"
  const gradient = CATEGORY_GRADIENT[task.category || ""] || "linear-gradient(135deg, #e0e0e0, #bdbdbd)"
  const encouragement = ENCOURAGEMENTS[index % ENCOURAGEMENTS.length]

  return (
    <Box
      borderRadius={24}
      overflow="hidden"
      boxShadow={isCompleted ? "sm" : "lg"}
      transition="all 0.3s"
      opacity={isCompleted ? 0.88 : 1}
      _hover={{ transform: isCompleted ? "none" : "translateY(-2px)", boxShadow: isCompleted ? "sm" : "xl" }}
    >
      {/* 彩色渐变头部 */}
      <Box bg={isCompleted ? "linear-gradient(135deg, #a8edea, #fed6e3)" : gradient} p={5}>
        <Flex align="center" gap={4}>
          <Box
            w="64px" h="64px" borderRadius="20px"
            bg="whiteAlpha.300"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="32px"
            flexShrink={0}
          >
            {isCompleted ? "✅" : emoji}
          </Box>
          <Box flex={1}>
            <Text fontWeight="black" fontSize="xl" color="white" textShadow="0 1px 3px rgba(0,0,0,0.2)">
              {task.title}
            </Text>
            {task.description && (
              <Text color="whiteAlpha.900" fontSize="sm" mt={0.5}>{task.description}</Text>
            )}
          </Box>
          <Box textAlign="center" bg="whiteAlpha.300" borderRadius={14} px={3} py={2} flexShrink={0}>
            <Text fontSize="xl">🪙</Text>
            <Text fontWeight="black" color="white" fontSize="lg">+{task.coins_reward}</Text>
          </Box>
        </Flex>
      </Box>

      {/* 白色内容区 */}
      <Box bg="white" px={5} pb={5} pt={4}>
        {/* 多次任务进度条 */}
        {target > 1 && (
          <Box mb={4}>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="sm" color="gray.500">完成进度</Text>
              <Text fontSize="sm" fontWeight="bold" color={isCompleted ? "green.500" : "gray.700"}>
                {progress} / {target} 次
              </Text>
            </Flex>
            <Box h="10px" bg="gray.100" borderRadius="full" overflow="hidden">
              <Box
                h="full" borderRadius="full"
                bg={isCompleted ? "green.400" : "blue.400"}
                w={`${pct * 100}%`}
                transition="width 0.5s ease"
              />
            </Box>
          </Box>
        )}

        <Flex gap={3}>
          <Button
            flex={1} h="60px" fontSize="xl" fontWeight="black"
            borderRadius={16}
            bg={isCompleted
              ? "linear-gradient(135deg, #a8edea, #fed6e3)"
              : gradient}
            color="white"
            disabled={isCompleted || completeMutation.isPending}
            loading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
            boxShadow={isCompleted ? "none" : "0 4px 15px rgba(0,0,0,0.15)"}
            _hover={isCompleted ? {} : { opacity: 0.9, transform: "scale(1.02)" }}
            _active={isCompleted ? {} : { transform: "scale(0.97)" }}
            transition="all 0.15s"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
          >
            {isCompleted ? "✓ 已完成" : `完成打卡  ${encouragement}`}
          </Button>
          <Button
            h="60px" w="60px" borderRadius={16}
            variant="outline" color="gray.400"
            onClick={() => setShowHistory(!showHistory)}
            flexShrink={0}
          >
            <Icon as={AiOutlineClockCircle} boxSize={6} />
          </Button>
        </Flex>

        {showHistory && history && (
          <Box mt={4} pt={4} borderTop="1px dashed" borderTopColor="gray.100">
            <Text fontSize="sm" color="gray.400" mb={2}>今日打卡记录</Text>
            {history.length === 0 ? (
              <Text fontSize="sm" color="gray.300">还没有记录哦</Text>
            ) : (
              <Flex gap={2} flexWrap="wrap">
                {history.map((r: TaskCompletionPublic, i: number) => (
                  <Box key={r.id} bg="green.50" borderRadius={10} px={3} py={1}>
                    <Text fontSize="sm" color="green.600" fontWeight="bold">
                      第{history.length - i}次 · {formatTime(r.completed_at)}
                    </Text>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function TodayTasks() {
  const { data, isLoading } = useQuery(getTodayTasksQueryOptions())
  const tasks = data?.data ?? []
  const completedCount = tasks.filter((t) => t.completed_today).length
  const totalCount = tasks.length

  if (isLoading) return <PendingItems />

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #faf0ff 0%, #e8f4fd 40%, #fff5f5 100%)"
      py={6}
    >
      <Container maxW="800px" px={{ base: 4, md: 8 }}>
        <HeroBanner completed={completedCount} total={totalCount} />

        {tasks.length === 0 ? (
          <Flex
            bg="white" borderRadius={28} p={16}
            justify="center" align="center" direction="column" gap={4}
            boxShadow="md"
          >
            <Text fontSize="6xl">🎯</Text>
            <Text color="gray.500" fontSize="2xl" fontWeight="bold">暂无待办任务</Text>
            <Text color="gray.300" fontSize="lg">请让爸爸妈妈添加任务吧~</Text>
          </Flex>
        ) : (
          <VStack gap={5} align="stretch">
            {[...tasks]
              .sort((a, b) => Number(a.completed_today) - Number(b.completed_today))
              .map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} />
              ))}
          </VStack>
        )}
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/items")({
  component: TodayTasks,
})
