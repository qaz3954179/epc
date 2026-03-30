import { Flex, Image, useBreakpointValue, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/logo_epc.svg"
import UserMenu from "./UserMenu"

function Navbar() {
    const display = useBreakpointValue({ base: "none", md: "flex" })

    return (
        <Flex
            display={display}
            justify="space-between"
            position="sticky"
            color="white"
            align="center"
            bg="bg.white"
            w="100%"
            top={0}
            px={4}
            py={2}
        >
            <Link to="/">
                <Flex align="center" cursor="pointer">
                    <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
                    <Text fontSize="lg" color={"primary"} fontWeight={"bold"}>学习币管理系统</Text>
                </Flex>
            </Link>
            <Flex gap={2} alignItems="center">
                <UserMenu />
            </Flex>
        </Flex>
    )
}

export default Navbar
