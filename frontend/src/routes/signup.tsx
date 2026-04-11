import { Container, Flex, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
  useSearch,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail, FiUser } from "react-icons/fi"

import type { UserRegister } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils"
import Logo from "/assets/images/logo.svg"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  validateSearch: (search: Record<string, unknown>) => ({
    ref: (search.ref as string) || "",
  }),
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

function SignUp() {
  const { ref: referralCode } = useSearch({ from: "/signup" })
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      referral_code: referralCode || "",
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    if (referralCode && !data.referral_code) {
      data.referral_code = referralCode
    }
    signUpMutation.mutate(data)
  }

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
        <Container
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          h="100vh"
          maxW="sm"
          alignItems="stretch"
          justifyContent="center"
          gap={4}
          centerContent
        >
          <Image
            src={Logo}
            alt="Education Rewards Plan of Children"
            height="auto"
            maxW="2xs"
            alignSelf="center"
            mb={2}
          />
          <Text textAlign="center" fontSize="xl" fontWeight="bold" color="gray.700" mb={2}>
            👨‍👩‍👧 家长注册
          </Text>
          <Text textAlign="center" fontSize="sm" color="gray.500" mb={4}>
            注册后可以为宝贝创建账户、管理任务和奖品
          </Text>
          <Field
            invalid={!!errors.full_name}
            errorText={errors.full_name?.message}
          >
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="full_name"
                minLength={2}
                {...register("full_name", {
                  required: "姓名必填",
                })}
                placeholder="您的姓名"
                type="text"
              />
            </InputGroup>
          </Field>

          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiMail />}>
              <Input
                id="email"
                {...register("email", {
                  required: "邮箱必填",
                  pattern: emailPattern,
                })}
                placeholder="邮箱地址"
                type="email"
              />
            </InputGroup>
          </Field>
          <PasswordInput
            type="password"
            startElement={<FiLock />}
            {...register("password", passwordRules())}
            placeholder="设置密码"
            errors={errors}
          />
          <PasswordInput
            type="confirm_password"
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues))}
            placeholder="确认密码"
            errors={errors}
          />
          <Button variant="solid" type="submit" loading={isSubmitting} bg="primary" rounded={8}>
            注册
          </Button>
          <Text>
            已有账号?{" "}
            <RouterLink to="/login" className="main-link">
              去登录
            </RouterLink>
          </Text>
        </Container>
      </Flex>
    </>
  )
}

export default SignUp
