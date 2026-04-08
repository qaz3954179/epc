import { Box, Button, Flex, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import { ErpcAvatar, ErpcExit, ErpcHome } from "erpc-icons/erpc"

const UserMenu = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Flex>
        <Button variant={"ghost"}>
          <ErpcHome size={24} />
          <Text>首页</Text>
        </Button>
        <MenuRoot>
          <MenuTrigger asChild p={2}>
            <Button data-testid="user-menu" variant="ghost" maxW="sm" truncate>
              <ErpcAvatar size={16} />
              <Text>{user?.full_name || "User"}</Text>
            </Button>
          </MenuTrigger>

          <MenuContent>
            <Link to="settings">
              <MenuItem
                closeOnSelect
                value="user-settings"
                gap={2}
                py={2}
                style={{ cursor: "pointer" }}
              >
                <ErpcAvatar size={18} />
                <Box flex="1">个人中心</Box>
              </MenuItem>
            </Link>

            <MenuItem
              value="logout"
              gap={2}
              py={2}
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
            >
              <ErpcExit size={18} />
              退出
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
    </>
  )
}

export default UserMenu
