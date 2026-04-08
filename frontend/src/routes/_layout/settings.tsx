import { Box, Container, Tabs, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import useAuth from "@/hooks/useAuth"

const tabsConfig = [
  { value: "my-profile", title: "我的资料", emoji: "👤", component: UserInformation },
  { value: "password", title: "修改密码", emoji: "🔒", component: ChangePassword },
  { value: "danger-zone", title: "危险区域", emoji: "⚠️", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const finalTabs = currentUser?.is_superuser ? tabsConfig.slice(0, 2) : tabsConfig

  if (!currentUser) return null

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #faf0ff 0%, #e8f4fd 40%, #fff5f5 100%)"
      py={6}
    >
      <Container maxW="800px" px={{ base: 4, md: 8 }}>
        {/* 标题横幅 */}
        <Box
          borderRadius={28}
          mb={6}
          overflow="hidden"
          boxShadow="xl"
          bg="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
          p={7}
          position="relative"
        >
          {["⚙️", "✨", "🌟"].map((s, i) => (
            <Text
              key={i}
              position="absolute"
              fontSize="2xl"
              opacity={0.3}
              top={`${10 + i * 25}%`}
              right={`${8 + i * 6}%`}
              style={{ transform: `rotate(${i * 20}deg)` }}
            >
              {s}
            </Text>
          ))}
          <Text fontSize="2xl" fontWeight="black" color="white" mb={1}>
            ⚙️ 个人设置
          </Text>
          <Text color="whiteAlpha.900" fontSize="md">
            管理你的账户信息和安全设置
          </Text>
        </Box>

        {/* 内容卡片 */}
        <Box bg="white" borderRadius={24} boxShadow="md" overflow="hidden">
          <Tabs.Root defaultValue="my-profile" variant="subtle">
            <Tabs.List
              px={4}
              pt={4}
              gap={2}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              {finalTabs.map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  borderRadius={12}
                  fontWeight="bold"
                  px={5}
                  py={3}
                  _selected={{
                    bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                    color: "white",
                  }}
                >
                  {tab.emoji} {tab.title}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {finalTabs.map((tab) => (
              <Tabs.Content key={tab.value} value={tab.value} p={6}>
                <tab.component />
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </Box>
      </Container>
    </Box>
  )
}
