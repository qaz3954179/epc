import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { ErpcAvatar, ErpcCoins, ErpcGifts, ErpcGrowth, ErpcHome, ErpcPromotion, ErpcSettings, ErpcTasks, ErpcWithdraw } from 'erpc-icons/erpc'
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
    { icon: ErpcCoins, title: "学习币", path: "/", adminOnly: false },
    { icon: ErpcTasks, title: "今日待办", path: "/items", adminOnly: false },
    { icon: ErpcTasks, title: "任务管理", path: "/tasks", adminOnly: true },
    { icon: ErpcGifts, title: "奖品管理", path: "/prizes", adminOnly: true },
    { icon: ErpcAvatar, title: "用户管理", path: "/admin", adminOnly: true },
    { icon: ErpcPromotion, title: "推广", path: "/referral", adminOnly: false },
    { icon: ErpcSettings, title: "设置", path: "/settings", adminOnly: false },
    { icon: ErpcGrowth, title: "成长记录", path: "/growth", adminOnly: false },
]

interface SidebarItemsProps {
    onClose?: () => void
}

interface Item {
    icon: IconType
    title: string
    path: string
    adminOnly: boolean
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
    const queryClient = useQueryClient()
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
    const location = useRouterState({ select: (s) => s.location })

    const finalItems: Item[] = currentUser?.is_superuser
        ? items
        : items.filter((item) => !item.adminOnly)

    const listItems = finalItems.map(({ icon, title, path }) => {
        const isActive = location.pathname === path

        return (
            <RouterLink key={title} to={path} onClick={onClose} >
                <Flex
                    gap={4}
                    px={4}
                    py={4}
                    bg={isActive ? "menu.hover.bg" : undefined}
                    _hover={{
                        bg: "menu.hover.bg",
                        '& > *': {
                            color: "menu.hover.color",
                        }
                    }}
                    alignItems="center"
                    fontSize="sm"
                >
                    <Icon as={icon} alignSelf="center" size={'md'} color={isActive ? "menu.active.color" : undefined} />
                    <Text ml={2} fontSize={"md"} color={isActive ? "menu.active.color" : "menu.color"} >{title}</Text>
                </Flex>
            </RouterLink>
        )
    })

    return (
        <>
            <Text fontSize="md" px={4} py={2} fontWeight="bold" color={'menu.color'}>
                菜单导航
            </Text>
            <Box>{listItems}</Box>
        </>
    )
}

export default SidebarItems
