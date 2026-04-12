import { Box, Flex, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"

import type { UserPublic } from "@/client"

type UserRole = "admin" | "parent" | "child"

interface MenuItem {
  title: string
  path: string
  emoji: string
  /** 哪些角色可见，undefined = 所有角色可见 */
  roles?: UserRole[]
}

const items: MenuItem[] = [
  // 宝贝专属
  { title: "学习币",   path: "/",         emoji: "🪙",  roles: ["child"] },
  { title: "今日待办", path: "/items",    emoji: "✅",  roles: ["child"] },
  { title: "我的考试", path: "/exams",    emoji: "📝",  roles: ["child"] },
  { title: "编程乐园", path: "/coding",   emoji: "💻",  roles: ["child"] },
  { title: "奖品商城", path: "/prizes",   emoji: "🎁",  roles: ["child"] },
  { title: "成长记录", path: "/growth",   emoji: "📈",  roles: ["child"] },
  { title: "我的成就", path: "/achievements", emoji: "🏆", roles: ["child"] },
  // 家长专属
  { title: "学习币",       path: "/",               emoji: "🪙",  roles: ["parent"] },
  { title: "监控面板",     path: "/parent/monitor",  emoji: "📊",  roles: ["parent"] },
  { title: "我的宝贝",     path: "/children",        emoji: "👶",  roles: ["parent"] },
  { title: "任务管理",     path: "/tasks",           emoji: "📋",  roles: ["parent"] },
  { title: "考试管理",     path: "/parent/exams",    emoji: "📝",  roles: ["parent"] },
  { title: "自驱力分析",   path: "/parent/sdi",      emoji: "📊",  roles: ["parent"] },
  { title: "编程管理",     path: "/coding",          emoji: "💻",  roles: ["parent"] },
  { title: "奖品管理",     path: "/prizes",          emoji: "🎁",  roles: ["parent"] },
  { title: "推广",         path: "/referral",        emoji: "📣",  roles: ["parent"] },
  // 管理员专属
  { title: "学习币",   path: "/",         emoji: "🪙",  roles: ["admin"] },
  { title: "今日待办", path: "/items",    emoji: "✅",  roles: ["admin"] },
  { title: "任务管理", path: "/tasks",    emoji: "📋",  roles: ["admin"] },
  { title: "考试管理", path: "/parent/exams", emoji: "📝",  roles: ["admin"] },
  { title: "编程管理", path: "/coding",       emoji: "💻",  roles: ["admin"] },
  { title: "奖品管理", path: "/prizes",   emoji: "🎁",  roles: ["admin"] },
  { title: "成就管理", path: "/admin/achievements", emoji: "🏆", roles: ["admin"] },
  { title: "我的宝贝", path: "/children", emoji: "👶",  roles: ["admin"] },
  { title: "用户管理", path: "/admin",    emoji: "👥",  roles: ["admin"] },
  { title: "推广",     path: "/referral", emoji: "📣",  roles: ["admin"] },
  { title: "成长记录", path: "/growth",   emoji: "📈",  roles: ["admin"] },
  { title: "自驱力分析", path: "/parent/sdi", emoji: "📊", roles: ["admin"] },
  // 所有角色
  { title: "设置",     path: "/settings", emoji: "⚙️" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const location = useRouterState({ select: (s) => s.location })

  const userRole: UserRole = (currentUser?.role as UserRole) || "parent"

  const finalItems = items.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  return (
    <Box pt={4}>
      <Text fontSize="xs" px={5} py={2} fontWeight="bold" color="gray.400" letterSpacing="wider">
        菜单导航
      </Text>
      {finalItems.map(({ title, path, emoji }) => {
        const isActive = location.pathname === path
        return (
          <RouterLink key={`${title}-${path}`} to={path} onClick={onClose}>
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
