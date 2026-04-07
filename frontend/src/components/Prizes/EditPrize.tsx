import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import { type ApiError, type PrizePublic, PrizesService } from "@/client"
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

interface EditPrizeProps {
  prize: PrizePublic
}

interface PrizeUpdateForm {
  name: string
  description?: string
  image_url?: string
  product_url?: string
  price?: number
  coins_cost: number
  stock: number
}

const EditPrize = ({ prize }: EditPrizeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrizeUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: prize.name,
      description: prize.description ?? undefined,
      image_url: prize.image_url ?? undefined,
      product_url: prize.product_url ?? undefined,
      price: prize.price ?? undefined,
      coins_cost: prize.coins_cost,
      stock: prize.stock,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PrizeUpdateForm) =>
      PrizesService.updatePrize({ id: prize.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("奖品更新成功")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] })
    },
  })

  const onSubmit: SubmitHandler<PrizeUpdateForm> = async (data) => {
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
            <DialogTitle>编辑奖品</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>修改奖品信息</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="奖品名称"
              >
                <Input
                  {...register("name", { required: "请输入奖品名称" })}
                  placeholder="奖品名称"
                />
              </Field>

              <Field label="描述">
                <Input
                  {...register("description")}
                  placeholder="奖品描述（选填）"
                />
              </Field>

              <Field label="商品图片链接">
                <Input
                  {...register("image_url")}
                  placeholder="https://..."
                />
              </Field>

              <Field label="商品链接">
                <Input
                  {...register("product_url")}
                  placeholder="淘宝/天猫商品链接"
                />
              </Field>

              <Flex gap={4} w="100%">
                <Field label="商品价格（元）" flex={1}>
                  <Input
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </Field>

                <Field
                  required
                  invalid={!!errors.coins_cost}
                  errorText={errors.coins_cost?.message}
                  label="兑换所需学习币"
                  flex={1}
                >
                  <Input
                    {...register("coins_cost", {
                      required: "请输入所需学习币",
                      valueAsNumber: true,
                    })}
                    placeholder="100"
                    type="number"
                  />
                </Field>
              </Flex>

              <Field label="库存数量">
                <Input
                  {...register("stock", { valueAsNumber: true })}
                  placeholder="0"
                  type="number"
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

export default EditPrize
