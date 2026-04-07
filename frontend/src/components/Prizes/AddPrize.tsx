import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import { AiOutlineLink } from "react-icons/ai"

import { type PrizeCreate, PrizesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"

const AddPrize = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [taobaoUrl, setTaobaoUrl] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PrizeCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
      product_url: "",
      price: undefined,
      coins_cost: 100,
      stock: 0,
    },
  })

  const handleParseTaobaoUrl = async () => {
    if (!taobaoUrl.trim()) return
    setIsParsing(true)
    try {
      const info = await PrizesService.parseTaobaoUrl({ url: taobaoUrl })
      setValue("name", info.name, { shouldValidate: true })
      if (info.price) setValue("price", info.price)
      if (info.image_url) setValue("image_url", info.image_url)
      setValue("product_url", taobaoUrl)
      showSuccessToast("商品信息已自动填充")
    } catch (err) {
      showErrorToast("解析失败，请手动填写商品信息")
    } finally {
      setIsParsing(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (data: PrizeCreate) =>
      PrizesService.createPrize({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("奖品添加成功")
      reset()
      setTaobaoUrl("")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] })
    },
  })

  const onSubmit: SubmitHandler<PrizeCreate> = (data) => {
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
        <Button value="add-prize" my={4}>
          <FaPlus fontSize="16px" />
          添加奖品
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>添加奖品</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {/* 淘宝链接自动填充 */}
            <Flex
              bg="blue.50"
              p={3}
              borderRadius={12}
              mb={4}
              gap={2}
              align="end"
            >
              <Field label="粘贴淘宝/天猫链接自动填充" flex={1}>
                <Input
                  placeholder="https://item.taobao.com/..."
                  value={taobaoUrl}
                  onChange={(e) => setTaobaoUrl(e.target.value)}
                  size="sm"
                />
              </Field>
              <Button
                size="sm"
                colorPalette="blue"
                onClick={handleParseTaobaoUrl}
                loading={isParsing}
                disabled={!taobaoUrl.trim()}
              >
                <AiOutlineLink />
                解析
              </Button>
            </Flex>

            <Text mb={4} color="gray.500" fontSize="sm">
              也可以直接手动填写以下信息
            </Text>

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

export default AddPrize
