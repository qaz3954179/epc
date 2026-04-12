import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  HStack,
  Select,
  Portal,
  createListCollection,
  NumberInput,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { AiOutlinePlus } from "react-icons/ai"

import { type ItemCreate, type ItemUpdate, type ItemPublic, ItemsService } from "@/client"
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
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Radio, RadioGroup } from "../ui/radio"

const categoryCollection = createListCollection({
  items: [
    { label: "日常任务", value: "daily" },
    { label: "模拟考试", value: "exam" },
    { label: "互动游戏", value: "game" },
    { label: "体能项目", value: "pe" },
  ],
})

interface AddTaskProps {
  defaultCategory?: string
  item?: ItemPublic
  children?: React.ReactNode
}

const AddTask = ({ defaultCategory, item, children }: AddTaskProps) => {
  const isEditMode = !!item
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: item?.title || "",
      description: item?.description || "",
      category: item?.category || defaultCategory || "daily",
      task_type: item?.task_type || "daily",
      target_count: item?.target_count ?? 1,
      coins_reward: item?.coins_reward ?? 10,
    },
  })

  useEffect(() => {
    if (isOpen && item) {
      reset({
        title: item.title,
        description: item.description || "",
        category: item.category || "daily",
        task_type: item.task_type || "daily",
        target_count: item.target_count ?? 1,
        coins_reward: item.coins_reward ?? 10,
      })
    }
  }, [isOpen, item, reset])

  const createMutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      ItemsService.createItem({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("任务创建成功")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      ItemsService.updateItem({ id: item!.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("任务更新成功")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const onSubmit: SubmitHandler<ItemCreate> = (data) => {
    if (isEditMode) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      {children ? (
        <span onClick={() => setIsOpen(true)} style={{ cursor: "pointer" }}>{children}</span>
      ) : (
        <Button
          colorPalette="blue"
          size="md"
          borderRadius={12}
          px={6}
          onClick={() => setIsOpen(true)}
          _hover={{ transform: "translateY(-1px)", shadow: "md" }}
          transition="all 0.2s"
        >
          <AiOutlinePlus /> 新建任务
        </Button>
      )}
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑任务" : "新建任务"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4} color="gray.500" fontSize="sm">
              {isEditMode ? "修改任务信息" : "填写任务信息，按分类创建任务"}
            </Text>
            <VStack gap={4} align="stretch">
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="任务名称"
              >
                <Input
                  {...register("title", {
                    required: "请输入任务名称",
                  })}
                  placeholder="请输入任务名称"
                  borderRadius={8}
                />
              </Field>

              <Field label="任务分类" required>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "请选择任务分类" }}
                  render={({ field }) => (
                    <Select.Root
                      collection={categoryCollection}
                      value={field.value ? [field.value] : []}
                      onValueChange={({ value }) => field.onChange(value[0])}
                    >
                      <Select.Control>
                        <Select.Trigger borderRadius={8}>
                          <Select.ValueText placeholder="请选择任务分类" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner zIndex={1500}>
                        <Select.Content>
                          {categoryCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  )}
                />
              </Field>

              <Field label="任务类型" required>
                <Controller
                  name="task_type"
                  control={control}
                  rules={{ required: "请选择任务类型" }}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value || "daily"}
                      onValueChange={({ value }) => field.onChange(value)}
                    >
                      <HStack gap={6}>
                        <Radio value="daily">每日任务</Radio>
                        <Radio value="weekly">每周任务</Radio>
                      </HStack>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field label="周期内完成次数" required>
                <Controller
                  name="target_count"
                  control={control}
                  rules={{
                    required: "请输入完成次数",
                    min: { value: 1, message: "至少1次" },
                  }}
                  render={({ field }) => (
                    <NumberInput.Root
                      min={1}
                      max={100}
                      value={String(field.value ?? 1)}
                      onValueChange={({ value }) => field.onChange(Number(value))}
                    >
                      <NumberInput.Control>
                        <NumberInput.IncrementTrigger />
                        <NumberInput.DecrementTrigger />
                      </NumberInput.Control>
                      <NumberInput.Input borderRadius={8} />
                    </NumberInput.Root>
                  )}
                />
              </Field>

              <Field label="学习币奖励" required>
                <Controller
                  name="coins_reward"
                  control={control}
                  rules={{
                    required: "请输入学习币数量",
                    min: { value: 1, message: "至少1个" },
                  }}
                  render={({ field }) => (
                    <NumberInput.Root
                      min={1}
                      max={9999}
                      value={String(field.value ?? 10)}
                      onValueChange={({ value }) => field.onChange(Number(value))}
                    >
                      <NumberInput.Control>
                        <NumberInput.IncrementTrigger />
                        <NumberInput.DecrementTrigger />
                      </NumberInput.Control>
                      <NumberInput.Input borderRadius={8} />
                    </NumberInput.Root>
                  )}
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="任务描述"
              >
                <Input
                  {...register("description")}
                  placeholder="请输入任务描述（选填）"
                  borderRadius={8}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <DialogActionTrigger asChild>
              <Button
                variant="outline"
                colorPalette="gray"
                disabled={isSubmitting}
                borderRadius={10}
                px={6}
              >
                取消
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette="blue"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
              borderRadius={10}
              px={6}
            >
              {isEditMode ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddTask
