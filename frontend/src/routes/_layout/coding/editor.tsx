import { Box, Button, Container, Flex, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { FiSave } from "react-icons/fi"
import useCustomToast from "@/hooks/useCustomToast"
import { CodingService } from "@/client/codingService"
import BlocklyEditor from "@/components/Coding/BlocklyEditor"

export const Route = createFileRoute("/_layout/coding/editor")({
  component: EditorPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || undefined,
    }
  },
})

function EditorPage() {
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { id } = useSearch({ from: "/_layout/coding/editor" })

  const [title, setTitle] = useState("我的作品")
  const [description, setDescription] = useState("")
  const [blocklyXml, setBlocklyXml] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  // 加载现有作品
  const { data: project } = useQuery({
    queryKey: ["coding-project", id],
    queryFn: () => CodingService.getProject({ projectId: id! }),
    enabled: !!id,
  })

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description || "")
      setBlocklyXml(project.blockly_xml)
      setGeneratedCode(project.generated_code || "")
    }
  }, [project])

  const saveMutation = useMutation({
    mutationFn: () => {
      if (id) {
        return CodingService.updateProject({
          projectId: id,
          requestBody: {
            title,
            description,
            blockly_xml: blocklyXml,
            generated_code: generatedCode,
          },
        })
      } else {
        return CodingService.createProject({
          requestBody: {
            title,
            description,
            blockly_xml: blocklyXml,
            generated_code: generatedCode,
          },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-projects"] })
      showSuccessToast("作品已保存！")
      navigate({ to: "/coding" })
    },
    onError: () => {
      showErrorToast("保存失败，请重试")
    },
  })

  const handleBlocklyChange = (xml: string, code: string) => {
    setBlocklyXml(xml)
    setGeneratedCode(code)
  }

  const handleSave = () => {
    if (!title.trim()) {
      showErrorToast("请输入作品名称")
      return
    }
    if (!blocklyXml.trim()) {
      showErrorToast("请先创建一些积木")
      return
    }
    saveMutation.mutate()
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
        {/* 头部 */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>
              ✨ 编程编辑器
            </Heading>
            <Text color="gray.600">拖拽积木，创造你的作品</Text>
          </Box>
          <Button
            colorScheme="orange"
            size="lg"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
          >
            <FiSave /> 保存作品
          </Button>
        </Flex>

        {/* 作品信息 */}
        <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>
                作品名称
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的作品起个名字"
                size="lg"
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={2}>
                作品描述
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述一下你的作品..."
                rows={3}
              />
            </Box>
          </VStack>
        </Box>

        {/* Blockly 编辑器 */}
        <Box bg="white" borderRadius="xl" boxShadow="md" p={4}>
          <Text fontWeight="bold" mb={4}>
            积木编辑区
          </Text>
          <BlocklyEditor
            initialXml={blocklyXml}
            onChange={handleBlocklyChange}
          />
        </Box>

        {/* 生成的代码预览 */}
        {generatedCode && (
          <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
            <Text fontWeight="bold" mb={4}>
              生成的 JavaScript 代码
            </Text>
            <Box
              as="pre"
              p={4}
              bg="gray.50"
              borderRadius="md"
              fontSize="sm"
              overflow="auto"
              maxH="300px"
            >
              {generatedCode}
            </Box>
          </Box>
        )}
      </VStack>
    </Container>
  )
}
