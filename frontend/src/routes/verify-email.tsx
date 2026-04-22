import { Container, Image, Input, Text, VStack } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiMail } from "react-icons/fi"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/erpc.png"

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmail,
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface VerifyEmailForm {
  code: string
}

function VerifyEmail() {
  const { email } = Route.useSearch()
  const navigate = useNavigate()
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailForm>({
    mode: "onBlur",
    defaultValues: {
      code: "",
    },
  })

  const onSubmit: SubmitHandler<VerifyEmailForm> = async (data) => {
    if (isSubmitting) return

    try {
      const response = await fetch("/api/v1/users/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "验证失败")
      }

      toaster.create({
        title: "验证成功",
        description: "您的邮箱已验证，请登录",
        type: "success",
      })

      navigate({ to: "/login" })
    } catch (error: any) {
      toaster.create({
        title: "验证失败",
        description: error.message || "验证码错误或已过期",
        type: "error",
      })
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending) return

    setIsResending(true)

    try {
      const response = await fetch(
        `/api/v1/users/resend-verification?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "发送失败")
      }

      toaster.create({
        title: "发送成功",
        description: "验证码已重新发送到您的邮箱",
        type: "success",
      })

      // 开始 60 秒倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toaster.create({
        title: "发送失败",
        description: error.message || "请稍后重试",
        type: "error",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Container
      h="100vh"
      alignItems="stretch"
      justifyContent="center"
      background={
        "linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 99%)"
      }
    >
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        h="630px"
        width={"480px"}
        alignItems="stretch"
        justifyContent="center"
        alignSelf={"center"}
        position={"absolute"}
        left={"50%"}
        top={"50%"}
        borderRadius={"16px"}
        padding={"32px"}
        marginTop={"-315px"}
        marginLeft={"-240px"}
        background={
          "linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #FFFFFF"
        }
        boxShadow={
          "0px 8px 10px -6px rgba(0, 0, 0, 0.1),0px 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }
        centerContent
        gap={6}
      >
        <VStack gap={4} width="100%">
          <Image
            src={Logo}
            alt="Education Rewards Plan of Children"
            height={"60px"}
            width={"60px"}
            objectFit={"contain"}
          />
          <Text textAlign={"center"} color={"#4B5563"} fontSize="lg" fontWeight="medium">
            验证您的邮箱
          </Text>
          <Text textAlign={"center"} color={"#6B7280"} fontSize="sm">
            我们已向 <strong>{email}</strong> 发送了一封包含 6 位验证码的邮件
          </Text>
        </VStack>

        <Field
          invalid={!!errors.code}
          errorText={errors.code?.message}
          helperText="请输入 6 位数字验证码"
        >
          <InputGroup w="100%" startElement={<FiMail />}>
            <Input
              id="code"
              {...register("code", {
                required: "验证码必填",
                pattern: {
                  value: /^\d{6}$/,
                  message: "请输入 6 位数字验证码",
                },
              })}
              borderRadius={"8px"}
              placeholder="请输入验证码"
              type="text"
              maxLength={6}
              textAlign="center"
              fontSize="2xl"
              letterSpacing="0.5em"
            />
          </InputGroup>
        </Field>

        <Button
          variant="solid"
          type="submit"
          loading={isSubmitting}
          size="md"
          rounded={8}
          bg={"primary"}
          width="100%"
        >
          验证邮箱
        </Button>

        <VStack gap={2} width="100%">
          <Text fontSize="sm" color={"#6B7280"}>
            没有收到验证码？
          </Text>
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            loading={isResending}
            size="sm"
          >
            {countdown > 0 ? `${countdown}秒后重新发送` : "重新发送验证码"}
          </Button>
        </VStack>

        <Text fontSize="sm" color={"#6B7280"}>
          已经验证？{" "}
          <RouterLink to="/login" className="main-link">
            立即登录
          </RouterLink>
        </Text>
      </Container>
    </Container>
  )
}

export default VerifyEmail
