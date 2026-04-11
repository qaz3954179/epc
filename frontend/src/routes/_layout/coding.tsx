import { Box, Button, Container, Flex, Grid, Heading, Text, VStack } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FiPlus } from "react-icons/fi"
import type { UserPublic } from "@/client"

export const Route = createFileRoute("/_layout/coding")({
  component: CodingPage,
})

function CodingPage() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const isChild = currentUser?.role === "child"

  // TODO: 实际获取作品列表
  const { data: projects } = useQuery({
    queryKey: ["coding-projects"],
    queryFn: async () => {
      // 临时返回空数组，等 API 客户端更新后再接入
      return { data: [], count: 0 }
    },
  })

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
        {/* 头部 */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="2xl" mb={2}>
              💻 编程乐园
            </Heading>
            <Text color="gray.600">
              {isChild ? "用积木创造你的作品，完成挑战赚学习币！" : "查看和管理孩子的编程作品"}
            </Text>
          </Box>
          {isChild && (
            <Link to="/coding/editor">
              <Button
                colorScheme="orange"
                size="lg"
                leftIcon={<FiPlus />}
                boxShadow="0 4px 12px rgba(255,107,53,0.3)"
              >
                新建作品
              </Button>
            </Link>
          )}
        </Flex>

        {/* 作品列表 */}
        {projects?.data && projects.data.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
            {projects.data.map((project: any) => (
              <Box
                key={project.id}
                p={5}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Text fontWeight="bold" fontSize="lg" mb={2}>
                  {project.title}
                </Text>
                <Text color="gray.600" fontSize="sm" noOfLines={2}>
                  {project.description || "暂无描述"}
                </Text>
                <Flex mt={4} justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.500">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </Text>
                  <Link to={`/coding/editor/${project.id}`}>
                    <Button size="sm" colorScheme="orange" variant="ghost">
                      编辑
                    </Button>
                  </Link>
                </Flex>
              </Box>
            ))}
          </Grid>
        ) : (
          <Box
            p={12}
            bg="white"
            borderRadius="2xl"
            textAlign="center"
            boxShadow="md"
          >
            <Text fontSize="6xl" mb={4}>
              🎨
            </Text>
            <Heading size="lg" mb={2} color="gray.700">
              {isChild ? "开始你的第一个作品吧！" : "还没有作品"}
            </Heading>
            <Text color="gray.600" mb={6}>
              {isChild
                ? "点击上方「新建作品」按钮，用积木搭建你的创意"
                : "孩子还没有创建编程作品"}
            </Text>
            {isChild && (
              <Link to="/coding/editor">
                <Button colorScheme="orange" size="lg" leftIcon={<FiPlus />}>
                  创建第一个作品
                </Button>
              </Link>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  )
}
