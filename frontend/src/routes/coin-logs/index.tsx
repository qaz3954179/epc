import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Box,
  Card,
  Text,
  Button,
  Badge,
  Heading,
  VStack,
  HStack,
  Table,
  Spinner,
  Center
} from '@chakra-ui/react'
import { FaCoins, FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { coinLogService } from '@/client/services'
import type { TransactionType } from '@/client/types'

export const Route = createFileRoute('/coin-logs/')({
  component: CoinLogsPage,
})

const transactionTypeConfig: Record<TransactionType, { label: string; colorPalette: string }> = {
  task_completion: { label: '完成任务', colorPalette: 'green' },
  prize_redemption: { label: '兑换奖品', colorPalette: 'red' },
  admin_adjustment: { label: '管理员调整', colorPalette: 'blue' },
  refund: { label: '退款', colorPalette: 'green' },
  referral_bonus: { label: '推荐奖励', colorPalette: 'purple' }
}

function CoinLogsPage() {
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['coin-logs', filter],
    queryFn: () => coinLogService.list({
      transaction_type: filter === 'all' ? undefined : filter
    })
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    )
  }

  const logs = data?.data.data || []

  return (
    <Box>
      <VStack align="stretch" gap={6} mb={8}>
        <VStack align="start" gap={1}>
          <Heading size="2xl" color="purple.600">
            <HStack>
              <FaCoins />
              <Text>学习币明细</Text>
            </HStack>
          </Heading>
          <Text color="gray.600" fontSize="lg">查看您的学习币收支记录</Text>
        </VStack>

        {/* 类型筛选 */}
        <HStack gap={2} flexWrap="wrap">
          <Button
            onClick={() => setFilter('all')}
            colorPalette={filter === 'all' ? 'blue' : 'gray'}
            variant={filter === 'all' ? 'solid' : 'outline'}
          >
            全部
          </Button>
          {Object.entries(transactionTypeConfig).map(([type, { label }]) => (
            <Button
              key={type}
              onClick={() => setFilter(type as TransactionType)}
              colorPalette={filter === type ? 'blue' : 'gray'}
              variant={filter === type ? 'solid' : 'outline'}
            >
              {label}
            </Button>
          ))}
        </HStack>
      </VStack>

      {/* 明细表格 */}
      <Card.Root>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>时间</Table.ColumnHeader>
              <Table.ColumnHeader>类型</Table.ColumnHeader>
              <Table.ColumnHeader>说明</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">变动</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">余额</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {logs.map(log => (
              <Table.Row key={log.id}>
                <Table.Cell>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(log.created_at)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={transactionTypeConfig[log.transaction_type].colorPalette}>
                    {transactionTypeConfig[log.transaction_type].label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text>{log.description}</Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <HStack justify="flex-end" gap={1}>
                    {log.amount > 0 ? (
                      <FaArrowUp color="green" />
                    ) : (
                      <FaArrowDown color="red" />
                    )}
                    <Text
                      fontWeight="bold"
                      color={log.amount > 0 ? 'green.600' : 'red.600'}
                    >
                      {log.amount > 0 ? '+' : ''}{log.amount}
                    </Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="medium">{log.balance_after}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card.Root>

      {logs.length === 0 && (
        <Center h="300px">
          <VStack>
            <Text fontSize="xl" color="gray.400">暂无明细记录</Text>
            <Text fontSize="sm" color="gray.400">完成任务或兑换奖品后会显示记录</Text>
          </VStack>
        </Center>
      )}
    </Box>
  )
}
