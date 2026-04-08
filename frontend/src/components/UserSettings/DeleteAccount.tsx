import { Box, Heading, Text } from "@chakra-ui/react"
import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  return (
    <Box maxW="sm">
      <Heading size="sm" mb={4} color="red.500">⚠️ 危险区域</Heading>
      <Box
        bg="red.50" borderRadius={16}
        border="1px solid" borderColor="red.100"
        p={5} mb={5}
      >
        <Text color="red.600" fontSize="sm">
          永久删除你的账户及所有相关数据，此操作不可撤销。
        </Text>
      </Box>
      <DeleteConfirmation />
    </Box>
  )
}

export default DeleteAccount
