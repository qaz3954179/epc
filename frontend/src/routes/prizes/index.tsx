import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  Image,
  Text,
  Button,
  Badge,
  Heading,
  VStack,
  HStack,
  useDisclosure,
  Dialog,
  Textarea,
  Select,
  Spinner,
  Center
} from '@chakra-ui/react'
import { FaGift, FaCoins } from 'react-icons/fa'
import { prizeService, redemptionService, addressService, userService } from '@/client/services'
import type { Prize, ShippingAddress } from '@/client/types'

export const Route = createFileRoute('/prizes/')({
  component: PrizeListPage,
})

function PrizeListPage() {
  const { data: prizesData, isLoading: prizesLoading } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => prizeService.list({ is_active: true })
  })

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => userService.me()
  })

  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [userNote, setUserNote] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const { open, onOpen, onClose } = useDisclosure()

  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.list(),
    enabled: open && selectedPrize?.prize_type === 'physical'
  })

  const handleRedeemClick = (prize: Prize) => {
    setSelectedPrize(prize)
    onOpen()
  }

  const handleConfirmRedeem = async () => {
    if (!selectedPrize) return

    if (selectedPrize.prize_type === 'physical' && !selectedAddressId) {
      alert('请选择收货地址')
      return
    }

    if (!userData?.data || userData.data.learning_coins < selectedPrize.coins_required) {
      alert('学习币不足')
      return
    }

    setRedeeming(true)
    try {
      await redemptionService.create({
        prize_id: selectedPrize.id,
        shipping_address_id: selectedPrize.prize_type === 'physical' ? selectedAddressId : undefined,
        user_note: userNote || undefined
      })
      alert('兑换成功！🎉')
      onClose()
      setUserNote('')
      setSelectedAddressId('')
      refetchUser()
    } catch (error: any) {
      alert(error.response?.data?.detail || '兑换失败')
    } finally {
      setRedeeming(false)
    }
  }

  if (prizesLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    )
  }

  const prizes = prizesData?.data.data || []
  const user = userData?.data
  const addresses = addressesData?.data.data || []

  return (
    <Box>
      <VStack align="stretch" gap={6} mb={8}>
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="2xl" color="purple.600">
              <HStack>
                <FaGift />
                <Text>奖品商城</Text>
              </HStack>
            </Heading>
            <Text color="gray.600" fontSize="lg">用学习币兑换心仪的奖品吧！</Text>
          </VStack>
          {user && (
            <Card.Root bg="gradient-to-r from-yellow.400 to-orange.400" color="white" p={4}>
              <HStack gap={2}>
                <FaCoins size={24} />
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" opacity={0.9}>我的学习币</Text>
                  <Text fontSize="2xl" fontWeight="bold">{user.learning_coins}</Text>
                </VStack>
              </HStack>
            </Card.Root>
          )}
        </HStack>
      </VStack>

      <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
        {prizes.map(prize => (
          <Card.Root key={prize.id} overflow="hidden" _hover={{ shadow: 'lg', transform: 'translateY(-4px)' }} transition="all 0.2s">
            {prize.image_url && (
              <Image src={prize.image_url} alt={prize.name} h="200px" objectFit="cover" />
            )}
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <Heading size="md">{prize.name}</Heading>
                  <Badge colorPalette={prize.prize_type === 'physical' ? 'blue' : 'purple'}>
                    {prize.prize_type === 'physical' ? '实物' : '虚拟'}
                  </Badge>
                </HStack>
                {prize.description && (
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>{prize.description}</Text>
                )}
                <HStack justify="space-between">
                  <HStack>
                    <FaCoins color="orange" />
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">{prize.coins_required}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">库存: {prize.stock_quantity}</Text>
                </HStack>
              </VStack>
            </Card.Body>
            <Card.Footer>
              <Button
                w="full"
                colorPalette="blue"
                size="lg"
                onClick={() => handleRedeemClick(prize)}
                disabled={prize.stock_quantity === 0 || !user || user.learning_coins < prize.coins_required}
              >
                {prize.stock_quantity === 0 ? '已售罄' : 
                 !user || user.learning_coins < prize.coins_required ? '学习币不足' : '立即兑换'}
              </Button>
            </Card.Footer>
          </Card.Root>
        ))}
      </Grid>

      {prizes.length === 0 && (
        <Center h="300px">
          <VStack>
            <Text fontSize="xl" color="gray.400">暂无可兑换的奖品</Text>
            <Text fontSize="sm" color="gray.400">敬请期待更多精彩奖品！</Text>
          </VStack>
        </Center>
      )}

      {/* 兑换确认弹窗 */}
      <Dialog.Root open={open} onOpenChange={onClose}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>确认兑换</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            {selectedPrize && (
              <VStack align="stretch" gap={4}>
                <Card.Root bg="gray.50">
                  <Card.Body>
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text color="gray.600">奖品名称：</Text>
                        <Text fontWeight="bold">{selectedPrize.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.600">所需学习币：</Text>
                        <HStack>
                          <FaCoins color="orange" />
                          <Text fontWeight="bold" color="orange.500">{selectedPrize.coins_required}</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {selectedPrize.prize_type === 'physical' && (
                  <Box>
                    <Text mb={2} fontWeight="medium">选择收货地址 <Text as="span" color="red.500">*</Text></Text>
                    {addresses.length === 0 ? (
                      <Text fontSize="sm" color="gray.500">
                        暂无收货地址，请先添加地址
                      </Text>
                    ) : (
                      <Select.Root value={selectedAddressId} onValueChange={(e) => setSelectedAddressId(e.value[0])}>
                        <Select.Trigger>
                          <Select.ValueText placeholder="请选择" />
                        </Select.Trigger>
                        <Select.Content>
                          {addresses.map(addr => (
                            <Select.Item key={addr.id} value={addr.id}>
                              {addr.recipient_name} {addr.recipient_phone} - {addr.province}{addr.city}{addr.district}{addr.detail_address}
                              {addr.is_default && ' (默认)'}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  </Box>
                )}

                <Box>
                  <Text mb={2} fontWeight="medium">备注（可选）</Text>
                  <Textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="有什么想说的吗？"
                    rows={3}
                  />
                </Box>
              </VStack>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <HStack w="full" gap={3}>
              <Button variant="outline" flex={1} onClick={onClose}>取消</Button>
              <Button
                colorPalette="blue"
                flex={1}
                onClick={handleConfirmRedeem}
                loading={redeeming}
                disabled={selectedPrize?.prize_type === 'physical' && !selectedAddressId}
              >
                确认兑换
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  )
}
