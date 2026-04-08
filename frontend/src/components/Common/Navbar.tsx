import { Flex, Image, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import Logo from "/assets/images/logo_epc.svg"
import UserMenu from "./UserMenu"

function Navbar() {
  return (
    <Flex
      display={{ base: "none", md: "flex" }}
      justify="space-between"
      align="center"
      position="sticky"
      top={0}
      zIndex={10}
      w="100%"
      px={6}
      py={3}
      bg="white"
      borderBottom="1px solid"
      borderBottomColor="purple.100"
      boxShadow="0 2px 12px rgba(124,58,237,0.06)"
    >
      <Link to="/">
        <Flex align="center" gap={2} cursor="pointer">
          <Image src={Logo} alt="Logo" maxW="40px" />
          <Text fontSize="xl" fontWeight="black"
            bgGradient="to-r" gradientFrom="purple.500" gradientTo="pink.400"
            bgClip="text"
          >
            神奇学习城 ✨
          </Text>
        </Flex>
      </Link>
      <UserMenu />
    </Flex>
  )
}

export default Navbar
