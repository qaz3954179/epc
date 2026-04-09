import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import { ChildrenService, type ApiError, type ChildPublic, type ChildUpdate } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"

interface ChildUpdateForm {
  real_name: string
  nickname: string
  gender: "boy" | "girl"
  birth_month?: string
  avatar_url?: string
}

const EditChild = ({ child }: { child: ChildPublic }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChildUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      real_name: child.real_name,
      nickname: child.nickname,
      gender: child.gender,
      birth_month: child.birth_month ?? "",
      avatar_url: child.avatar_url ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChildUpdateForm) =>
      ChildrenService.updateChild({ id: child.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("宝贝信息更新成功")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] })
    },
  })

  const onSubmit: SubmitHandler<ChildUpdateForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FaExchangeAlt fontSize="14px" />
          编辑
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>编辑宝贝</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>修改宝贝信息</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.real_name}
                errorText={errors.real_name?.message}
                label="真实姓名（登录使用）"
              >
                <Input
                  {...register("real_name", { required: "请输入真实姓名" })}
                  placeholder="真实姓名"
                />
              </Field>

              <Field
                required
                invalid={!!errors.nickname}
                errorText={errors.nickname?.message}
                label="昵称"
              >
                <Input
                  {...register("nickname", { required: "请输入昵称" })}
                  placeholder="昵称"
                />
              </Field>

              <Field
                required
                invalid={!!errors.gender}
                errorText={errors.gender?.message}
                label="性别"
              >
                <select
                  {...register("gender", { required: "请选择性别" })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="boy">男孩</option>
                  <option value="girl">女孩</option>
                </select>
              </Field>

              <Field label="出生年月">
                <Input
                  {...register("birth_month")}
                  placeholder="2020-01"
                  type="month"
                />
              </Field>

              <Field label="头像链接（选填）">
                <Input
                  {...register("avatar_url")}
                  placeholder="https://..."
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                保存
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditChild
