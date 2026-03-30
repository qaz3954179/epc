import { Container, Image, Input, Text } from "@chakra-ui/react"
import {
    Link as RouterLink,
    createFileRoute,
    redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/logo.svg"
import { emailPattern, passwordRules } from "../utils"

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

function Login() {
    const { loginMutation, error, resetError } = useAuth()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AccessToken>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            username: "",
            password: "",
        },
    })

    const onSubmit: SubmitHandler<AccessToken> = async (data) => {
        if (isSubmitting) return

        resetError()

        try {
            await loginMutation.mutateAsync(data)
        } catch {
            // error is handled by useAuth hook
        }
    }

    return (
        <Container
            h="100vh"
            alignItems="stretch"
            justifyContent="center"
            background={'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 99%)'}
        >
            <Container
                as="form"
                onSubmit={handleSubmit(onSubmit)}
                h="630px"
                width={'480px'}
                alignItems="stretch"
                justifyContent="center"
                alignSelf={"center"}
                position={'absolute'}
                left={'50%'}
                top={'50%'}
                borderRadius={"16px"}
                padding={"32px"}
                marginTop={'-315px'}
                marginLeft={'-240px'}
                background={"linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #FFFFFF"}
                boxShadow={'0px 8px 10px -6px rgba(0, 0, 0, 0.1),0px 20px 25px -5px rgba(0, 0, 0, 0.1)'}
                centerContent
                gap={6}
            >
                <Container
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={"stretch"}
                    justifyContent={"center"}
                    alignSelf={'center'}
                >
                    <Image
                        src={Logo}
                        alt="Education Rewards Plan of Children"
                        height={'48px'}
                        fit={"contain"}
                    />
                    <Text textAlign={"center"} color={'#4B5563'} mb={2}>欢迎登录学习币后台管理系统</Text>
                </Container>
                <Field
                    invalid={!!errors.username}
                    errorText={errors.username?.message || !!error}
                >
                    <InputGroup w="100%" startElement={<FiUser />}>
                        <Input
                            id="username"
                            {...register("username", {
                                required: "用户名必填",
                                pattern: emailPattern,
                            })}
                            borderRadius={"8px"}
                            placeholder="请输入用户名"
                            type="email"
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
                />
                <RouterLink to="/recover-password" className="main-link">
                    忘记密码?
                </RouterLink>
                <Button variant="solid" type="submit" loading={isSubmitting} size="md" rounded={8} bg={'primary'}>
                    登录
                </Button>
                <Text>
                    尚未注册?{" "}
                    <RouterLink to="/signup" className="main-link">
                        注册
                    </RouterLink>
                </Text>
            </Container>
        </Container>
    )
}
