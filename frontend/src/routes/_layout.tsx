import { Box, Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
})

function Layout() {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Box
          display={{ base: "none", md: "block" }}
          w="320px"
          flexShrink={0}
          bg="white"
          borderRight="1px solid"
          borderRightColor="orange.50"
          boxShadow="2px 0 12px rgba(255,107,53,0.06)"
          overflowY="auto"
        >
          <Sidebar />
        </Box>
        <Flex
          flex="1"
          direction="column"
          overflowY="auto"
          bg="linear-gradient(160deg, #fff8f0 0%, #fff0fa 50%, #f0fff8 100%)"
          p={6}
        >
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
