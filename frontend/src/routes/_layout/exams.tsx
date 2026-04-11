import { Box, Button, Container, Flex, Text, VStack, Badge, Icon } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiClock, FiPlay, FiX } from "react-icons/fi"
import useCustomToast from "@/hooks/useCustomToast"
import { examService } from "@/client/examService"
import type { ExamBooking, ExamSession } from "@/client/examTypes"

const SUBJECT_EMOJI: Record<string, string> = {
  math: "🔢", english: "🔤", chinese: "📖", science: "🔬", other: "📝",
}
const SUBJECT_LABEL: Record<string, string> = {
  math: "数学", english: "英语", chinese: "语文", science: "科学", other: "其他",
}
const MODE_LABEL: Record<string, string> = {
  classic: "📋 标准", countdown: "⏱️ 倒计时", challenge: "🏰 闯关", speed_run: "⚡ 极速",
}
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  booked: { label: "待考", color: "blue" },
  started: { label: "进行中", color: "orange" },
  completed: { label: "已完成", color: "green" },
  cancelled: { label: "已取消", color: "gray" },
  expired: { label: "已过期", color: "red" },
}

function BookingCard({ booking, onStart }: { booking: ExamBooking; onStart: (id: string) => void }) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const tpl = booking.template
  const status = STATUS_MAP[booking.status] || STATUS_MAP.booked

  const cancelMutation = useMutation({
    mutationFn: () => examService.cancelBooking(booking.id),
    onSuccess: () => {
      showSuccessToast("预约已取消")
      queryClient.invalidateQueries({ queryKey: ["exam-bookings"] })
    },
  })

  const scheduledDate = new Date(booking.scheduled_at)
  const isPast = scheduledDate < new Date()
  const canStart = booking.status === "booked"

  return (
    <Box borderRadius={20} overflow="hidden" boxShadow="lg" bg="white" transition="all 0.3s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}>
      <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={5}>
        <Flex align="center" gap={3}>
          <Box w="56px" h="56px" borderRadius={16} bg="whiteAlpha.300"
            display="flex" alignItems="center" justifyContent="center" fontSize="28px" flexShrink={0}>
            {SUBJECT_EMOJI[tpl?.subject || "other"]}
          </Box>
          <Box flex={1}>
            <Text fontWeight="black" fontSize="lg" color="white">{tpl?.title || "考试"}</Text>
            <Flex gap={2} mt={1} flexWrap="wrap">
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {SUBJECT_LABEL[tpl?.subject || "other"]}
              </Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {MODE_LABEL[tpl?.game_mode || "classic"]}
              </Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {tpl?.question_count || "?"} 题
              </Badge>
            </Flex>
          </Box>
          <Badge bg={`${status.color}.100`} color={`${status.color}.700`} borderRadius={10} px={3} py={1} fontSize="sm">
            {status.label}
          </Badge>
        </Flex>
      </Box>
      <Box px={5} py={4}>
        <Flex align="center" gap={2} mb={3} color="gray.500">
          <Icon fontSize="sm"><FiClock /></Icon>
          <Text fontSize="sm">
            预约时间：{scheduledDate.toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Flex>
        <Flex gap={3}>
          {canStart && (
            <Button flex={1} h="50px" borderRadius={14} fontSize="lg" fontWeight="bold"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white"
              _hover={{ opacity: 0.9 }} onClick={() => onStart(booking.id)}>
              <Icon mr={2}><FiPlay /></Icon> 开始考试
            </Button>
          )}
          {booking.status === "booked" && (
            <Button h="50px" borderRadius={14} variant="outline" color="gray.400"
              loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              <Icon><FiX /></Icon>
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  )
}

function SessionCard({ sess }: { sess: ExamSession }) {
  const navigate = useNavigate()
  const isCompleted = sess.status === "completed" || sess.status === "timeout"

  return (
    <Box borderRadius={20} overflow="hidden" boxShadow="md" bg="white"
      _hover={{ boxShadow: "lg" }} transition="all 0.2s">
      <Box bg={isCompleted
        ? "linear-gradient(135deg, #a8edea, #fed6e3)"
        : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"} p={4}>
        <Flex align="center" justify="space-between">
          <Text fontWeight="bold" color="white" fontSize="md">
            {isCompleted ? "✅" : "⏳"} 考试 #{sess.id.slice(0, 8)}
          </Text>
          <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2}>
            {sess.status === "completed" ? `${sess.score}/${sess.total_points}分` : "进行中"}
          </Badge>
        </Flex>
      </Box>
      <Box px={4} py={3}>
        <Flex justify="space-between" align="center">
          <Flex gap={4} fontSize="sm" color="gray.500">
            <Text>正确率 {sess.accuracy_rate.toFixed(0)}%</Text>
            <Text>连击 {sess.combo_max}🔥</Text>
            <Text>{sess.coins_earned > 0 ? "+" : ""}{sess.coins_earned} 🪙</Text>
          </Flex>
          {isCompleted && (
            <Button size="sm" borderRadius={10} variant="outline" colorPalette="purple"
              onClick={() => navigate({ to: "/exams/report/$sessionId", params: { sessionId: sess.id } })}>
              查看报告
            </Button>
          )}
          {sess.status === "in_progress" && (
            <Button size="sm" borderRadius={10} bg="linear-gradient(135deg, #f093fb, #f5576c)" color="white"
              onClick={() => navigate({ to: "/exams/play/$sessionId", params: { sessionId: sess.id } })}>
              继续答题
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  )
}

function ExamsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()
  const [tab, setTab] = useState<"bookings" | "history">("bookings")

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ["exam-bookings"],
    queryFn: () => examService.listBookings(),
    select: (res) => res.data,
  })

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ["exam-sessions"],
    queryFn: () => examService.listSessions(),
    select: (res) => res.data,
  })

  const startMutation = useMutation({
    mutationFn: (bookingId: string) => examService.startExam(bookingId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exam-bookings"] })
      navigate({ to: "/exams/play/$sessionId", params: { sessionId: res.data.id } })
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.detail || "无法开始考试")
    },
  })

  const bookings = bookingsData?.data ?? []
  const sessions = sessionsData?.data ?? []
  const pendingBookings = bookings.filter((b) => b.status === "booked")

  return (
    <Box minH="100vh" bg="linear-gradient(180deg, #f0f0ff 0%, #fff5f5 100%)" py={6}>
      <Container maxW="800px" px={{ base: 4, md: 8 }}>
        {/* Header */}
        <Box borderRadius={28} mb={6} overflow="hidden" boxShadow="xl"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={7}>
          <Text fontSize="2xl" fontWeight="black" color="white" mb={1}>📝 我的考试</Text>
          <Text color="whiteAlpha.900" fontSize="lg">
            {pendingBookings.length > 0
              ? `有 ${pendingBookings.length} 场考试等你来挑战！`
              : "暂无待考，休息一下吧~"}
          </Text>
        </Box>

        {/* Tabs */}
        <Flex gap={3} mb={5}>
          {(["bookings", "history"] as const).map((t) => (
            <Button key={t} borderRadius={14} px={6} h="44px"
              bg={tab === t ? "linear-gradient(135deg, #667eea, #764ba2)" : "white"}
              color={tab === t ? "white" : "gray.500"}
              boxShadow={tab === t ? "md" : "sm"}
              fontWeight="bold" onClick={() => setTab(t)}>
              {t === "bookings" ? "📅 预约考试" : "📊 考试记录"}
            </Button>
          ))}
        </Flex>

        {tab === "bookings" && (
          <VStack gap={4} align="stretch">
            {loadingBookings ? (
              <Text color="gray.400" textAlign="center" py={10}>加载中...</Text>
            ) : bookings.length === 0 ? (
              <Flex bg="white" borderRadius={28} p={12} justify="center" align="center"
                direction="column" gap={3} boxShadow="md">
                <Text fontSize="5xl">📅</Text>
                <Text color="gray.500" fontSize="xl" fontWeight="bold">暂无考试预约</Text>
                <Text color="gray.300">让爸爸妈妈帮你安排考试吧~</Text>
              </Flex>
            ) : (
              bookings.map((b) => (
                <BookingCard key={b.id} booking={b} onStart={(id) => startMutation.mutate(id)} />
              ))
            )}
          </VStack>
        )}

        {tab === "history" && (
          <VStack gap={3} align="stretch">
            {loadingSessions ? (
              <Text color="gray.400" textAlign="center" py={10}>加载中...</Text>
            ) : sessions.length === 0 ? (
              <Flex bg="white" borderRadius={28} p={12} justify="center" align="center"
                direction="column" gap={3} boxShadow="md">
                <Text fontSize="5xl">📊</Text>
                <Text color="gray.500" fontSize="xl" fontWeight="bold">还没有考试记录</Text>
                <Text color="gray.300">完成第一场考试后就能看到啦</Text>
              </Flex>
            ) : (
              sessions.map((s) => <SessionCard key={s.id} sess={s} />)
            )}
          </VStack>
        )}
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/exams")({
  component: ExamsPage,
})
