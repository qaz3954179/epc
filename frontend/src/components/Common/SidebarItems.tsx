import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { ErpcAvatar, ErpcCoins, ErpcGifts, ErpcGrowth, ErpcHome, ErpcPromotion, ErpcSettings, ErpcTasks, ErpcWithdraw } from 'erpc-icons/erpc'
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
    { icon: ErpcCoins, title: "学习币", path: "/" },
    { icon: ErpcTasks, title: "今日待办", path: "/items" },
    { icon: ErpcTasks, title: "任务管理", path: "/tasks" },
    { icon: ErpcGifts, title: "奖品管理", path: "/prizes" },
    { icon: ErpcPromotion, title: "推广", path: "/settings" },
    { icon: ErpcSettings, title: "设置", path: "/settings" },
    { icon: ErpcGrowth, title: "成长记录", path: "/settings" },
]

interface SidebarItemsProps {
    onClose?: () => void
}

interface Item {
    icon: IconType
    title: string
    path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
    const queryClient = useQueryClient()
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

    const finalItems: Item[] = currentUser?.is_superuser
        ? [...items, { icon: ErpcAvatar, title: "用户管理", path: "/admin" }]
        : items

    const listItems = finalItems.map(({ icon, title, path }) => (
        <RouterLink key={title} to={path} onClick={onClose} >
            <Flex
                gap={4}
                px={4}
                py={4}
                _hover={{
                    bg: "menu.hover.bg",
                    '& > *': {
                        color: "menu.hover.color",
                    }
                }}
                alignItems="center"
                fontSize="sm"
            >
                <Icon as={icon} alignSelf="center" size={'md'} />
                <Text ml={2} fontSize={"md"} color={'menu.color'} >{title}</Text>
            </Flex>
        </RouterLink>
    ))

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
