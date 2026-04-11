import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import PendingItems from "@/components/Pending/PendingItems"
import RouteGuard from "@/components/Common/RouteGuard"
import { ParentService, type ChildAccountPublic } from "@/client"
import { Button } from "@/components/ui/button"
import AddChildAccount from "@/components/Children/AddChildAccount"
import EditChildAccount from "@/components/Children/EditChildAccount"
import DeleteChildAccount from "@/components/Children/DeleteChildAccount"

const getDefaultAvatar = (gender: string | null) => {
  return gender === "boy"
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=boy&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=girl&backgroundColor=ffd5dc"
}

const ChildCard = ({ child }: { child: ChildAccountPublic }) => {
  const navigate = useNavigate()
  const avatarUrl = child.avatar_url || getDefaultAvatar(child.gender)
  const genderText = child.gender === "boy" ? "男孩" : "女孩"
  const genderColor = child.gender === "boy" ? "blue" : "pink"

  return (
    <Box
      bg="white"
      borderRadius={16}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
    >
      <Flex w="100%" h="200px" bg="gray.100" align="center" justify="center">
        <Image
          src={avatarUrl}
          alt={child.nickname || child.username || "宝贝"}
          w="160px"
          h="160px"
          objectFit="cover"
          borderRadius="full"
        />
      </Flex>
      <Box p={4}>
        <Flex justify="space-between" align="start" mb={2}>
          <Box flex={1}>
            <Text fontWeight="bold" fontSize="lg" mb={1}>
              {child.nickname || child.username}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {child.full_name}
            </Text>
            <Text color="gray.500" fontSize="xs">
              账号: {child.username}
            </Text>
          </Box>
          {child.gender && (
            <Badge colorPalette={genderColor} ml={2}>
              {genderText}
            </Badge>
          )}
        </Flex>
        <Flex align="center" gap={2} mb={3}>
          <Text fontSize="sm" color="orange.500" fontWeight="bold">
            🪙 {child.coins} 学习币
          </Text>
          {child.birth_month && (
            <Text color="gray.500" fontSize="sm">
              🎂 {child.birth_month}
            </Text>
          )}
        </Flex>
        <Flex gap={2} mb={2}>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/parent/monitor", search: { child: child.id } })}>
            📊 查看详情
          </Button>
          <EditChildAccount child={child} />
          <DeleteChildAccount childId={child.id} />
        </Flex>
      </Box>
    </Box>
  )
}

const Children = () => {
  const { data: children, isLoading } = useQuery<ChildAccountPublic[]>({
    queryFn: () => ParentService.getMyChildren(),
    queryKey: ["parentChildren"],
  })

  const childList = children ?? []

  return (
    <RouteGuard allowedRoles={["admin", "parent"]}>
    <Container maxW="full">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">👶 我的宝贝</Heading>
      </Flex>

      <Flex justifyContent="flex-end" mb={4}>
        <AddChildAccount />
      </Flex>

      {isLoading ? (
        <PendingItems />
      ) : childList.length === 0 ? (
        <Flex
          bg="white"
          borderRadius={16}
          p={10}
          justifyContent="center"
          alignItems="center"
          direction="column"
          gap={2}
        >
          <Text color="gray.400" fontSize="lg">
            👶 还没有添加宝贝哦
          </Text>
          <Text color="gray.400" fontSize="sm">
            点击右上角「添加宝贝」为宝贝创建独立登录账户
          </Text>
        </Flex>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
          }}
          gap={6}
        >
          {childList.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </Grid>
      )}
    </Container>
    </RouteGuard>
  )
}

export const Route = createFileRoute("/_layout/children")({
  component: Children,
})
