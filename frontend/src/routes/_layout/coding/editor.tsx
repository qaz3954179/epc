import { Box, Button, Container, Flex, Heading, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiSave } from "react-icons/fi"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/coding/editor")({
  component: EditorPage,
})

function EditorPage() {
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const [title, setTitle] = useState("我的作品")
  const [description, setDescription] = useState("")

  const handleSave = async () => {
    // TODO: 调用 API 保存作品
    showToast("成功", "作品已保存！", "success")
    navigate({ to: "/coding" })
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
            leftIcon={<FiSave />}
            onClick={handleSave}
          >
            保存作品
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

        {/* Blockly 编辑器占位 */}
        <Box
          p={12}
          bg="white"
          borderRadius="xl"
          boxShadow="md"
          minH="500px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="2px dashed"
          borderColor="gray.200"
        >
          <VStack gap={4}>
            <Text fontSize="6xl">🧩</Text>
            <Heading size="lg" color="gray.600">
              Blockly 编辑器
            </Heading>
            <Text color="gray.500" textAlign="center" maxW="md">
              这里将集成 Google Blockly 可视化编程编辑器
              <br />
              目前是占位区域，后续会添加完整的积木编程功能
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
