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
import Logo from "/assets/images/erpc.png"
import { passwordRules } from "../utils"
import { getCasdoorConfig, buildCasdoorLoginUrl, type CasdoorConfig } from "@/lib/casdoor"
import { getWeChatConfig, buildWeChatLoginUrl, type WeChatConfig } from "@/lib/wechat"

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

/* ── CSS 动画 ── */
const breathe = `
    @keyframes breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
    }
`
const floatSlow = `
    @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(5deg); }
    }
`
const floatMed = `
    @keyframes float-med {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-18px) rotate(-8deg); }
    }
`
const floatFast = `
    @keyframes float-fast {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(12deg); }
    }
`

/* ── 家长登录表单 ── */
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

/* ── 宝贝登录表单 ── */
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

/* ── 社交登录按钮 ── */
function SocialLoginButtons() {
    const [casdoorConfig, setCasdoorConfig] = useState<CasdoorConfig | null>(null)
    const [wechatConfig, setWechatConfig] = useState<WeChatConfig | null>(null)

    useEffect(() => {
        getCasdoorConfig().then(setCasdoorConfig).catch(() => {})
        getWeChatConfig().then(setWechatConfig).catch(() => {})
    }, [])

    const handleSocialLogin = () => {
        if (!casdoorConfig) return
        const redirectUri = `${window.location.origin}/oauth/callback`
        window.location.href = buildCasdoorLoginUrl(casdoorConfig, redirectUri)
    }

    const handleWeChatLogin = async () => {
        try {
            const redirectUri = `${window.location.origin}/oauth/callback`
            const url = await buildWeChatLoginUrl(redirectUri)
            if (url) {
                window.location.href = url
            }
        } catch (e) {
            console.error("WeChat login failed:", e)
        }
    }

    const showWeChat = wechatConfig?.enabled

    if (!casdoorConfig?.client_id && !showWeChat) return null

    return (
        <Box w="100%">
            <Flex align="center" gap={3} my={2}>
                <Separator flex={1} />
                <Text fontSize="13px" color="#9CA3AF" whiteSpace="nowrap">其他登录方式</Text>
                <Separator flex={1} />
            </Flex>
            <Flex justify="center" gap={4} mt={3}>
                {showWeChat && (
                    <IconButton
                        aria-label="微信登录"
                        variant="outline"
                        rounded="full"
                        size="lg"
                        borderColor="#E5E7EB"
                        transition="all 0.2s"
                        _hover={{ borderColor: "#07C160", bg: "rgba(7, 193, 96, 0.05)", transform: "translateY(-2px)" }}
                        onClick={handleWeChatLogin}
                    >
                        <Text fontSize="20px">💬</Text>
                    </IconButton>
                )}
                {casdoorConfig?.client_id && (
                    <>
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
                    </>
                )}
            </Flex>
        </Box>
    )
}

/* ═══════════════════════════════════════════════
 *  登录页 — 左右分栏布局
 * ═══════════════════════════════════════════════ */
function Login() {
    return (
        <>
            {/* 注入 CSS keyframes */}
            <style>{breathe}{floatSlow}{floatMed}{floatFast}</style>

            <Flex h="100vh" w="100vw" overflow="hidden">

                {/* ────── 左栏：品牌展示 ────── */}
                {/* 移动端隐藏 */}
                <Box
                    display={{ base: "none", md: "flex" }}
                    flex="1.2"
                    bg="linear-gradient(160deg, #FFF8F0 0%, #FFF0E6 30%, #F5F0FF 60%, #F0F8FF 100%)"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    position="relative"
                    overflow="hidden"
                    gap={4}
                    px={8}
                >
                    {/* 装饰元素 */}
                    <Box position="absolute" top="12%" left="15%" fontSize="4xl" opacity={0.2}
                        animation="float-slow 6s ease-in-out infinite">⭐</Box>
                    <Box position="absolute" top="25%" right="18%" fontSize="3xl" opacity={0.15}
                        animation="float-med 5s ease-in-out infinite">🎯</Box>
                    <Box position="absolute" bottom="22%" left="22%" fontSize="3xl" opacity={0.18}
                        animation="float-fast 4.5s ease-in-out infinite">🏆</Box>
                    <Box position="absolute" bottom="15%" right="25%" fontSize="2xl" opacity={0.12}
                        animation="float-slow 7s ease-in-out infinite">✨</Box>
                    <Box position="absolute" top="55%" left="8%" fontSize="2xl" opacity={0.1}
                        animation="float-med 5.5s ease-in-out infinite">🌟</Box>

                    {/* 大 Logo */}
                    <Image
                        src={Logo}
                        alt="ERPC 学习城"
                        h={{ md: "200px", xl: "240px" }}
                        w={{ md: "200px", xl: "240px" }}
                        objectFit="contain"
                        animation="breathe 4s ease-in-out infinite"
                    />

                    {/* Slogan */}
                    <Text
                        textAlign="center"
                        fontSize={{ md: "xl", lg: "2xl" }}
                        fontWeight="800"
                        color="#2D3748"
                        lineHeight="1.4"
                        maxW="sm"
                    >
                        不吼不骂
                        <Text as="span" color="#FF6B35">，</Text>
                        <br />
                        让孩子
                        <Text as="span" color="#FF6B35">自己抢着学</Text>
                    </Text>

                    <Text fontSize="sm" color="#9CA3AF" textAlign="center">
                        1000+ 家庭在用 · 游戏化学习币系统
                    </Text>

                    {/* 底部英文 */}
                    <Box position="absolute" bottom={6}>
                        <Text fontSize="xs" color="#CBD5E0" letterSpacing="1px">
                            Education Rewards Plan of Children
                        </Text>
                    </Box>
                </Box>

                {/* ────── 右栏：登录表单 ────── */}
                <Box
                    flex="1"
                    bg="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={{ base: 6, md: 8 }}
                    py={{ base: 8, md: 6 }}
                    overflowY="auto"
                >
                    <Container
                        maxW="420px"
                        w="100%"
                        alignItems="stretch"
                        justifyContent="center"
                        gap={6}
                        centerContent
                    >
                        {/* 移动端 Logo */}
                        <Box display={{ base: "block", md: "none" }} textAlign="center" mb={2}>
                            <Image
                                src={Logo}
                                alt="ERPC 学习城"
                                h="110px"
                                w="110px"
                                objectFit="contain"
                                mx="auto"
                            />
                        </Box>

                        {/* 欢迎语 */}
                        <Text textAlign="center" fontSize="2xl" fontWeight="800" color="#2D3748" mb={1}>
                            欢迎回来 👋
                        </Text>
                        <Text textAlign="center" fontSize="sm" color="#9CA3AF" mb={2}>
                            登录继续
                        </Text>

                        {/* Tabs */}
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

                        {/* 社交登录 */}
                        <SocialLoginButtons />
                    </Container>
                </Box>
            </Flex>
        </>
    )
}

export default Login
