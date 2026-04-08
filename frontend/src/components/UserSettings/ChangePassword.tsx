import { Box, Button, Heading, VStack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import { type ApiError, type UpdatePassword, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"
import { PasswordInput } from "../ui/password-input"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const { showSuccessToast } = useCustomToast()
  const { register, handleSubmit, reset, getValues, formState: { errors, isValid, isSubmitting } } =
    useForm<UpdatePasswordForm>({ mode: "onBlur", criteriaMode: "all" })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) => UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => { showSuccessToast("密码修改成功！"); reset() },
    onError: (err: ApiError) => handleError(err),
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => mutation.mutate(data)

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} maxW="sm">
      <Heading size="sm" mb={6} color="gray.600">🔒 修改密码</Heading>
      <VStack gap={4} mb={6}>
        <PasswordInput type="current_password" startElement={<FiLock />}
          {...register("current_password", passwordRules())} placeholder="当前密码" errors={errors} />
        <PasswordInput type="new_password" startElement={<FiLock />}
          {...register("new_password", passwordRules())} placeholder="新密码" errors={errors} />
        <PasswordInput type="confirm_password" startElement={<FiLock />}
          {...register("confirm_password", confirmPasswordRules(getValues))} placeholder="确认新密码" errors={errors} />
      </VStack>
      <Button
        type="submit" loading={isSubmitting} disabled={!isValid}
        borderRadius={12} px={6}
        bg="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
        color="white" fontWeight="bold" _hover={{ opacity: 0.9 }}
      >
        💾 保存密码
      </Button>
    </Box>
  )
}

export default ChangePassword
