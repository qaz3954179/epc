import { Box, Input } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ChildAccountPublic, type ChildAccountUpdate, ParentService } from "@/client"
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

interface EditChildAccountProps {
  child: ChildAccountPublic
}

const EditChildAccount = ({ child }: EditChildAccountProps) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildAccountUpdate>({
    mode: "onBlur",
    defaultValues: {
      username: child.username || "",
      nickname: child.nickname || "",
      full_name: child.full_name || "",
      gender: child.gender || "boy",
      birth_month: child.birth_month || "",
      avatar_url: child.avatar_url || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChildAccountUpdate) =>
      ParentService.updateChildAccount({ childId: child.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("宝贝信息已更新")
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["parentChildren"] })
    },
    onError: (err: any) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<ChildAccountUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" flex={1}>
          ✏️ 编辑
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>编辑宝贝信息</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Box display="flex" flexDirection="column" gap={4}>
              <Field label="登录用户名">
                <Input {...register("username")} placeholder="登录用户名" />
              </Field>
              <Field label="重置密码（留空不修改）">
                <Input
                  type="password"
                  {...register("password")}
                  placeholder="新密码（选填）"
                />
              </Field>
              <Field label="昵称">
                <Input {...register("nickname")} placeholder="宝贝昵称" />
              </Field>
              <Field label="真实姓名">
                <Input {...register("full_name")} placeholder="真实姓名" />
              </Field>
              <Field label="性别">
                <select
                  {...register("gender")}
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
                <Input {...register("birth_month")} type="month" />
              </Field>
            </Box>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" bg="primary" loading={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditChildAccount
