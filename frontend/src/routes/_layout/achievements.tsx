import { Box, Container, Flex, Grid, Heading, Text } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import {
  achievementService,
  type AchievementChildView,
  type AchievementNotification,
} from "@/client/achievementService"
import PendingItems from "@/components/Pending/PendingItems"

// ── 成就解锁弹窗 ─────────────────────────────────────
const UnlockPopup = ({
  notification,
  onClose,
}: {
  notification: AchievementNotification
  onClose: () => void
}) => (
  <Flex
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="blackAlpha.600"
    zIndex={9999}
    align="center"
    justify="center"
    onClick={onClose}
  >
    <Box
      bg="white"
      borderRadius={24}
      p={8}
      maxW="400px"
      w="90%"
      textAlign="center"
      onClick={(e) => e.stopPropagation()}
      animation="fadeIn 0.3s ease-out"
    >
      <Text fontSize="6xl" mb={4}>
        {notification.achievement_icon || "🏆"}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color="orange.500" mb={2}>
        🎉 成就解锁！
      </Text>
      <Text fontSize="lg" fontWeight="bold" mb={3}>
        {notification.achievement_name}
      </Text>
      <Text color="gray.600" fontSize="sm" mb={4} lineHeight="tall">
        {notification.reveal_message}
      </Text>
      {notification.coins_bonus > 0 && (
        <Box
          bg="orange.50"
          borderRadius={12}
          px={4}
          py={2}
          mb={4}
          display="inline-block"
        >
          <Text color="orange.600" fontWeight="bold" fontSize="sm">
            +{notification.coins_bonus} 🪙 学习币奖励
          </Text>
        </Box>
      )}
      <Box
        as="button"
        bg="orange.500"
        color="white"
        px={8}
        py={3}
        borderRadius={12}
        fontWeight="bold"
        cursor="pointer"
        _hover={{ bg: "orange.600" }}
        transition="all 0.2s"
        onClick={onClose}
      >
        太棒了！
      </Box>
    </Box>
  </Flex>
)

// ── 成就卡片 ──────────────────────────────────────────
const AchievementCard = ({ achievement }: { achievement: AchievementChildView }) => {
  const isHiddenLocked = !achievement.unlocked && achievement.name === "???"
  
  return (
    <Box
      bg="white"
      borderRadius={16}
      p={5}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      position="relative"
      overflow="hidden"
    >
      {achievement.unlocked ? (
        <Box
          position="absolute"
          top={2}
          right={2}
          bg="green.100"
          color="green.600"
          fontSize="xs"
          px={2}
          py={0.5}
          borderRadius={8}
          fontWeight="bold"
        >
          已解锁
        </Box>
      ) : (
        <Box
          position="absolute"
          top={2}
          right={2}
          fontSize="lg"
        >
          🔒
        </Box>
      )}
      <Flex direction="column" align="center" gap={3}>
        <Text
          fontSize="4xl"
          filter={achievement.unlocked ? "none" : "grayscale(100%)"}
          opacity={achievement.unlocked ? 1 : (isHiddenLocked ? 0.3 : 0.5)}
        >
          {achievement.icon}
        </Text>
        <Text
          fontWeight="bold"
          fontSize="md"
          textAlign="center"
          color={achievement.unlocked ? "gray.800" : "gray.400"}
        >
          {achievement.name}
        </Text>
        {achievement.unlocked && achievement.reveal_message && (
          <Text
            fontSize="xs"
            color="gray.500"
            textAlign="center"
            lineHeight="tall"
          >
            {achievement.reveal_message}
          </Text>
        )}
        {!achievement.unlocked && achievement.description && (
          <Text
            fontSize="xs"
            color="gray.400"
            textAlign="center"
            lineHeight="tall"
          >
            {achievement.description}
          </Text>
        )}
        {isHiddenLocked && (
          <Text
            fontSize="xs"
            color="gray.300"
            textAlign="center"
            fontStyle="italic"
          >
            神秘成就，等待解锁...
          </Text>
        )}
        {achievement.unlocked && achievement.unlocked_at && (
          <Text fontSize="xs" color="gray.400">
            {new Date(achievement.unlocked_at).toLocaleDateString("zh-CN")}
          </Text>
        )}
      </Flex>
    </Box>
  )
}

// ── 主页面 ────────────────────────────────────────────
const Achievements = () => {
  const queryClient = useQueryClient()
  const [activePopup, setActivePopup] = useState<AchievementNotification | null>(null)

  const { data: summary, isLoading } = useQuery({
    queryKey: ["achievements", "my"],
    queryFn: () => achievementService.getMyAchievements().then((r) => r.data),
  })

  const { data: notifications } = useQuery({
    queryKey: ["achievements", "notifications"],
    queryFn: () => achievementService.getNotifications(true).then((r) => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => achievementService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements", "notifications"] })
    },
  })

  // 自动弹出第一个未读通知
  useEffect(() => {
    if (notifications && notifications.length > 0 && !activePopup) {
      setActivePopup(notifications[0])
    }
  }, [notifications])

  const handleClosePopup = () => {
    if (activePopup) {
      markReadMutation.mutate(activePopup.id)
      // 弹出下一个
      const remaining = notifications?.filter((n) => n.id !== activePopup.id) || []
      setActivePopup(remaining.length > 0 ? remaining[0] : null)
    }
  }

  if (isLoading) return <PendingItems />

  return (
    <Container maxW="full" pb={8}>
      {/* 解锁弹窗 */}
      {activePopup && (
        <UnlockPopup notification={activePopup} onClose={handleClosePopup} />
      )}

      {/* 头部 */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">🏆 我的成就</Heading>
        <Box
          bg="orange.50"
          borderRadius={12}
          px={4}
          py={2}
        >
          <Text fontSize="sm" color="orange.600" fontWeight="bold">
            已解锁 {summary?.unlocked_count ?? 0} / {summary?.total_count ?? 0} 个
          </Text>
        </Box>
      </Flex>

      {/* 成就列表 */}
      {summary && summary.achievements && summary.achievements.length > 0 ? (
        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          }}
          gap={4}
        >
          {summary.achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </Grid>
      ) : (
        <Flex
          direction="column"
          align="center"
          gap={4}
          py={16}
          bg="white"
          borderRadius={16}
        >
          <Text fontSize="5xl">🔒</Text>
          <Text fontSize="lg" color="gray.500">
            还没有任何成就
          </Text>
          <Text fontSize="sm" color="gray.400">
            继续完成任务，惊喜会在不经意间出现哦！
          </Text>
        </Flex>
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/achievements")({
  component: Achievements,
})
