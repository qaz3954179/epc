import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  Flex,
  Input,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import { ChildrenService, type ApiError, type ChildCreate } from "@/client"
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

const AddChild = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ChildCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      real_name: "",
      nickname: "",
      gender: "boy",
      birth_month: "",
      avatar_url: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChildCreate) =>
      ChildrenService.createChild({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("宝贝添加成功")
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

  const onSubmit: SubmitHandler<ChildCreate> = (data) => {
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
        <Button value="add-child" my={4}>
          <FaPlus fontSize="16px" />
          添加宝贝
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>添加宝贝</DialogTitle>
          </DialogHeader>
          <DialogBody>
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
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                取消
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              保存
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddChild
