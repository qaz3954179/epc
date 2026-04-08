import { ItemsService } from "@/client"
import type { ItemPublic } from "@/client"
import AddTask from "@/components/Tasks/AddTask"
import PendingItems from "@/components/Pending/PendingItems"
import { InputGroup } from "@/components/ui/input-group"
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Input,
  Select,
  Portal,
  Table,
  Text,
  createListCollection,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AiOutlineSearch } from "react-icons/ai"
import { FiInbox } from "react-icons/fi"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { useMemo, useState } from "react"
import { z } from "zod"

const PER_PAGE = 5

const tasksSearchSchema = z.object({
  page: z.number().catch(1),
})

const CATEGORY_MAP: Record<string, string> = {
  daily: "日常任务",
  exam: "模拟考试",
  game: "互动游戏",
  pe: "体能项目",
}

const TASK_TYPE_MAP: Record<string, string> = {
  daily: "每日任务",
  weekly: "每周任务",
}

const CATEGORY_COLOR: Record<string, string> = {
  daily: "blue",
  exam: "orange",
  game: "purple",
  pe: "green",
}

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ItemsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

const categoryCollection = createListCollection({
  items: [
    { label: "全部分类", value: "" },
    { label: "日常任务", value: "daily" },
    { label: "模拟考试", value: "exam" },
    { label: "互动游戏", value: "game" },
    { label: "体能项目", value: "pe" },
  ],
})

const taskTypeCollection = createListCollection({
  items: [
    { label: "全部类型", value: "" },
    { label: "每日任务", value: "daily" },
    { label: "每周任务", value: "weekly" },
  ],
})

const SearchBox = ({
  onSearchChange,
  onCategoryChange,
  onTaskTypeChange,
}: {
  onSearchChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onTaskTypeChange: (v: string) => void
}) => {
  return (
    <Box 
      bg="white" 
      p={6} 
      borderRadius={20} 
      shadow="sm"
      marginBottom={6}
    >
      <Flex gap={4} flexWrap="wrap">
        <InputGroup flex="1" startElement={<AiOutlineSearch />} minW="200px">
          <Input
            placeholder="搜索任务名称、规则..."
            borderRadius={12}
            size="lg"
            _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
        <Select.Root
          collection={categoryCollection}
          flex={0}
          flexBasis={180}
          size="lg"
          onValueChange={({ value }) => onCategoryChange(value[0] || "")}
        >
          <Select.Control>
            <Select.Trigger borderRadius={12}>
              <Select.ValueText placeholder="任务分类" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content borderRadius={12}>
                {categoryCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <Select.Root
          collection={taskTypeCollection}
          flex={0}
          flexBasis={160}
          size="lg"
          onValueChange={({ value }) => onTaskTypeChange(value[0] || "")}
        >
          <Select.Control>
            <Select.Trigger borderRadius={12}>
              <Select.ValueText placeholder="任务类型" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content borderRadius={12}>
                {taskTypeCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Flex>
    </Box>
  )
}

const ItemsTable = ({
  searchText,
  filterCategory,
  filterTaskType,
}: {
  searchText: string
  filterCategory: string
  filterTaskType: string
}) => {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })
  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const items = data?.data.slice(0, PER_PAGE) ?? []
  const filteredItems = useMemo(() => {
    let result: ItemPublic[] = items
    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      )
    }
    if (filterCategory) {
      result = result.filter((item) => item.category === filterCategory)
    }
    if (filterTaskType) {
      result = result.filter((item) => item.task_type === filterTaskType)
    }
    return result
  }, [items, searchText, filterCategory, filterTaskType])

  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (filteredItems.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius={20}
        p={16}
        shadow="sm"
      >
        <Flex
          direction="column"
          alignItems="center"
          gap={4}
        >
          <Box
            fontSize="5xl"
            color="gray.300"
          >
            <FiInbox />
          </Box>
          <Text fontSize="lg" color="gray.500" fontWeight="medium">
            {searchText || filterCategory || filterTaskType ? "没有找到匹配的任务" : "还没有任务哦"}
          </Text>
          <Text fontSize="sm" color="gray.400">
            {searchText || filterCategory || filterTaskType ? "试试调整筛选条件" : "点击右上角按钮创建第一个任务吧！"}
          </Text>
        </Flex>
      </Box>
    )
  }

  return (
    <>
      <Box bg="white" borderRadius={20} shadow="sm" overflow="hidden">
        <Table.Root size={{ base: "sm", md: "md" }}>
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">任务名称</Table.ColumnHeader>
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">分类</Table.ColumnHeader>
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">任务类型</Table.ColumnHeader>
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">周期完成次数</Table.ColumnHeader>
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">描述</Table.ColumnHeader>
              <Table.ColumnHeader fontWeight="semibold" color="gray.600">操作</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredItems.map((item) => (
              <Table.Row
                key={item.id}
                opacity={isPlaceholderData ? 0.5 : 1}
                _hover={{ bg: "blue.50", transition: "background 0.15s" }}
              >
                <Table.Cell truncate maxW="200px" fontWeight="medium" color="gray.800">
                  {item.title}
                </Table.Cell>
                <Table.Cell>
                  {item.category ? (
                    <Badge colorPalette={CATEGORY_COLOR[item.category] || "gray"} borderRadius={8} px={2}>
                      {CATEGORY_MAP[item.category] || item.category}
                    </Badge>
                  ) : (
                    <Text color="gray.300">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {item.task_type ? (
                    <Badge variant="outline" borderRadius={8} px={2}>
                      {TASK_TYPE_MAP[item.task_type] || item.task_type}
                    </Badge>
                  ) : (
                    <Text color="gray.300">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="yellow" variant="subtle" borderRadius={8}>
                    {item.target_count ?? 1} 次
                  </Badge>
                </Table.Cell>
                <Table.Cell color={!item.description ? "gray.300" : "gray.600"} truncate maxW="200px">
                  {item.description || "—"}
                </Table.Cell>
                <Table.Cell>
                  <AddTask item={item}>
                    <Box
                      as="span"
                      color="blue.500"
                      fontWeight="medium"
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ color: "blue.700" }}
                    >
                      编辑
                    </Box>
                  </AddTask>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

const Tasks = () => {
  const [searchText, setSearchText] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterTaskType, setFilterTaskType] = useState("")

  return (
    <Container maxW="full">
      <Box mb={6}>
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Heading size="2xl" color="gray.800" fontWeight="bold">
            任务管理
          </Heading>
          <AddTask />
        </Flex>
        <Text color="gray.500" fontSize="md">
          创建和管理学习任务，完成任务赚取学习币 🎯
        </Text>
      </Box>
      <SearchBox
        onSearchChange={setSearchText}
        onCategoryChange={setFilterCategory}
        onTaskTypeChange={setFilterTaskType}
      />
      <ItemsTable
        searchText={searchText}
        filterCategory={filterCategory}
        filterTaskType={filterTaskType}
      />
    </Container>
  )
}

export const Route = createFileRoute("/_layout/tasks")({
  component: Tasks,
  validateSearch: (search) => tasksSearchSchema.parse(search),
})
