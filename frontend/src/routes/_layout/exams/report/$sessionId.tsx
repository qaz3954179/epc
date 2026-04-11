import { Box, Button, Container, Flex, Text, VStack, Badge } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { examService } from "@/client/examService"

const SUBJECT_LABEL: Record<string, string> = {
  math: "🔢 数学", english: "🔤 英语", chinese: "📖 语文", science: "🔬 科学", other: "📝 其他",
}

function ReportPage() {
  const { sessionId } = Route.useParams()
  const navigate = useNavigate()

  const { data: report, isLoading } = useQuery({
    queryKey: ["exam-report", sessionId],
    queryFn: () => examService.getReport(sessionId),
    select: (res) => res.data,
  })

  if (isLoading || !report) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="linear-gradient(180deg, #f0f0ff, #fff5f5)">
        <Text fontSize="2xl" color="gray.400">加载报告中...</Text>
      </Flex>
    )
  }

  const scoreRate = report.total_points > 0 ? (report.score / report.total_points) * 100 : 0
  const minutes = Math.floor(report.time_spent_seconds / 60)
  const seconds = report.time_spent_seconds % 60

  return (
    <Box minH="100vh" bg="linear-gradient(180deg, #f0f0ff 0%, #fff5f5 100%)" py={6}>
      <Container maxW="700px" px={{ base: 4, md: 8 }}>
        {/* 成绩卡片 */}
        <Box borderRadius={28} overflow="hidden" boxShadow="xl" mb={6}>
          <Box bg={scoreRate >= 90
            ? "linear-gradient(135deg, #f6d365, #fda085)"
            : scoreRate >= 70
              ? "linear-gradient(135deg, #667eea, #764ba2)"
              : "linear-gradient(135deg, #a18cd1, #fbc2eb)"}
            p={8} textAlign="center">
            <Text fontSize="6xl" mb={2}>
              {scoreRate >= 90 ? "🏆" : scoreRate >= 70 ? "👍" : scoreRate >= 50 ? "💪" : "📚"}
            </Text>
            <Text fontSize="5xl" fontWeight="black" color="white" mb={1}>
              {report.score} <Text as="span" fontSize="2xl" fontWeight="normal">/ {report.total_points}</Text>
            </Text>
            <Text color="whiteAlpha.900" fontSize="xl" mb={4}>{report.summary}</Text>

            <Flex justify="center" gap={6} flexWrap="wrap">
              <Box textAlign="center">
                <Text color="whiteAlpha.700" fontSize="sm">正确率</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">{report.accuracy_rate.toFixed(0)}%</Text>
              </Box>
              <Box textAlign="center">
                <Text color="whiteAlpha.700" fontSize="sm">最大连击</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">{report.combo_max}🔥</Text>
              </Box>
              <Box textAlign="center">
                <Text color="whiteAlpha.700" fontSize="sm">用时</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">{minutes}:{seconds.toString().padStart(2, "0")}</Text>
              </Box>
              <Box textAlign="center">
                <Text color="whiteAlpha.700" fontSize="sm">学习币</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  {report.coins_earned > 0 ? "+" : ""}{report.coins_earned} 🪙
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box bg="white" p={5}>
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontSize="sm">
                {SUBJECT_LABEL[report.subject] || report.subject} · {report.template_title}
              </Text>
            </Flex>
          </Box>
        </Box>

        {/* 答题详情 */}
        <Text fontSize="lg" fontWeight="bold" color="gray.600" mb={4}>📋 答题详情</Text>
        <VStack gap={3} align="stretch" mb={8}>
          {report.answers.map((a, i) => (
            <Box key={a.question_id} borderRadius={16} bg="white" boxShadow="sm" overflow="hidden">
              <Flex align="center" gap={3} p={4}>
                <Flex w="40px" h="40px" borderRadius={12} flexShrink={0}
                  bg={a.is_correct ? "green.50" : "red.50"}
                  align="center" justify="center" fontSize="20px">
                  {a.is_correct ? "✅" : "❌"}
                </Flex>
                <Box flex={1}>
                  <Text fontSize="sm" color="gray.700" fontWeight="medium" mb={1}>
                    {i + 1}. {a.question_content.stem}
                  </Text>
                  <Flex gap={3} fontSize="xs" color="gray.400" flexWrap="wrap">
                    <Text>你的答案：<Text as="span" color={a.is_correct ? "green.500" : "red.500"} fontWeight="bold">{a.child_answer}</Text></Text>
                    {!a.is_correct && (
                      <Text>正确答案：<Text as="span" color="green.500" fontWeight="bold">{a.correct_answer}</Text></Text>
                    )}
                    <Text>{(a.time_spent_ms / 1000).toFixed(1)}s</Text>
                    {a.combo_count > 0 && <Badge colorPalette="orange" borderRadius={6}>连击 {a.combo_count}</Badge>}
                  </Flex>
                </Box>
                <Text fontSize="sm" fontWeight="bold" color={a.is_correct ? "green.500" : "gray.300"}>
                  {a.is_correct ? `+${a.points}` : "0"}
                </Text>
              </Flex>
            </Box>
          ))}
        </VStack>

        <Flex justify="center">
          <Button size="lg" borderRadius={16} bg="linear-gradient(135deg, #667eea, #764ba2)" color="white"
            onClick={() => navigate({ to: "/exams" })}>
            返回考试列表
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/exams/report/$sessionId")({
  component: ReportPage,
})
