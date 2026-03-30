
import { ItemsService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import { InputGroup } from "@/components/ui/input-group"
import {
    Button,
    Container,
    Flex,
    Heading,
    Input,
    Select,
    Portal,
    Table,
    createListCollection
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai'
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
    return {
        queryFn: () =>
            ItemsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
        queryKey: ["items", { page }],
    }
}

const SearchBox = () => {
    const collection = createListCollection({
        items: [
            {
                label: '日常任务',
                value: 'daily'
            },
            {
                label: '模拟考试',
                value: 'exam'
            },
            {
                label: '互动游戏',
                value: 'game'
            },
            {
                labe: '体能项目',
                value: 'pe'
            }
        ]
    })
    return (
        <Flex bg="white" p={4} pb={8} borderRadius={16} gap={4} marginBottom={6}>
            <InputGroup flex="1" startElement={<AiOutlineSearch />} >
                <Input placeholder="搜索任务名称、规则..." borderRadius={16} />
            </InputGroup>
            <Select.Root collection={collection} flex={0} flexBasis={180}>
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
                            {collection.items.map((item) => (
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

const ItemsTable = () => {
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
    const count = data?.count ?? 0

    if (isLoading) {
        return <PendingItems />
    }
    return (
        <>
            <Table.Root size={{ base: "sm", md: "md" }} borderRadius={16}>
                <Table.Body>
                    {items?.map((item) => (
                        <Table.Row key={item.id} opacity={isPlaceholderData ? 0.5 : 1}>
                            <Table.Cell truncate maxW="sm">
                                {item.id}
                            </Table.Cell>
                            <Table.Cell truncate maxW="sm">
                                {item.title}
                            </Table.Cell>
                            <Table.Cell
                                color={!item.description ? "gray" : "inherit"}
                                truncate
                                maxW="30%"
                            >
                                {item.description || "N/A"}
                            </Table.Cell>
                            <Table.Cell>
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
    return (
        <Container maxW="full">
            <Heading size="lg">
                <Flex justifyContent="space-between">
                    任务管理
                    <Button bg="primary" size={'sm'}><AiOutlinePlus /> 新建任务</Button>
                </Flex>
            </Heading>
            <SearchBox />
            {/* <AddItem /> */}
            <ItemsTable />
        </Container>
    )
}

export const Route = createFileRoute("/_layout/tasks")({
    component: Tasks,
    //   validateSearch: (search) => itemsSearchSchema.parse(search),
})

