import { Box, Button, Container, Flex, Heading, IconButton, Input, Portal, Text, Textarea, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { FiMaximize2, FiMinimize2, FiSave } from "react-icons/fi"
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  // 用 ref 保存最新的 XML，防止切换全屏时被清空
  const blocklyXmlRef = useRef("")

  const { data: project } = useQuery({
    queryKey: ["coding-project", id],
    queryFn: () => CodingService.getProject({ projectId: id! }),
    enabled: !!id,
  })

  useEffect(() => {
    if (project) {
      console.log("Project loaded:", project)
      setTitle(project.title)
      setDescription(project.description || "")
      setBlocklyXml(project.blockly_xml)
      blocklyXmlRef.current = project.blockly_xml
      setGeneratedCode(project.generated_code || "")
    }
  }, [project])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

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

  const handleBlocklyChange = useCallback((xml: string, code: string) => {
    blocklyXmlRef.current = xml
    setBlocklyXml(xml)
    setGeneratedCode(code)
  }, [])

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

  console.log("Render, blocklyXml length:", blocklyXml.length, "isFullscreen:", isFullscreen)

  return (
    <>
      {/* 全屏遮罩 */}
      {isFullscreen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1000}
          bg="white"
          display="flex"
          flexDirection="column"
        >
          <Flex
            px={4}
            py={2}
            borderBottom="1px solid"
            borderColor="gray.200"
            align="center"
            justify="space-between"
            flexShrink={0}
          >
            <Text fontWeight="bold">🧩 积木编辑区 — {title}</Text>
            <Flex gap={2}>
              <Button
                colorScheme="orange"
                size="sm"
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                <FiSave /> 保存
              </Button>
              <IconButton
                aria-label="退出全屏"
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(false)}
              >
                <FiMinimize2 />
              </IconButton>
            </Flex>
          </Flex>
          <Box flex={1}>
            <BlocklyEditor
              initialXml={blocklyXmlRef.current}
              onChange={handleBlocklyChange}
            />
          </Box>
        </Box>
      )}

      <Container maxW="container.xl" py={8}>
        <VStack align="stretch" gap={6}>
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
              loading={saveMutation.isPending}
            >
              <FiSave /> 保存作品
            </Button>
          </Flex>

          <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>作品名称</Text>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给你的作品起个名字"
                  size="lg"
                />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>作品描述</Text>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述一下你的作品..."
                  rows={3}
                />
              </Box>
            </VStack>
          </Box>

          <Box bg="white" borderRadius="xl" boxShadow="md" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="bold">积木编辑区</Text>
              <IconButton
                aria-label="全屏编辑"
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(true)}
              >
                <FiMaximize2 />
              </IconButton>
            </Flex>
            
            <Box h="500px">
              <BlocklyEditor
                initialXml={blocklyXml}
                onChange={handleBlocklyChange}
              />
            </Box>
          </Box>

          {generatedCode && (
            <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
              <Text fontWeight="bold" mb={4}>生成的 JavaScript 代码</Text>
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
    </>
  )
}
