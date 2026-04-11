import {
  Box, Button, Container, Flex, Text, VStack, Badge, Input, Textarea,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi"
import useCustomToast from "@/hooks/useCustomToast"
import { examService } from "@/client/examService"
import type {
  ExamTemplate, ExamSubject, ExamDifficulty, ExamGameMode, QuestionType,
} from "@/client/examTypes"

const SUBJECT_OPTIONS: { value: ExamSubject; label: string; emoji: string }[] = [
  { value: "math", label: "数学", emoji: "🔢" },
  { value: "english", label: "英语", emoji: "🔤" },
  { value: "chinese", label: "语文", emoji: "📖" },
  { value: "science", label: "科学", emoji: "🔬" },
  { value: "other", label: "其他", emoji: "📝" },
]
const DIFFICULTY_OPTIONS: { value: ExamDifficulty; label: string }[] = [
  { value: "easy", label: "简单 🟢" },
  { value: "medium", label: "中等 🟡" },
  { value: "hard", label: "困难 🔴" },
]
const MODE_OPTIONS: { value: ExamGameMode; label: string; desc: string }[] = [
  { value: "classic", label: "📋 标准", desc: "按顺序答题，最后出分" },
  { value: "countdown", label: "⏱️ 倒计时", desc: "每题限时，超时跳过" },
  { value: "challenge", label: "🏰 闯关", desc: "答错3题游戏结束" },
  { value: "speed_run", label: "⚡ 极速", desc: "比拼总用时" },
]
const QTYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "choice", label: "选择题" },
  { value: "fill_blank", label: "填空题" },
  { value: "true_false", label: "判断题" },
  { value: "spelling", label: "拼写题" },
]

// ─── 创建模板表单 ─────────────────────────────────────────────────
function CreateTemplateForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [form, setForm] = useState({
    title: "", subject: "math" as ExamSubject, difficulty: "medium" as ExamDifficulty,
    question_count: 10, time_limit_seconds: null as number | null,
    game_mode: "classic" as ExamGameMode, source_type: "manual" as "manual" | "ai",
    coins_reward_rules: { "90": 20, "70": 10, "0": -5 },
  })

  const mutation = useMutation({
    mutationFn: () => examService.createTemplate(form),
    onSuccess: () => {
      showSuccessToast("模板创建成功！")
      queryClient.invalidateQueries({ queryKey: ["exam-templates"] })
      onClose()
    },
    onError: (err: any) => showErrorToast(err?.response?.data?.detail || "创建失败"),
  })

  return (
    <Box bg="white" borderRadius={20} p={6} boxShadow="lg" mb={5}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>📝 创建考试模板</Text>
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>考试名称</Text>
          <Input borderRadius={12} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：三年级数学周测" />
        </Box>
        <Flex gap={3} flexWrap="wrap">
          <Box flex={1} minW="150px">
            <Text fontSize="sm" color="gray.500" mb={1}>科目</Text>
            <Flex gap={2} flexWrap="wrap">
              {SUBJECT_OPTIONS.map((s) => (
                <Button key={s.value} size="sm" borderRadius={10}
                  bg={form.subject === s.value ? "purple.500" : "gray.50"}
                  color={form.subject === s.value ? "white" : "gray.600"}
                  onClick={() => setForm({ ...form, subject: s.value })}>
                  {s.emoji} {s.label}
                </Button>
              ))}
            </Flex>
          </Box>
        </Flex>
        <Flex gap={3} flexWrap="wrap">
          <Box flex={1} minW="150px">
            <Text fontSize="sm" color="gray.500" mb={1}>难度</Text>
            <Flex gap={2}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <Button key={d.value} size="sm" borderRadius={10}
                  bg={form.difficulty === d.value ? "purple.500" : "gray.50"}
                  color={form.difficulty === d.value ? "white" : "gray.600"}
                  onClick={() => setForm({ ...form, difficulty: d.value })}>
                  {d.label}
                </Button>
              ))}
            </Flex>
          </Box>
          <Box minW="120px">
            <Text fontSize="sm" color="gray.500" mb={1}>题目数量</Text>
            <Input type="number" borderRadius={12} value={form.question_count}
              onChange={(e) => setForm({ ...form, question_count: parseInt(e.target.value) || 10 })} />
          </Box>
        </Flex>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>考试模式</Text>
          <Flex gap={2} flexWrap="wrap">
            {MODE_OPTIONS.map((m) => (
              <Button key={m.value} size="sm" borderRadius={10} px={4}
                bg={form.game_mode === m.value ? "purple.500" : "gray.50"}
                color={form.game_mode === m.value ? "white" : "gray.600"}
                onClick={() => setForm({ ...form, game_mode: m.value })}
                title={m.desc}>
                {m.label}
              </Button>
            ))}
          </Flex>
        </Box>
        {(form.game_mode === "countdown" || form.game_mode === "speed_run") && (
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>限时（秒）</Text>
            <Input type="number" borderRadius={12} value={form.time_limit_seconds ?? ""}
              onChange={(e) => setForm({ ...form, time_limit_seconds: parseInt(e.target.value) || null })}
              placeholder="例：30" />
          </Box>
        )}
        <Flex gap={3} justify="flex-end">
          <Button variant="outline" borderRadius={12} onClick={onClose}>取消</Button>
          <Button borderRadius={12} bg="linear-gradient(135deg, #667eea, #764ba2)" color="white"
            loading={mutation.isPending} onClick={() => mutation.mutate()}
            disabled={!form.title.trim()}>
            创建模板
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}

// ─── 添加题目表单 ─────────────────────────────────────────────────
function AddQuestionForm({ templateId, onClose }: { templateId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [form, setForm] = useState({
    question_type: "choice" as QuestionType,
    stem: "", options: ["", "", "", ""], answer: "",
    explanation: "", difficulty: "medium" as ExamDifficulty, points: 10,
  })

  const mutation = useMutation({
    mutationFn: () => examService.addQuestion(templateId, {
      template_id: templateId,
      question_type: form.question_type,
      content: {
        stem: form.stem,
        ...(form.question_type === "choice" ? { options: form.options.filter(Boolean) } : {}),
      },
      answer: form.answer,
      explanation: form.explanation || undefined,
      difficulty: form.difficulty,
      points: form.points,
    }),
    onSuccess: () => {
      showSuccessToast("题目添加成功！")
      queryClient.invalidateQueries({ queryKey: ["exam-questions", templateId] })
      setForm({ ...form, stem: "", options: ["", "", "", ""], answer: "", explanation: "" })
    },
    onError: (err: any) => showErrorToast(err?.response?.data?.detail || "添加失败"),
  })

  return (
    <Box bg="gray.50" borderRadius={16} p={5} mb={4}>
      <Text fontSize="md" fontWeight="bold" mb={3}>➕ 添加题目</Text>
      <VStack gap={3} align="stretch">
        <Flex gap={2}>
          {QTYPE_OPTIONS.map((t) => (
            <Button key={t.value} size="sm" borderRadius={10}
              bg={form.question_type === t.value ? "purple.500" : "white"}
              color={form.question_type === t.value ? "white" : "gray.600"}
              onClick={() => setForm({ ...form, question_type: t.value })}>
              {t.label}
            </Button>
          ))}
        </Flex>
        <Textarea borderRadius={12} value={form.stem} bg="white"
          onChange={(e) => setForm({ ...form, stem: e.target.value })} placeholder="题目内容" rows={2} />
        {form.question_type === "choice" && (
          <VStack gap={2} align="stretch">
            {form.options.map((opt, i) => (
              <Input key={i} borderRadius={12} bg="white" value={opt}
                onChange={(e) => {
                  const newOpts = [...form.options]
                  newOpts[i] = e.target.value
                  setForm({ ...form, options: newOpts })
                }}
                placeholder={`选项 ${String.fromCharCode(65 + i)}`} />
            ))}
          </VStack>
        )}
        <Flex gap={3}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.400" mb={1}>正确答案</Text>
            <Input borderRadius={12} bg="white" value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder={form.question_type === "choice" ? "输入正确选项内容" : "正确答案"} />
          </Box>
          <Box w="80px">
            <Text fontSize="xs" color="gray.400" mb={1}>分值</Text>
            <Input type="number" borderRadius={12} bg="white" value={form.points}
              onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} />
          </Box>
        </Flex>
        <Input borderRadius={12} bg="white" value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="解析（可选）" />
        <Flex gap={3} justify="flex-end">
          <Button size="sm" variant="outline" borderRadius={10} onClick={onClose}>收起</Button>
          <Button size="sm" borderRadius={10} bg="purple.500" color="white"
            loading={mutation.isPending} onClick={() => mutation.mutate()}
            disabled={!form.stem.trim() || !form.answer.trim()}>
            添加
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}

// ─── 模板卡片 ─────────────────────────────────────────────────────
function TemplateCard({ tpl }: { tpl: ExamTemplate }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [expanded, setExpanded] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)

  const { data: questionsData } = useQuery({
    queryKey: ["exam-questions", tpl.id],
    queryFn: () => examService.listQuestions(tpl.id),
    select: (res) => res.data,
    enabled: expanded,
  })

  const deleteMutation = useMutation({
    mutationFn: () => examService.deleteTemplate(tpl.id),
    onSuccess: () => {
      showSuccessToast("模板已删除")
      queryClient.invalidateQueries({ queryKey: ["exam-templates"] })
    },
    onError: (err: any) => showErrorToast(err?.response?.data?.detail || "删除失败"),
  })

  const deleteQMutation = useMutation({
    mutationFn: (qId: string) => examService.deleteQuestion(qId),
    onSuccess: () => {
      showSuccessToast("题目已删除")
      queryClient.invalidateQueries({ queryKey: ["exam-questions", tpl.id] })
    },
  })

  const subject = SUBJECT_OPTIONS.find((s) => s.value === tpl.subject)
  const mode = MODE_OPTIONS.find((m) => m.value === tpl.game_mode)
  const questions = questionsData?.data ?? []

  return (
    <Box borderRadius={20} overflow="hidden" boxShadow="lg" bg="white">
      <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={5}
        cursor="pointer" onClick={() => setExpanded(!expanded)}>
        <Flex align="center" gap={3}>
          <Box w="50px" h="50px" borderRadius={14} bg="whiteAlpha.300"
            display="flex" alignItems="center" justifyContent="center" fontSize="24px">
            {subject?.emoji || "📝"}
          </Box>
          <Box flex={1}>
            <Text fontWeight="bold" fontSize="lg" color="white">{tpl.title}</Text>
            <Flex gap={2} mt={1} flexWrap="wrap">
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {subject?.label}
              </Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {mode?.label}
              </Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {tpl.question_count} 题
              </Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius={8} px={2} fontSize="xs">
                {DIFFICULTY_OPTIONS.find((d) => d.value === tpl.difficulty)?.label}
              </Badge>
            </Flex>
          </Box>
          <Text color="whiteAlpha.700" fontSize="xl">{expanded ? "▲" : "▼"}</Text>
        </Flex>
      </Box>

      {expanded && (
        <Box p={5}>
          {/* 奖励规则 */}
          <Box mb={4} p={3} bg="purple.50" borderRadius={12}>
            <Text fontSize="sm" fontWeight="bold" color="purple.700" mb={1}>🪙 奖励规则</Text>
            <Flex gap={3} flexWrap="wrap">
              {Object.entries(tpl.coins_reward_rules || {})
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([threshold, coins]) => (
                  <Badge key={threshold} borderRadius={8} px={2} py={1}
                    bg={Number(coins) > 0 ? "green.100" : "red.100"}
                    color={Number(coins) > 0 ? "green.700" : "red.700"}>
                    ≥{threshold}分 → {Number(coins) > 0 ? "+" : ""}{coins}币
                  </Badge>
                ))}
            </Flex>
          </Box>

          {/* 题目列表 */}
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="md" fontWeight="bold" color="gray.600">
              题目列表 ({questions.length})
            </Text>
            <Flex gap={2}>
              <Button size="sm" borderRadius={10} bg="purple.500" color="white"
                onClick={() => setShowAddQ(!showAddQ)}>
                <FiPlus /> 添加题目
              </Button>
              <Button size="sm" borderRadius={10} variant="outline" colorPalette="red"
                loading={deleteMutation.isPending}
                onClick={() => { if (confirm("确定删除此模板？")) deleteMutation.mutate() }}>
                <FiTrash2 />
              </Button>
            </Flex>
          </Flex>

          {showAddQ && <AddQuestionForm templateId={tpl.id} onClose={() => setShowAddQ(false)} />}

          <VStack gap={2} align="stretch">
            {questions.length === 0 ? (
              <Text color="gray.300" textAlign="center" py={4}>暂无题目，点击上方添加</Text>
            ) : (
              questions.map((q, i) => (
                <Flex key={q.id} bg="gray.50" borderRadius={12} p={3} align="center" gap={3}>
                  <Text fontSize="sm" color="gray.400" fontWeight="bold" w="30px">{i + 1}</Text>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.700">{q.content.stem}</Text>
                    <Flex gap={2} mt={1}>
                      <Badge borderRadius={6} fontSize="xs">{QTYPE_OPTIONS.find((t) => t.value === q.question_type)?.label}</Badge>
                      <Badge borderRadius={6} fontSize="xs" colorPalette="green">答案: {q.answer}</Badge>
                      <Badge borderRadius={6} fontSize="xs">{q.points}分</Badge>
                    </Flex>
                  </Box>
                  <Button size="xs" variant="ghost" color="red.400"
                    onClick={() => deleteQMutation.mutate(q.id)}>
                    <FiTrash2 />
                  </Button>
                </Flex>
              ))
            )}
          </VStack>
        </Box>
      )}
    </Box>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────
function ParentExamsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["exam-templates"],
    queryFn: () => examService.listTemplates(),
    select: (res) => res.data,
  })

  const templates = data?.data ?? []

  return (
    <Box minH="100vh" bg="linear-gradient(180deg, #f0f0ff 0%, #fff5f5 100%)" py={6}>
      <Container maxW="800px" px={{ base: 4, md: 8 }}>
        <Box borderRadius={28} mb={6} overflow="hidden" boxShadow="xl"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={7}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xl" fontWeight="black" color="white" mb={1}>📝 考试管理</Text>
              <Text color="whiteAlpha.900" fontSize="lg">创建模板、录入题目、为宝贝安排考试</Text>
            </Box>
            <Button borderRadius={14} bg="whiteAlpha.300" color="white" size="lg"
              _hover={{ bg: "whiteAlpha.400" }} onClick={() => setShowCreate(!showCreate)}>
              <FiPlus /> 新建模板
            </Button>
          </Flex>
        </Box>

        {showCreate && <CreateTemplateForm onClose={() => setShowCreate(false)} />}

        {isLoading ? (
          <Text color="gray.400" textAlign="center" py={10}>加载中...</Text>
        ) : templates.length === 0 ? (
          <Flex bg="white" borderRadius={28} p={12} justify="center" align="center"
            direction="column" gap={3} boxShadow="md">
            <Text fontSize="5xl">📝</Text>
            <Text color="gray.500" fontSize="xl" fontWeight="bold">还没有考试模板</Text>
            <Text color="gray.300">点击上方「新建模板」开始创建</Text>
          </Flex>
        ) : (
          <VStack gap={5} align="stretch">
            {templates.map((tpl) => <TemplateCard key={tpl.id} tpl={tpl} />)}
          </VStack>
        )}
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/parent/exams")({
  component: ParentExamsPage,
})
