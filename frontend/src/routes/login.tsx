import { Container, Image, Input, Text, Tabs, Box, Separator, Flex, IconButton } from "@chakra-ui/react"
import {
    Link as RouterLink,
    createFileRoute,
    redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"
import { useState, useEffect } from "react"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/logo.svg"
import { passwordRules } from "../utils"
import { getCasdoorConfig, buildCasdoorLoginUrl, type CasdoorConfig } from "@/lib/casdoor"

export const Route = createFileRoute("/login")({
    component: Login,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({
                to: "/",
            })
        }
    },
})

function ParentLoginForm() {
    const { loginMutation, error, resetError } = useAuth()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AccessToken>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: { username: "", password: "" },
    })

    const onSubmit: SubmitHandler<AccessToken> = async (data) => {
        if (isSubmitting) return
        resetError()
        try { await loginMutation.mutateAsync(data) } catch {}
    }

    return (
        <Container as="form" onSubmit={handleSubmit(onSubmit)} gap={6} p={0} alignItems="stretch">
            <Field invalid={!!errors.username} errorText={errors.username?.message || !!error}>
                <InputGroup w="100%" startElement={<FiUser />}>
                    <Input
                        id="username"
                        {...register("username", { required: "邮箱必填" })}
                        borderRadius={"8px"}
                        placeholder="请输入邮箱"
                        type="email"
                        h="48px"
                        fontSize="15px"
                        transition="all 0.2s"
                        _hover={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                        _focus={{ borderColor: "primary", boxShadow: "0 0 0 2px rgba(255, 107, 53, 0.2)" }}
                    />
                </InputGroup>
            </Field>
            <PasswordInput
                type="password"
                startElement={<FiLock />}
                borderRadius={8}
                {...register("password", passwordRules())}
                placeholder="请输入密码"
                errors={errors}
                h="48px"
                fontSize="15px"
                transition="all 0.2s"
                _hover={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 2px rgba(255, 107, 53, 0.2)" }}
            />
            <RouterLink to="/recover-password" className="main-link" style={{ marginTop: '-8px', fontSize: '14px' }}>
                忘记密码?
            </RouterLink>
            <Button 
                variant="solid" 
                type="submit" 
                loading={isSubmitting} 
                size="lg" 
                rounded={8} 
                bg={'primary'}
                h="48px"
                fontSize="16px"
                fontWeight="600"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)" }}
                _active={{ transform: "translateY(0)" }}
            >
                登录
            </Button>
            <Text textAlign="center" fontSize="14px" color="#6B7280" mt={2}>
                尚未注册?{" "}
                <RouterLink to="/signup" className="main-link">
                    家长注册
                </RouterLink>
            </Text>
        </Container>
    )
}

function ChildLoginForm() {
    const { loginMutation, error, resetError } = useAuth()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AccessToken>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: { username: "", password: "" },
    })

    const onSubmit: SubmitHandler<AccessToken> = async (data) => {
        if (isSubmitting) return
        resetError()
        try { await loginMutation.mutateAsync(data) } catch {}
    }

    return (
        <Container as="form" onSubmit={handleSubmit(onSubmit)} gap={6} p={0} alignItems="stretch">
            <Field invalid={!!errors.username} errorText={errors.username?.message || !!error}>
                <InputGroup w="100%" startElement={<FiUser />}>
                    <Input
                        id="child-username"
                        {...register("username", { required: "用户名必填" })}
                        borderRadius={"8px"}
                        placeholder="请输入用户名"
                        type="text"
                        h="48px"
                        fontSize="15px"
                        transition="all 0.2s"
                        _hover={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                        _focus={{ borderColor: "primary", boxShadow: "0 0 0 2px rgba(255, 107, 53, 0.2)" }}
                    />
                </InputGroup>
            </Field>
            <PasswordInput
                type="password"
                startElement={<FiLock />}
                borderRadius={8}
                {...register("password", passwordRules())}
                placeholder="请输入密码"
                errors={errors}
                h="48px"
                fontSize="15px"
                transition="all 0.2s"
                _hover={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 2px rgba(255, 107, 53, 0.2)" }}
            />
            <Button 
                variant="solid" 
                type="submit" 
                loading={isSubmitting} 
                size="lg" 
                rounded={8} 
                bg={'primary'}
                h="48px"
                fontSize="16px"
                fontWeight="600"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)" }}
                _active={{ transform: "translateY(0)" }}
            >
                宝贝登录
            </Button>
        </Container>
    )
}

/**
 * 社交登录按钮组
 */
function SocialLoginButtons() {
    const [config, setConfig] = useState<CasdoorConfig | null>(null)

    useEffect(() => {
        getCasdoorConfig().then(setConfig).catch(() => {})
    }, [])

    const handleSocialLogin = () => {
        if (!config) return
        const redirectUri = `${window.location.origin}/oauth/callback`
        window.location.href = buildCasdoorLoginUrl(config, redirectUri)
    }

    if (!config || !config.client_id) return null

    return (
        <Box w="100%">
            <Flex align="center" gap={3} my={2}>
                <Separator flex={1} />
                <Text fontSize="13px" color="#9CA3AF" whiteSpace="nowrap">其他登录方式</Text>
                <Separator flex={1} />
            </Flex>
            <Flex justify="center" gap={4} mt={3}>
                <IconButton
                    aria-label="微信登录"
                    variant="outline"
                    rounded="full"
                    size="lg"
                    borderColor="#E5E7EB"
                    transition="all 0.2s"
                    _hover={{ borderColor: "#07C160", bg: "rgba(7, 193, 96, 0.05)", transform: "translateY(-2px)" }}
                    onClick={handleSocialLogin}
                >
                    <Text fontSize="20px">💬</Text>
                </IconButton>
                <IconButton
                    aria-label="QQ登录"
                    variant="outline"
                    rounded="full"
                    size="lg"
                    borderColor="#E5E7EB"
                    transition="all 0.2s"
                    _hover={{ borderColor: "#12B7F5", bg: "rgba(18, 183, 245, 0.05)", transform: "translateY(-2px)" }}
                    onClick={handleSocialLogin}
                >
                    <Text fontSize="20px">🐧</Text>
                </IconButton>
                <IconButton
                    aria-label="Google登录"
                    variant="outline"
                    rounded="full"
                    size="lg"
                    borderColor="#E5E7EB"
                    transition="all 0.2s"
                    _hover={{ borderColor: "#4285F4", bg: "rgba(66, 133, 244, 0.05)", transform: "translateY(-2px)" }}
                    onClick={handleSocialLogin}
                >
                    <Text fontSize="20px">🔍</Text>
                </IconButton>
            </Flex>
        </Box>
    )
}

function Login() {
    return (
        <Container
            h="100vh"
            alignItems="stretch"
            justifyContent="center"
            background={'linear-gradient(135deg, #FFF5EE 0%, #FFF0E6 30%, #F5F0FF 70%, #F0F8FF 100%)'}
        >
            <Container
                width={'440px'}
                alignItems="stretch"
                justifyContent="center"
                alignSelf={"center"}
                position={'absolute'}
                left={'50%'}
                top={'50%'}
                borderRadius={"20px"}
                padding={"40px"}
                transform={'translate(-50%, -50%)'}
                background={"rgba(255, 255, 255, 0.95)"}
                backdropFilter={"blur(20px)"}
                boxShadow={'0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -8px rgba(255, 107, 53, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)'}
                centerContent
                gap={8}
            >
                <Container
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={"stretch"}
                    justifyContent={"center"}
                    alignSelf={'center'}
                    gap={3}
                >
                    <Image
                        src={Logo}
                        alt="Education Rewards Plan of Children"
                        height={'52px'}
                        fit={"contain"}
                    />
                    <Text textAlign={"center"} color={'#6B7280'} fontSize="15px" letterSpacing="0.5px">
                        欢迎登录学习币系统
                    </Text>
                </Container>
                <Tabs.Root defaultValue="parent" variant="line" colorPalette="orange" w="100%">
                    <Tabs.List mb={6}>
                        <Tabs.Trigger value="parent" flex={1} justifyContent="center" fontSize="15px" fontWeight="500" py={3}>
                            👨‍👩‍👧 家长登录
                        </Tabs.Trigger>
                        <Tabs.Trigger value="child" flex={1} justifyContent="center" fontSize="15px" fontWeight="500" py={3}>
                            🧒 宝贝登录
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="parent">
                        <ParentLoginForm />
                    </Tabs.Content>
                    <Tabs.Content value="child">
                        <ChildLoginForm />
                    </Tabs.Content>
                </Tabs.Root>
                <SocialLoginButtons />
            </Container>
        </Container>
    )
}
