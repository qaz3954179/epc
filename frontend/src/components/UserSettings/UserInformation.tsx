import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, type UserPublic, type UserUpdateMe, UsersService } from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import { Field } from "../ui/field"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()
  const { register, handleSubmit, reset, getValues, formState: { isSubmitting, errors, isDirty } } =
    useForm<UserPublic>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: { full_name: currentUser?.full_name, email: currentUser?.email },
    })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) => UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => showSuccessToast("资料更新成功！"),
    onError: (err: ApiError) => handleError(err),
    onSettled: () => queryClient.invalidateQueries(),
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => mutation.mutate(data)
  const onCancel = () => { reset(); setEditMode(false) }

  const inputStyle = {
    borderRadius: 12,
    borderColor: "purple.200",
    _focus: { borderColor: "purple.400", boxShadow: "0 0 0 1px #a18cd1" },
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} maxW="sm">
      <Heading size="sm" mb={6} color="gray.600">👤 基本信息</Heading>

      <Field label="姓名" mb={4}>
        {editMode ? (
          <Input {...register("full_name", { maxLength: 30 })} type="text" size="md" {...inputStyle} />
        ) : (
          <Text fontSize="md" py={2} color={!currentUser?.full_name ? "gray.400" : "gray.700"} truncate>
            {currentUser?.full_name || "未设置"}
          </Text>
        )}
      </Field>

      <Field label="邮箱" invalid={!!errors.email} errorText={errors.email?.message} mb={6}>
        {editMode ? (
          <Input
            {...register("email", { required: "邮箱不能为空", pattern: emailPattern })}
            type="email" size="md" {...inputStyle}
          />
        ) : (
          <Text fontSize="md" py={2} color="gray.700" truncate>{currentUser?.email}</Text>
        )}
      </Field>

      <Flex gap={3}>
        <Button
          type={editMode ? "submit" : "button"}
          loading={isSubmitting}
          disabled={editMode ? !isDirty || !getValues("email") : false}
          onClick={editMode ? undefined : () => setEditMode(true)}
          borderRadius={12} px={6}
          bg="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
          color="white" fontWeight="bold" _hover={{ opacity: 0.9 }}
        >
          {editMode ? "💾 保存" : "✏️ 编辑"}
        </Button>
        {editMode && (
          <Button
            variant="outline" borderRadius={12} px={6}
            onClick={onCancel} disabled={isSubmitting}
            borderColor="gray.200" color="gray.500"
          >
            取消
          </Button>
        )}
      </Flex>
    </Box>
  )
}

export default UserInformation
