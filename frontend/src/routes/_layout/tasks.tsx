import { ItemsService } from "@/client"
import type { ItemPublic } from "@/client"
import AddTask from "@/components/Tasks/AddTask"
import PendingItems from "@/components/Pending/PendingItems"
import { InputGroup } from "@/components/ui/input-group"
import {
  Badge,
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
    <Flex bg="white" p={4} pb={8} borderRadius={16} gap={4} marginBottom={6} flexWrap="wrap">
      <InputGroup flex="1" startElement={<AiOutlineSearch />} minW="200px">
        <Input
          placeholder="搜索任务名称、规则..."
          borderRadius={16}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>
      <Select.Root
        collection={categoryCollection}
        flex={0}
        flexBasis={180}
        onValueChange={({ value }) => onCategoryChange(value[0] || "")}
      >
        <Select.Control>
          <Select.Trigger borderRadius={16}>
            <Select.ValueText placeholder="请选择任务分类" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
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
        onValueChange={({ value }) => onTaskTypeChange(value[0] || "")}
      >
        <Select.Control>
          <Select.Trigger borderRadius={16}>
            <Select.ValueText placeholder="请选择任务类型" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
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
      <Flex
        bg="white"
        borderRadius={16}
        p={10}
        justifyContent="center"
        alignItems="center"
      >
        <Text color="gray.400">暂无任务数据</Text>
      </Flex>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }} borderRadius={16}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>任务名称</Table.ColumnHeader>
            <Table.ColumnHeader>分类</Table.ColumnHeader>
            <Table.ColumnHeader>任务类型</Table.ColumnHeader>
            <Table.ColumnHeader>周期完成次数</Table.ColumnHeader>
            <Table.ColumnHeader>描述</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredItems.map((item) => (
            <Table.Row
              key={item.id}
              opacity={isPlaceholderData ? 0.5 : 1}
            >
              <Table.Cell truncate maxW="200px" fontWeight="medium">
                {item.title}
              </Table.Cell>
              <Table.Cell>
                {item.category ? (
                  <Badge colorPalette={CATEGORY_COLOR[item.category] || "gray"}>
                    {CATEGORY_MAP[item.category] || item.category}
                  </Badge>
                ) : (
                  <Text color="gray.400">-</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                {item.task_type ? (
                  <Badge variant="outline">
                    {TASK_TYPE_MAP[item.task_type] || item.task_type}
                  </Badge>
                ) : (
                  <Text color="gray.400">-</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Text>{item.target_count ?? 1} 次</Text>
              </Table.Cell>
              <Table.Cell
                color={!item.description ? "gray" : "inherit"}
                truncate
                maxW="200px"
              >
                {item.description || "-"}
              </Table.Cell>
              <Table.Cell>
                <AddTask item={item}>
                  <Flex>编辑</Flex>
                </AddTask>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
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
      <Heading size="lg">
        <Flex justifyContent="space-between" alignItems="center">
          任务管理
          <AddTask />
        </Flex>
      </Heading>
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
