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
import { createFileRoute } from "@tanstack/react-router"

import AddChild from "@/components/Children/AddChild"
import EditChild from "@/components/Children/EditChild"
import DeleteChild from "@/components/Children/DeleteChild"
import PendingItems from "@/components/Pending/PendingItems"
import { ChildrenService, type ChildPublic, type ChildrenPublic } from "@/client"

// 默认卡通头像
const getDefaultAvatar = (gender: "boy" | "girl") => {
  return gender === "boy"
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=boy&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=girl&backgroundColor=ffd5dc"
}

const ChildCard = ({ child }: { child: ChildPublic }) => {
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
          alt={child.nickname}
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
              {child.nickname}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {child.real_name}
            </Text>
          </Box>
          <Badge colorPalette={genderColor} ml={2}>
            {genderText}
          </Badge>
        </Flex>
        {child.birth_month && (
          <Text color="gray.500" fontSize="sm" mb={3}>
            🎂 {child.birth_month}
          </Text>
        )}
        <Flex gap={2}>
          <EditChild child={child} />
          <DeleteChild id={child.id} />
        </Flex>
      </Box>
    </Box>
  )
}

const Children = () => {
  const { data, isLoading } = useQuery<ChildrenPublic>({
    queryFn: () => ChildrenService.readChildren(),
    queryKey: ["children"],
  })

  const children = data?.data ?? []

  return (
    <Container maxW="full">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">👶 我的宝贝</Heading>
      </Flex>

      {/* Add Button */}
      <Flex justifyContent="flex-end" mb={4}>
        <AddChild />
      </Flex>

      {/* Content */}
      {isLoading ? (
        <PendingItems />
      ) : children.length === 0 ? (
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
            点击右上角添加宝贝信息
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
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </Grid>
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/children")({
  component: Children,
})
