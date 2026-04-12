import {
  Badge,
  Box,
  Button,
  Container,
  createListCollection,
  Flex,
  Grid,
  Heading,
  Input,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiEdit2, FiTrash2, FiPlus, FiAward } from "react-icons/fi"

import { achievementService, type Achievement } from "@/client/achievementService"
import RouteGuard from "@/components/Common/RouteGuard"
import PendingItems from "@/components/Pending/PendingItems"
import {
  DialogActionTrigger,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toaster } from "@/components/ui/toaster"
import { Field } from "@/components/ui/field"
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"

// ── 成就表单 ──────────────────────────────────────────
interface AchievementFormData {
  name: string
  description: string
  icon: string
  reveal_message: string
  category: "hidden" | "milestone"
  condition_type: "streak" | "count" | "rate" | "composite"
  condition_config: string // JSON string
  coins_bonus: number
  is_active: boolean
}

const emptyForm: AchievementFormData = {
  name: "",
  description: "",
  icon: "🏆",
  reveal_message: "",
  category: "hidden",
  condition_type: "count",
  condition_config: "{}",
  coins_bonus: 0,
  is_active: true,
}

const AchievementFormDialog = ({
  achievement,
  onSuccess,
}: {
  achievement?: Achievement
  onSuccess: () => void
}) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AchievementFormData>(
    achievement
      ? {
          name: achievement.name,
          description: achievement.description || "",
          icon: achievement.icon,
          reveal_message: achievement.reveal_message,
          category: achievement.category,
          condition_type: achievement.condition_type,
          condition_config: JSON.stringify(achievement.condition_config, null, 2),
          coins_bonus: achievement.coins_bonus,
          is_active: achievement.is_active,
        }
      : emptyForm,
  )

  const createMutation = useMutation({
    mutationFn: (data: Partial<Achievement>) => achievementService.create(data),
    onSuccess: () => {
      toaster.create({ title: "成就创建成功", type: "success" })
      setOpen(false)
      setForm(emptyForm)
      onSuccess()
    },
    onError: () => {
      toaster.create({ title: "创建失败", type: "error" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Achievement>) =>
      achievementService.update(achievement!.id, data),
    onSuccess: () => {
      toaster.create({ title: "成就更新成功", type: "success" })
      setOpen(false)
      onSuccess()
    },
    onError: () => {
      toaster.create({ title: "更新失败", type: "error" })
    },
  })

  const handleSubmit = () => {
    try {
      const config = JSON.parse(form.condition_config)
      const data = {
        ...form,
        condition_config: config,
      }
      if (achievement) {
        updateMutation.mutate(data)
      } else {
        createMutation.mutate(data)
      }
    } catch (e) {
      toaster.create({ title: "条件配置 JSON 格式错误", type: "error" })
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)} size="lg">
      <DialogTrigger asChild>
        {achievement ? (
          <Button size="sm" variant="ghost" colorScheme="blue">
            <FiEdit2 />
          </Button>
        ) : (
          <Button colorScheme="orange" size="sm">
            <FiPlus /> 新建成就
          </Button>
        )}
      </DialogTrigger>
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{achievement ? "编辑成就" : "新建成就"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Grid gap={4}>
            <Field label="名称">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="成就名称"
              />
            </Field>
            <Field label="图标 Emoji">
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🏆"
              />
            </Field>
            <Field label="描述（里程碑成就可见）">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="达成条件说明"
                rows={2}
              />
            </Field>
            <Field label="揭晓文案（解锁后显示）">
              <Textarea
                value={form.reveal_message}
                onChange={(e) => setForm({ ...form, reveal_message: e.target.value })}
                placeholder="解锁时的惊喜文案"
                rows={2}
              />
            </Field>
            <Field label="类型">
              <SelectRoot
                collection={createListCollection({ items: [
                  { label: "隐藏成就", value: "hidden" },
                  { label: "里程碑成就", value: "milestone" },
                ] })}
                value={[form.category]}
                onValueChange={(e) => setForm({ ...form, category: e.value[0] as any })}
              >
                <SelectTrigger>
                  <SelectValueText placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem item={{ label: "隐藏成就", value: "hidden" }}>隐藏成就</SelectItem>
                  <SelectItem item={{ label: "里程碑成就", value: "milestone" }}>里程碑成就</SelectItem>
                </SelectContent>
              </SelectRoot>
            </Field>
            <Field label="条件类型">
              <SelectRoot
                collection={createListCollection({ items: [
                  { label: "连续天数 (streak)", value: "streak" },
                  { label: "累计次数 (count)", value: "count" },
                  { label: "比率 (rate)", value: "rate" },
                  { label: "复合条件 (composite)", value: "composite" },
                ] })}
                value={[form.condition_type]}
                onValueChange={(e) => setForm({ ...form, condition_type: e.value[0] as any })}
              >
                <SelectTrigger>
                  <SelectValueText placeholder="选择条件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem item={{ label: "连续天数 (streak)", value: "streak" }}>连续天数 (streak)</SelectItem>
                  <SelectItem item={{ label: "累计次数 (count)", value: "count" }}>累计次数 (count)</SelectItem>
                  <SelectItem item={{ label: "比率 (rate)", value: "rate" }}>比率 (rate)</SelectItem>
                  <SelectItem item={{ label: "复合条件 (composite)", value: "composite" }}>复合条件 (composite)</SelectItem>
                </SelectContent>
              </SelectRoot>
            </Field>
            <Field label="条件配置 (JSON)">
              <Textarea
                value={form.condition_config}
                onChange={(e) => setForm({ ...form, condition_config: e.target.value })}
                placeholder='{"target": 100}'
                rows={4}
                fontFamily="mono"
                fontSize="sm"
              />
            </Field>
            <Field label="奖励学习币">
              <Input
                type="number"
                value={form.coins_bonus}
                onChange={(e) => setForm({ ...form, coins_bonus: Number(e.target.value) })}
                min={0}
              />
            </Field>
            <Field label="状态">
              <SelectRoot
                collection={createListCollection({ items: [
                  { label: "启用", value: "true" },
                  { label: "禁用", value: "false" },
                ] })}
                value={[String(form.is_active)]}
                onValueChange={(e) => setForm({ ...form, is_active: e.value[0] === "true" })}
              >
                <SelectTrigger>
                  <SelectValueText placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem item={{ label: "启用", value: "true" }}>启用</SelectItem>
                  <SelectItem item={{ label: "禁用", value: "false" }}>禁用</SelectItem>
                </SelectContent>
              </SelectRoot>
            </Field>
          </Grid>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">取消</Button>
          </DialogActionTrigger>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {achievement ? "保存" : "创建"}
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// ── 全局统计 ──────────────────────────────────────────
const GlobalStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements", "stats"],
    queryFn: () => achievementService.getGlobalStats().then((r) => r.data),
  })

  if (isLoading) return <PendingItems />

  return (
    <Box bg="white" borderRadius={16} p={6} mb={6}>
      <Heading size="md" mb={4}>
        <FiAward style={{ display: "inline", marginRight: "8px" }} />
        全局解锁统计
      </Heading>
      <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
        {data?.map((stat) => (
          <Box
            key={stat.id}
            bg="gray.50"
            borderRadius={12}
            p={4}
            textAlign="center"
          >
            <Text fontSize="3xl" mb={2}>
              {stat.icon}
            </Text>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              {stat.name}
            </Text>
            <Badge colorScheme={stat.category === "hidden" ? "purple" : "blue"}>
              {stat.category === "hidden" ? "隐藏" : "里程碑"}
            </Badge>
            <Text fontSize="lg" fontWeight="bold" color="orange.500" mt={2}>
              {stat.unlock_count} 次解锁
            </Text>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

// ── 成就列表 ──────────────────────────────────────────
const AchievementsList = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["achievements", "list"],
    queryFn: () => achievementService.list().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => achievementService.delete(id),
    onSuccess: () => {
      toaster.create({ title: "成就已删除", type: "success" })
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
    },
    onError: () => {
      toaster.create({ title: "删除失败", type: "error" })
    },
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["achievements"] })
  }

  if (isLoading) return <PendingItems />

  return (
    <Box bg="white" borderRadius={16} p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">成就定义列表</Heading>
        <AchievementFormDialog onSuccess={handleRefresh} />
      </Flex>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>图标</Table.ColumnHeader>
            <Table.ColumnHeader>名称</Table.ColumnHeader>
            <Table.ColumnHeader>类型</Table.ColumnHeader>
            <Table.ColumnHeader>条件</Table.ColumnHeader>
            <Table.ColumnHeader>奖励</Table.ColumnHeader>
            <Table.ColumnHeader>状态</Table.ColumnHeader>
            <Table.ColumnHeader>操作</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.data.map((achievement) => (
            <Table.Row key={achievement.id}>
              <Table.Cell fontSize="2xl">{achievement.icon}</Table.Cell>
              <Table.Cell>
                <Text fontWeight="bold">{achievement.name}</Text>
                <Text fontSize="xs" color="gray.500">
                  {achievement.reveal_message}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={achievement.category === "hidden" ? "purple" : "blue"}>
                  {achievement.category === "hidden" ? "隐藏" : "里程碑"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text fontSize="xs" fontFamily="mono">
                  {achievement.condition_type}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {achievement.coins_bonus > 0 ? (
                  <Text color="orange.500" fontWeight="bold">
                    +{achievement.coins_bonus} 🪙
                  </Text>
                ) : (
                  <Text color="gray.400">无</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={achievement.is_active ? "green" : "gray"}>
                  {achievement.is_active ? "启用" : "禁用"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <AchievementFormDialog
                    achievement={achievement}
                    onSuccess={handleRefresh}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => {
                      if (confirm(`确定删除成就「${achievement.name}」吗？`)) {
                        deleteMutation.mutate(achievement.id)
                      }
                    }}
                  >
                    <FiTrash2 />
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}

// ── 主页面 ────────────────────────────────────────────
function AdminAchievements() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <Container maxW="full" pb={8}>
        <Heading size="lg" mb={6}>
          🏆 成就管理
        </Heading>
        <GlobalStats />
        <AchievementsList />
      </Container>
    </RouteGuard>
  )
}

export const Route = createFileRoute("/_layout/admin/achievements")({
  component: AdminAchievements,
})
