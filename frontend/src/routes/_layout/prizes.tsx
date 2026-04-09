import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { GrowthService, PrizesService } from "@/client"
import type { ApiError, PrizePublic } from "@/client"
import AddPrize from "@/components/Prizes/AddPrize"
import EditPrize from "@/components/Prizes/EditPrize"
import DeletePrize from "@/components/Prizes/DeletePrize"
import PendingItems from "@/components/Pending/PendingItems"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

// ─── Admin: Prize Card (with edit/delete) ────────────────────────
const AdminPrizeCard = ({ prize }: { prize: PrizePublic }) => (
  <Box
    bg="white"
    borderRadius={16}
    overflow="hidden"
    boxShadow="sm"
    transition="all 0.2s"
    _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
  >
    {prize.image_url ? (
      <Image src={prize.image_url} alt={prize.name} w="100%" h="200px" objectFit="cover" />
    ) : (
      <Flex w="100%" h="200px" bg="gray.100" align="center" justify="center">
        <Text color="gray.400" fontSize="3xl">🎁</Text>
      </Flex>
    )}
    <Box p={4}>
      <Flex justify="space-between" align="start" mb={2}>
        <Text fontWeight="bold" fontSize="lg" flex={1} lineClamp={2}>{prize.name}</Text>
        {prize.stock > 0 ? (
          <Badge colorPalette="green" ml={2}>库存 {prize.stock}</Badge>
        ) : (
          <Badge colorPalette="red" ml={2}>缺货</Badge>
        )}
      </Flex>
      {prize.description && (
        <Text color="gray.600" fontSize="sm" mb={3} lineClamp={2}>{prize.description}</Text>
      )}
      <Flex justify="space-between" align="center" mb={3}>
        {prize.price && (
          <Text color="orange.500" fontWeight="medium">¥{prize.price.toFixed(2)}</Text>
        )}
        <Badge colorPalette="blue" fontSize="md" px={2} py={1}>{prize.coins_cost} 学习币</Badge>
      </Flex>
      <Flex gap={2}>
        <EditPrize prize={prize} />
        <DeletePrize id={prize.id} />
      </Flex>
    </Box>
  </Box>
)

// ─── Admin: Prize List Tab ───────────────────────────────────────
const AdminPrizeList = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => PrizesService.readPrizes({}),
    queryKey: ["prizes"],
  })
  const prizes = data?.data ?? []

  if (isLoading) return <PendingItems />

  return (
    <Box>
      <Flex justifyContent="flex-end" mb={4}>
        <AddPrize />
      </Flex>
      {prizes.length === 0 ? (
        <Flex bg="white" borderRadius={16} p={10} justifyContent="center" alignItems="center" direction="column" gap={2}>
          <Text color="gray.400" fontSize="lg">🎁 暂无奖品</Text>
          <Text color="gray.400" fontSize="sm">点击右上角添加奖品</Text>
        </Flex>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }} gap={6}>
          {prizes.map((prize) => (
            <AdminPrizeCard key={prize.id} prize={prize} />
          ))}
        </Grid>
      )}
    </Box>
  )
}

// ─── Admin: Redemption Records Tab ───────────────────────────────
const AdminRedemptions = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => GrowthService.getRedemptions({ limit: 100 }),
    queryKey: ["redemptions-admin"],
  })
  const redemptions = data?.data ?? []

  if (isLoading) return <PendingItems />

  if (redemptions.length === 0) {
    return (
      <Flex bg="white" borderRadius={16} p={10} justifyContent="center" alignItems="center" direction="column" gap={2}>
        <Text color="gray.400" fontSize="lg">📋 暂无兑换记录</Text>
      </Flex>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      {redemptions.map((r) => (
        <Flex key={r.id} bg="white" borderRadius={12} p={4} justify="space-between" align="center" boxShadow="sm">
          <Box>
            <Text fontWeight="bold">🎁 {r.prize_name}</Text>
            <Text fontSize="xs" color="gray.500">
              用户 {r.user_id.slice(0, 8)}… · {new Date(r.redeemed_at).toLocaleString("zh-CN")}
            </Text>
          </Box>
          <Badge colorPalette="orange" fontSize="sm" px={3} py={1}>-{r.coins_spent} 🪙</Badge>
        </Flex>
      ))}
    </VStack>
  )
}

// ─── User: Prize Store Card (with redeem) ────────────────────────
const UserPrizeCard = ({ prize, userCoins }: { prize: PrizePublic; userCoins: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const canAfford = userCoins >= prize.coins_cost
  const inStock = prize.stock > 0

  const mutation = useMutation({
    mutationFn: () => GrowthService.redeemPrize({ prizeId: prize.id }),
    onSuccess: () => {
      showSuccessToast(`成功兑换「${prize.name}」🎉`)
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] })
    },
  })

  return (
    <>
      <Box
        bg="white"
        borderRadius={16}
        overflow="hidden"
        boxShadow="sm"
        transition="all 0.2s"
        _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      >
        {prize.image_url ? (
          <Image src={prize.image_url} alt={prize.name} w="100%" h="200px" objectFit="cover" />
        ) : (
          <Flex w="100%" h="200px" bg="gray.100" align="center" justify="center">
            <Text color="gray.400" fontSize="3xl">🎁</Text>
          </Flex>
        )}
        <Box p={4}>
          <Text fontWeight="bold" fontSize="lg" mb={1} lineClamp={2}>{prize.name}</Text>
          {prize.description && (
            <Text color="gray.600" fontSize="sm" mb={3} lineClamp={2}>{prize.description}</Text>
          )}
          <Flex justify="space-between" align="center" mb={3}>
            <Badge colorPalette="orange" fontSize="md" px={2} py={1}>🪙 {prize.coins_cost}</Badge>
            {!inStock && <Badge colorPalette="red">已售罄</Badge>}
          </Flex>
          <Button
            w="full"
            colorPalette={canAfford && inStock ? "orange" : "gray"}
            disabled={!canAfford || !inStock}
            onClick={() => setIsOpen(true)}
          >
            {!inStock ? "已售罄" : !canAfford ? "学习币不足" : "立即兑换"}
          </Button>
        </Box>
      </Box>

      <DialogRoot size={{ base: "xs", md: "md" }} placement="center" open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认兑换</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={3} align="stretch">
              <Flex bg="gray.50" borderRadius={12} p={4} justify="space-between">
                <Text color="gray.600">奖品</Text>
                <Text fontWeight="bold">{prize.name}</Text>
              </Flex>
              <Flex bg="gray.50" borderRadius={12} p={4} justify="space-between">
                <Text color="gray.600">需要学习币</Text>
                <Text fontWeight="bold" color="orange.500">🪙 {prize.coins_cost}</Text>
              </Flex>
              <Flex bg="gray.50" borderRadius={12} p={4} justify="space-between">
                <Text color="gray.600">当前余额</Text>
                <Text fontWeight="bold" color="blue.500">🪙 {userCoins}</Text>
              </Flex>
              <Flex bg="green.50" borderRadius={12} p={4} justify="space-between">
                <Text color="gray.600">兑换后余额</Text>
                <Text fontWeight="bold" color="green.500">🪙 {userCoins - prize.coins_cost}</Text>
              </Flex>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <Button variant="subtle" colorPalette="gray" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
              取消
            </Button>
            <Button variant="solid" colorPalette="orange" onClick={() => mutation.mutate()} loading={mutation.isPending}>
              确认兑换
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </>
  )
}

// ─── User: Prize Store Tab ───────────────────────────────────────
const UserPrizeStore = ({ userCoins }: { userCoins: number }) => {
  const { data, isLoading } = useQuery({
    queryFn: () => PrizesService.readPrizes({}),
    queryKey: ["prizes"],
  })
  const prizes = data?.data ?? []

  if (isLoading) return <PendingItems />

  if (prizes.length === 0) {
    return (
      <Flex bg="white" borderRadius={16} p={10} justifyContent="center" alignItems="center" direction="column" gap={2}>
        <Text color="gray.400" fontSize="lg">🎁 暂无可兑换的奖品</Text>
        <Text color="gray.400" fontSize="sm">敬请期待更多精彩奖品！</Text>
      </Flex>
    )
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }} gap={6}>
      {prizes.map((prize) => (
        <UserPrizeCard key={prize.id} prize={prize} userCoins={userCoins} />
      ))}
    </Grid>
  )
}

// ─── User: My Redemptions Tab ────────────────────────────────────
const UserRedemptions = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => GrowthService.getRedemptions({ limit: 100 }),
    queryKey: ["my-redemptions"],
  })
  const redemptions = data?.data ?? []

  if (isLoading) return <PendingItems />

  if (redemptions.length === 0) {
    return (
      <Flex bg="white" borderRadius={16} p={10} justifyContent="center" alignItems="center" direction="column" gap={2}>
        <Text color="gray.400" fontSize="lg">📋 还没有兑换记录哦</Text>
        <Text color="gray.400" fontSize="sm">快去商城兑换心仪的奖品吧！</Text>
      </Flex>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      {redemptions.map((r) => (
        <Flex key={r.id} bg="white" borderRadius={12} p={4} justify="space-between" align="center" boxShadow="sm">
          <Box>
            <Text fontWeight="bold">🎁 {r.prize_name}</Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(r.redeemed_at).toLocaleString("zh-CN")}
            </Text>
          </Box>
          <Badge colorPalette="orange" fontSize="sm" px={3} py={1}>-{r.coins_spent} 🪙</Badge>
        </Flex>
      ))}
    </VStack>
  )
}

// ─── Main Page Component ─────────────────────────────────────────
const Prizes = () => {
  const { user } = useAuth()
  const isAdmin = user?.is_superuser ?? false
  console.log('---isAdmin---', isAdmin, user)
  const userCoins = user?.coins ?? 0

  if (!user) return null

  const adminTabs = [
    { value: "prize-list", title: "奖品列表", emoji: "🎁" },
    { value: "redemptions", title: "兑换记录", emoji: "📋" },
  ]

  const userTabs = [
    { value: "store", title: "奖品商城", emoji: "🛒" },
    { value: "my-redemptions", title: "我的兑换", emoji: "📋" },
  ]

  const tabs = isAdmin ? adminTabs : userTabs

  return (
    <Container maxW="full">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">{isAdmin ? "🎁 奖品管理" : "🎁 奖品商城"}</Heading>
        {!isAdmin && (
          <Badge colorPalette="orange" fontSize="lg" px={4} py={2} borderRadius={12}>
            🪙 {userCoins} 学习币
          </Badge>
        )}
      </Flex>

      {/* Tabs */}
      <Box bg="white" borderRadius={24} boxShadow="md" overflow="hidden">
        <Tabs.Root defaultValue={tabs[0].value} variant="subtle">
          <Tabs.List px={4} pt={4} gap={2} borderBottom="1px solid" borderColor="gray.100">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                borderRadius={12}
                fontWeight="bold"
                px={5}
                py={3}
                _selected={{
                  bg: "linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)",
                  color: "white",
                }}
              >
                {tab.emoji} {tab.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {isAdmin ? (
            <>
              <Tabs.Content value="prize-list" p={6}>
                <AdminPrizeList />
              </Tabs.Content>
              <Tabs.Content value="redemptions" p={6}>
                <AdminRedemptions />
              </Tabs.Content>
            </>
          ) : (
            <>
              <Tabs.Content value="store" p={6}>
                <UserPrizeStore userCoins={userCoins} />
              </Tabs.Content>
              <Tabs.Content value="my-redemptions" p={6}>
                <UserRedemptions />
              </Tabs.Content>
            </>
          )}
        </Tabs.Root>
      </Box>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/prizes")({
  component: Prizes,
})
