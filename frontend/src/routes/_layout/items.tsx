import { TaskCompletionsService } from "@/client"
import type { TodayTaskPublic, TaskCompletionPublic } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AiOutlineCheck, AiOutlineClockCircle } from "react-icons/ai"
import useCustomToast from "@/hooks/useCustomToast"
import type { ApiError } from "@/client/core/ApiError"
import { handleError } from "@/utils"

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
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const TaskCard = ({ task }: { task: TodayTaskPublic }) => {
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data: history } = useQuery({
    ...getHistoryQueryOptions(task.id),
    enabled: expanded,
  })

  const completeMutation = useMutation({
    mutationFn: () =>
      TaskCompletionsService.completeTask({ itemId: task.id }),
    onSuccess: () => {
      showSuccessToast("完成打卡！")
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-history", task.id] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const isCompleted = task.completed_today
  const progress = task.completed_count
  const target = task.target_count

  return (
    <Box
      bg="white"
      borderRadius={16}
      p={6}
      boxShadow={isCompleted ? "none" : "sm"}
      opacity={isCompleted ? 0.7 : 1}
      borderLeft="4px solid"
      borderLeftColor={
        isCompleted
          ? "green.400"
          : CATEGORY_COLOR[task.category || ""] || "gray.300"
      }
      transition="all 0.2s"
      _hover={{ boxShadow: "md" }}
    >
      <Flex justify="space-between" align="center">
        <Flex direction="column" gap={2} flex={1}>
          <Flex align="center" gap={3}>
            <Text fontWeight="bold" fontSize="lg">
              {task.title}
            </Text>
            {task.category && (
              <Badge
                colorPalette={CATEGORY_COLOR[task.category] || "gray"}
                size="sm"
              >
                {CATEGORY_MAP[task.category] || task.category}
              </Badge>
            )}
            {isCompleted && (
              <Badge colorPalette="green" size="sm">
                已完成
              </Badge>
            )}
          </Flex>
          {task.description && (
            <Text color="gray.500" fontSize="sm">
              {task.description}
            </Text>
          )}
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="gray.600">
              完成进度：
            </Text>
            <Flex align="center" gap={1}>
              {Array.from({ length: target }).map((_, i) => (
                <Box
                  key={i}
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={i < progress ? "green.400" : "gray.200"}
                  transition="background 0.2s"
                />
              ))}
            </Flex>
            <Text fontSize="sm" fontWeight="medium" color={isCompleted ? "green.500" : "gray.600"}>
              {progress}/{target}
            </Text>
          </Flex>
        </Flex>

        <Flex gap={2} align="center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            color="gray.500"
          >
            <Icon as={AiOutlineClockCircle} />
            {expanded ? "收起" : "记录"}
          </Button>
          <Button
            bg={isCompleted ? "gray.300" : "green.500"}
            color="white"
            size="sm"
            disabled={isCompleted || completeMutation.isPending}
            loading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
            _hover={isCompleted ? {} : { bg: "green.600" }}
          >
            <Icon as={AiOutlineCheck} />
            {isCompleted ? "已达标" : "完成"}
          </Button>
        </Flex>
      </Flex>

      {expanded && history && (
        <Box mt={4} pt={4} borderTop="1px solid" borderTopColor="gray.100">
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
            今日完成记录
          </Text>
          {history.length === 0 ? (
            <Text fontSize="sm" color="gray.400">
              暂无完成记录
            </Text>
          ) : (
            <VStack align="stretch" gap={1}>
              {history.map((record: TaskCompletionPublic, idx: number) => (
                <Flex
                  key={record.id}
                  align="center"
                  gap={2}
                  fontSize="sm"
                  color="gray.600"
                  bg="gray.50"
                  px={3}
                  py={2}
                  borderRadius={8}
                >
                  <Badge colorPalette="green" size="sm">
                    第{history.length - idx}次
                  </Badge>
                  <Icon as={AiOutlineClockCircle} color="gray.400" />
                  <Text>{formatTime(record.completed_at)}</Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  )
}

function TodayTasks() {
  const { data, isLoading } = useQuery(getTodayTasksQueryOptions())

  const tasks = data?.data ?? []
  const completedCount = tasks.filter((t) => t.completed_today).length
  const totalCount = tasks.length

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <Container maxW="full">
      <Heading size="lg" mb={2}>
        <Flex justifyContent="space-between" alignItems="center">
          今日待办
          <Flex align="center" gap={2}>
            <Badge colorPalette="green" fontSize="md" px={3} py={1}>
              {completedCount}/{totalCount} 已完成
            </Badge>
          </Flex>
        </Flex>
      </Heading>

      <Text color="gray.500" mb={6} fontSize="sm">
        完成每日任务，获取学习币奖励
      </Text>

      {tasks.length === 0 ? (
        <Flex
          bg="white"
          borderRadius={16}
          p={10}
          justifyContent="center"
          alignItems="center"
          direction="column"
          gap={2}
        >
          <Text color="gray.400" fontSize="lg">
            🎉 暂无待办任务
          </Text>
          <Text color="gray.400" fontSize="sm">
            请先在任务管理中创建任务
          </Text>
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {/* Incomplete tasks first */}
          {tasks
            .sort((a, b) => Number(a.completed_today) - Number(b.completed_today))
            .map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
        </VStack>
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/items")({
  component: TodayTasks,
})
