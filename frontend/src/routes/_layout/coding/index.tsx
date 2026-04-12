import { Box, Button, Container, Flex, Grid, Heading, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import type { UserPublic } from "@/client"
import { CodingService, type CodingProjectPublic } from "@/client/codingService"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/coding/")({
  component: CodingPage,
})

function CodingPage() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isChild = currentUser?.role === "child"

  const { data: projects, isLoading } = useQuery({
    queryKey: ["coding-projects"],
    queryFn: () => CodingService.listProjects({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) =>
      CodingService.deleteProject({ projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-projects"] })
      showSuccessToast("作品已删除")
    },
  })

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
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
                boxShadow="0 4px 12px rgba(255,107,53,0.3)"
              >
                <FiPlus /> 新建作品
              </Button>
            </Link>
          )}
        </Flex>

        {isLoading ? (
          <Text textAlign="center" color="gray.500" py={12}>加载中...</Text>
        ) : projects?.data && projects.data.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
            {projects.data.map((project: CodingProjectPublic) => (
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
                  <Flex gap={2}>
                    <Link to={`/coding/editor?id=${project.id}`}>
                      <Button size="sm" colorScheme="orange" variant="ghost">
                        编辑
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="red.500"
                      onClick={() => deleteMutation.mutate(project.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </Flex>
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
            <Text fontSize="6xl" mb={4}>🎨</Text>
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
                <Button colorScheme="orange" size="lg">
                  <FiPlus /> 创建第一个作品
                </Button>
              </Link>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  )
}
