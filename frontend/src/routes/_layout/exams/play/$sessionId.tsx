import { Box, Button, Container, Flex, Text, VStack, Progress, Badge } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import useCustomToast from "@/hooks/useCustomToast"
import { examService } from "@/client/examService"
import type { ExamSessionQuestion } from "@/client/examTypes"

const TYPE_LABEL: Record<string, string> = {
  choice: "选择题", fill_blank: "填空题", true_false: "判断题", spelling: "拼写题",
}

function PlayPage() {
  const { sessionId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [startTime, setStartTime] = useState(Date.now())
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["exam-session-questions", sessionId],
    queryFn: () => examService.getSessionQuestions(sessionId),
    select: (res) => res.data,
  })

  const answerMutation = useMutation({
    mutationFn: (payload: { question_id: string; child_answer: string; time_spent_ms: number }) =>
      examService.submitAnswer(sessionId, payload),
    onSuccess: (res) => {
      const isCorrect = res.data.is_correct
      if (isCorrect) {
        showSuccessToast(`✅ 答对了！连击 ${res.data.combo_count}🔥`)
      } else {
        showErrorToast("❌ 答错了，继续加油！")
      }
      queryClient.invalidateQueries({ queryKey: ["exam-session-questions", sessionId] })
      setAnswer("")
      setStartTime(Date.now())
      // 自动跳到下一题
      setTimeout(() => {
        if (currentIndex < (questions?.length ?? 0) - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      }, 1500)
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.detail || "提交失败")
    },
  })

  const submitMutation = useMutation({
    mutationFn: () => examService.submitExam(sessionId),
    onSuccess: () => {
      showSuccessToast("🎉 考试完成！")
      navigate({ to: "/exams/report/$sessionId", params: { sessionId } })
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.detail || "交卷失败")
    },
  })

  const questions = data?.questions ?? []
  const gameMode = data?.game_mode ?? "classic"
  const timeLimitSec = data?.time_limit_seconds

  const currentQ = questions[currentIndex]
  const answeredCount = questions.filter((q) => q.answered).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  // 倒计时模式
  useEffect(() => {
    if (gameMode === "countdown" && timeLimitSec && currentQ) {
      setTimeLeft(timeLimitSec)
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            // 超时自动跳过
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(currentIndex + 1)
              setAnswer("")
              setStartTime(Date.now())
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentIndex, gameMode, timeLimitSec, currentQ])

  const handleSubmitAnswer = () => {
    if (!currentQ || !answer.trim()) {
      showErrorToast("请输入答案")
      return
    }
    const timeSpent = Date.now() - startTime
    answerMutation.mutate({
      question_id: currentQ.id,
      child_answer: answer.trim(),
      time_spent_ms: timeSpent,
    })
  }

  const handleFinish = () => {
    if (answeredCount < questions.length) {
      if (!confirm(`还有 ${questions.length - answeredCount} 题未作答，确定要交卷吗？`)) {
        return
      }
    }
    submitMutation.mutate()
  }

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="linear-gradient(180deg, #f0f0ff, #fff5f5)">
        <Text fontSize="2xl" color="gray.400">加载中...</Text>
      </Flex>
    )
  }

  if (!currentQ) {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column" gap={4}
        bg="linear-gradient(180deg, #f0f0ff, #fff5f5)">
        <Text fontSize="5xl">🎉</Text>
        <Text fontSize="2xl" fontWeight="bold" color="gray.600">所有题目已完成！</Text>
        <Button size="lg" borderRadius={16} bg="linear-gradient(135deg, #667eea, #764ba2)" color="white"
          onClick={handleFinish} disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "提交中..." : "交卷查看成绩"}
        </Button>
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="linear-gradient(180deg, #f0f0ff 0%, #fff5f5 100%)" py={6}>
      <Container maxW="700px" px={{ base: 4, md: 8 }}>
        {/* 顶部进度 */}
        <Box borderRadius={20} bg="white" p={5} mb={5} boxShadow="lg">
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              第 {currentIndex + 1} / {questions.length} 题
            </Text>
            <Flex gap={3} align="center">
              {gameMode === "countdown" && timeLeft !== null && (
                <Badge bg={timeLeft < 10 ? "red.100" : "blue.100"}
                  color={timeLeft < 10 ? "red.700" : "blue.700"}
                  borderRadius={10} px={3} py={1} fontSize="md" fontWeight="bold">
                  ⏱️ {timeLeft}s
                </Badge>
              )}
              <Badge bg="purple.100" color="purple.700" borderRadius={10} px={3} py={1}>
                已答 {answeredCount}
              </Badge>
            </Flex>
          </Flex>
          <Progress.Root value={progress} borderRadius="full" h="12px" colorPalette="purple">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Box>

        {/* 题目卡片 */}
        <Box borderRadius={24} overflow="hidden" boxShadow="xl" bg="white" mb={5}>
          <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={6}>
            <Flex justify="space-between" align="center" mb={3}>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={10} px={3} py={1}>
                {TYPE_LABEL[currentQ.question_type]}
              </Badge>
              <Text color="whiteAlpha.900" fontSize="lg" fontWeight="bold">
                {currentQ.points} 分
              </Text>
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="tall">
              {currentQ.content.stem}
            </Text>
            {currentQ.content.image_url && (
              <Box mt={4} borderRadius={16} overflow="hidden">
                <img src={currentQ.content.image_url} alt="题目图片" style={{ width: "100%" }} />
              </Box>
            )}
          </Box>

          <Box p={6}>
            {/* 选择题 */}
            {currentQ.question_type === "choice" && currentQ.content.options && (
              <VStack gap={3} align="stretch">
                {currentQ.content.options.map((opt, i) => (
                  <Button key={i} h="60px" borderRadius={16} fontSize="lg" textAlign="left"
                    justifyContent="flex-start" px={5}
                    bg={answer === opt ? "linear-gradient(135deg, #667eea, #764ba2)" : "gray.50"}
                    color={answer === opt ? "white" : "gray.700"}
                    _hover={{ bg: answer === opt ? undefined : "gray.100" }}
                    onClick={() => setAnswer(opt)}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </Button>
                ))}
              </VStack>
            )}

            {/* 判断题 */}
            {currentQ.question_type === "true_false" && (
              <Flex gap={4}>
                {["正确", "错误"].map((opt) => (
                  <Button key={opt} flex={1} h="70px" borderRadius={16} fontSize="xl" fontWeight="bold"
                    bg={answer === opt ? "linear-gradient(135deg, #667eea, #764ba2)" : "gray.50"}
                    color={answer === opt ? "white" : "gray.700"}
                    _hover={{ bg: answer === opt ? undefined : "gray.100" }}
                    onClick={() => setAnswer(opt)}>
                    {opt === "正确" ? "✅" : "❌"} {opt}
                  </Button>
                ))}
              </Flex>
            )}

            {/* 填空题/拼写题 */}
            {(currentQ.question_type === "fill_blank" || currentQ.question_type === "spelling") && (
              <Box>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="请输入答案"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                  style={{
                    width: "100%",
                    height: "60px",
                    borderRadius: "16px",
                    border: "2px solid #e2e8f0",
                    padding: "0 20px",
                    fontSize: "18px",
                    outline: "none",
                  }}
                />
              </Box>
            )}

            {/* 提交按钮 */}
            <Flex gap={3} mt={5}>
              <Button flex={1} h="60px" borderRadius={16} fontSize="xl" fontWeight="black"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white"
                disabled={!answer.trim() || answerMutation.isPending}
                onClick={handleSubmitAnswer}>
                {answerMutation.isPending ? "提交中..." : "提交答案 💪"}
              </Button>
              {currentIndex < questions.length - 1 && (
                <Button h="60px" borderRadius={16} variant="outline" color="gray.400"
                  onClick={() => {
                    setCurrentIndex(currentIndex + 1)
                    setAnswer("")
                    setStartTime(Date.now())
                  }}>
                  跳过
                </Button>
              )}
            </Flex>
          </Box>
        </Box>

        {/* 交卷按钮 */}
        <Flex justify="center">
          <Button size="lg" borderRadius={16} variant="outline" colorPalette="purple"
            onClick={handleFinish} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "提交中..." : "交卷"}
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/exams/play/$sessionId")({
  component: PlayPage,
})
