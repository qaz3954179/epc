import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  Spinner,
  Center,
  Grid
} from '@chakra-ui/react'
import { FaBox, FaTruck, FaCheckCircle, FaBan } from 'react-icons/fa'
import { redemptionService } from '@/client/services'
import type { PrizeRedemption, RedemptionStatus } from '@/client/types'

export const Route = createFileRoute('/redemptions/')({
  component: RedemptionsPage,
})

const statusConfig: Record<RedemptionStatus, { label: string; colorPalette: string; icon: any }> = {
  pending: { label: '待处理', colorPalette: 'yellow', icon: FaBox },
  processing: { label: '处理中', colorPalette: 'blue', icon: FaTruck },
  completed: { label: '已完成', colorPalette: 'green', icon: FaCheckCircle },
  cancelled: { label: '已取消', colorPalette: 'gray', icon: FaBan },
  refunded: { label: '已退款', colorPalette: 'red', icon: FaBan }
}

function RedemptionsPage() {
  const [filter, setFilter] = useState<RedemptionStatus | 'all'>('all')
  const [selectedRedemption, setSelectedRedemption] = useState<PrizeRedemption | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['redemptions', filter],
    queryFn: () => redemptionService.list({
      status: filter === 'all' ? undefined : filter
    })
  })

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个兑换吗？学习币将退回到您的账户。')) return

    try {
      await redemptionService.cancel(id)
      alert('取消成功！💰')
      queryClient.invalidateQueries({ queryKey: ['redemptions'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    } catch (error: any) {
      alert(error.response?.data?.detail || '取消失败')
    }
  }

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

  const redemptions = data?.data.data || []

  return (
    <Box>
      <VStack align="stretch" gap={6} mb={8}>
        <VStack align="start" gap={1}>
          <Heading size="2xl" color="purple.600">
            <HStack>
              <FaBox />
              <Text>我的兑换</Text>
            </HStack>
          </Heading>
          <Text color="gray.600" fontSize="lg">查看您的兑换记录和物流信息</Text>
        </VStack>

        {/* 状态筛选 */}
        <HStack gap={2} flexWrap="wrap">
          <Button
            onClick={() => setFilter('all')}
            colorPalette={filter === 'all' ? 'blue' : 'gray'}
            variant={filter === 'all' ? 'solid' : 'outline'}
          >
            全部
          </Button>
          {Object.entries(statusConfig).map(([status, { label }]) => (
            <Button
              key={status}
              onClick={() => setFilter(status as RedemptionStatus)}
              colorPalette={filter === status ? 'blue' : 'gray'}
              variant={filter === status ? 'solid' : 'outline'}
            >
              {label}
            </Button>
          ))}
        </HStack>
      </VStack>

      {/* 兑换列表 */}
      <VStack align="stretch" gap={4}>
        {redemptions.map(redemption => {
          const StatusIcon = statusConfig[redemption.status].icon
          return (
            <Card.Root key={redemption.id}>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Heading size="lg">{redemption.prize_name}</Heading>
                      <Text fontSize="sm" color="gray.500">
                        兑换时间：{formatDate(redemption.redeemed_at)}
                      </Text>
                    </VStack>
                    <Badge colorPalette={statusConfig[redemption.status].colorPalette} size="lg">
                      <HStack gap={1}>
                        <StatusIcon />
                        <Text>{statusConfig[redemption.status].label}</Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">奖品类型</Text>
                      <Text fontWeight="medium">
                        {redemption.prize_type === 'physical' ? '🎁 实物' : '💎 虚拟'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">消耗学习币</Text>
                      <Text fontWeight="bold" color="orange.500" fontSize="lg">
                        {redemption.coins_spent}
                      </Text>
                    </Box>
                  </Grid>

                  {redemption.prize_type === 'physical' && redemption.recipient_name && (
                    <Card.Root bg="gray.50">
                      <Card.Body>
                        <VStack align="start" gap={2}>
                          <Text fontWeight="medium" color="gray.700">📍 收货信息</Text>
                          <Text fontSize="sm" color="gray.600">
                            {redemption.recipient_name} {redemption.recipient_phone}
                          </Text>
                          <Text fontSize="sm" color="gray.600">{redemption.recipient_address}</Text>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}

                  {redemption.tracking_number && (
                    <Card.Root bg="blue.50">
                      <Card.Body>
                        <VStack align="start" gap={2}>
                          <Text fontWeight="medium" color="blue.700">🚚 物流信息</Text>
                          <Text fontSize="sm" color="gray.600">
                            快递公司：{redemption.shipping_company}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            快递单号：{redemption.tracking_number}
                          </Text>
                          {redemption.shipped_at && (
                            <Text fontSize="sm" color="gray.600">
                              发货时间：{formatDate(redemption.shipped_at)}
                            </Text>
                          )}
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}

                  {redemption.user_note && (
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        💬 备注：{redemption.user_note}
                      </Text>
                    </Box>
                  )}

                  <HStack gap={3}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRedemption(redemption)}
                    >
                      查看详情
                    </Button>
                    {redemption.status === 'pending' && (
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => handleCancel(redemption.id)}
                      >
                        取消兑换
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          )
        })}
      </VStack>

      {redemptions.length === 0 && (
        <Center h="300px">
          <VStack>
            <Text fontSize="xl" color="gray.400">暂无兑换记录</Text>
            <Text fontSize="sm" color="gray.400">快去商城兑换心仪的奖品吧！</Text>
          </VStack>
        </Center>
      )}

      {/* 详情弹窗 */}
      {selectedRedemption && (
        <DialogRoot open={!!selectedRedemption} onOpenChange={() => setSelectedRedemption(null)}>
          <DialogContent maxW="2xl">
            <DialogHeader>
              <DialogTitle>兑换详情</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Card.Root bg="gray.50">
                  <Card.Body>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">订单ID</Text>
                        <Text fontSize="xs" fontFamily="mono" mt={1}>{selectedRedemption.id}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">状态</Text>
                        <Badge colorPalette={statusConfig[selectedRedemption.status].colorPalette} mt={1}>
                          {statusConfig[selectedRedemption.status].label}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">奖品名称</Text>
                        <Text fontWeight="medium" mt={1}>{selectedRedemption.prize_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">消耗学习币</Text>
                        <Text fontWeight="bold" color="orange.500" mt={1}>{selectedRedemption.coins_spent}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">兑换时间</Text>
                        <Text fontSize="sm" mt={1}>{formatDate(selectedRedemption.redeemed_at)}</Text>
                      </Box>
                      {selectedRedemption.completed_at && (
                        <Box>
                          <Text fontSize="sm" color="gray.600">完成时间</Text>
                          <Text fontSize="sm" mt={1}>{formatDate(selectedRedemption.completed_at)}</Text>
                        </Box>
                      )}
                      {selectedRedemption.cancelled_at && (
                        <Box>
                          <Text fontSize="sm" color="gray.600">取消时间</Text>
                          <Text fontSize="sm" mt={1}>{formatDate(selectedRedemption.cancelled_at)}</Text>
                        </Box>
                      )}
                    </Grid>
                  </Card.Body>
                </Card.Root>

                {selectedRedemption.admin_note && (
                  <Card.Root bg="yellow.50">
                    <Card.Body>
                      <Text fontWeight="medium" color="gray.700" mb={1}>📝 管理员备注</Text>
                      <Text fontSize="sm" color="gray.600">{selectedRedemption.admin_note}</Text>
                    </Card.Body>
                  </Card.Root>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setSelectedRedemption(null)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      )}
    </Box>
  )
}
