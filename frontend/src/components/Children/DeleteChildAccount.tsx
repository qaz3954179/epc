import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ParentService } from "@/client"
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
import { handleError } from "@/utils"
import useCustomToast from "@/hooks/useCustomToast"

interface DeleteChildAccountProps {
  childId: string
}

const DeleteChildAccount = ({ childId }: DeleteChildAccountProps) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => ParentService.deleteChildAccount({ childId }),
    onSuccess: () => {
      showSuccessToast("宝贝账户已删除")
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["parentChildren"] })
    },
    onError: (err: any) => {
      handleError(err)
    },
  })

  return (
    <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" colorPalette="red" flex={1}>
          🗑️ 删除
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <Text>确定要删除这个宝贝账户吗？删除后该宝贝将无法登录，相关数据也会被清除。此操作不可撤销。</Text>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            colorPalette="red"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteChildAccount
