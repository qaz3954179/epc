import { Box, Flex, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"

import type { UserPublic } from "@/client"

const items = [
  { title: "学习币",   path: "/",         adminOnly: false, emoji: "🪙" },
  { title: "今日待办", path: "/items",    adminOnly: false, emoji: "✅" },
  { title: "任务管理", path: "/tasks",    adminOnly: true,  emoji: "📋" },
  { title: "奖品商城", path: "/prizes",   adminOnly: false, emoji: "🎁" },
  { title: "我的宝贝", path: "/children", adminOnly: false, emoji: "👶" },
  { title: "用户管理", path: "/admin",    adminOnly: true,  emoji: "👥" },
  { title: "推广",     path: "/referral", adminOnly: false, emoji: "📣" },
  { title: "成长记录", path: "/growth",   adminOnly: false, emoji: "📈" },
  { title: "设置",     path: "/settings", adminOnly: false, emoji: "⚙️" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const location = useRouterState({ select: (s) => s.location })

  const finalItems = currentUser?.is_superuser
    ? items
    : items.filter((item) => !item.adminOnly)

  return (
    <Box pt={4}>
      <Text fontSize="xs" px={5} py={2} fontWeight="bold" color="gray.400" letterSpacing="wider">
        菜单导航
      </Text>
      {finalItems.map(({ title, path, emoji }) => {
        const isActive = location.pathname === path
        return (
          <RouterLink key={title} to={path} onClick={onClose}>
            <Flex
              align="center"
              gap={3}
              px={4}
              py={4}
              mx={2}
              my={1}
              borderRadius={14}
              bg={isActive ? "rgba(255,107,53,0.1)" : "transparent"}
              _hover={{ bg: "rgba(255,107,53,0.07)" }}
              transition="all 0.15s"
            >
              <Flex
                w="40px" h="40px"
                borderRadius={12}
                bg={isActive ? "rgba(255,107,53,0.15)" : "gray.50"}
                align="center" justify="center"
                fontSize="20px"
                flexShrink={0}
              >
                {emoji}
              </Flex>
              <Text
                fontSize="md"
                fontWeight={isActive ? "bold" : "medium"}
                color={isActive ? "orange.500" : "gray.600"}
              >
                {title}
              </Text>
              {isActive && (
                <Box ml="auto" w="4px" h="20px" borderRadius="full" bg="orange.400" />
              )}
            </Flex>
          </RouterLink>
        )
      })}
    </Box>
  )
}

export default SidebarItems
