import {
  Box,
  Input,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ChildAccountCreate, ParentService } from "@/client"
import { Button } from "@/components/ui/button"
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
import { handleError } from "@/utils"
import useCustomToast from "@/hooks/useCustomToast"

const AddChildAccount = () => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChildAccountCreate>({
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
      full_name: "",
      nickname: "",
      gender: "boy",
      birth_month: "",
      avatar_url: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChildAccountCreate) =>
      ParentService.createChildAccount({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("宝贝账户创建成功")
      reset()
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["parentChildren"] })
    },
    onError: (err: any) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<ChildAccountCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
      <DialogTrigger asChild>
        <Button variant="solid" bg="primary" rounded={8}>
          ➕ 添加宝贝
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>添加宝贝账户</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Box display="flex" flexDirection="column" gap={4}>
              <Field label="登录用户名" required invalid={!!errors.username} errorText={errors.username?.message}>
                <Input
                  {...register("username", {
                    required: "用户名必填",
                    minLength: { value: 2, message: "至少2个字符" },
                    maxLength: { value: 30, message: "最多30个字符" },
                  })}
                  placeholder="宝贝的登录用户名"
                />
              </Field>
              <Field label="登录密码" required invalid={!!errors.password} errorText={errors.password?.message}>
                <Input
                  type="password"
                  {...register("password", {
                    required: "密码必填",
                    minLength: { value: 8, message: "至少8个字符" },
                  })}
                  placeholder="设置登录密码"
                />
              </Field>
              <Field label="昵称" required invalid={!!errors.nickname} errorText={errors.nickname?.message}>
                <Input
                  {...register("nickname", { required: "昵称必填" })}
                  placeholder="宝贝的昵称"
                />
              </Field>
              <Field label="真实姓名">
                <Input
                  {...register("full_name")}
                  placeholder="宝贝的真实姓名（选填）"
                />
              </Field>
              <Field label="性别" required>
                <select
                  {...register("gender", { required: "性别必选" })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <option value="boy">👦 男孩</option>
                  <option value="girl">👧 女孩</option>
                </select>
              </Field>
              <Field label="出生月份">
                <Input
                  {...register("birth_month")}
                  placeholder="如 2018-06"
                  type="month"
                />
              </Field>
            </Box>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" bg="primary" loading={isSubmitting}>
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddChildAccount
