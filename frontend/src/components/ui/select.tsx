import { Select as ChakraSelect, Portal } from "@chakra-ui/react"
import * as React from "react"

export const SelectRoot = ChakraSelect.Root
export const SelectValueText = ChakraSelect.ValueText
export const SelectItemGroup = ChakraSelect.ItemGroup

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  ChakraSelect.TriggerProps
>(function SelectTrigger(props, ref) {
  return (
    <ChakraSelect.Trigger ref={ref} {...props}>
      {props.children}
      <ChakraSelect.Indicator />
    </ChakraSelect.Trigger>
  )
})

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  ChakraSelect.ContentProps
>(function SelectContent(props, ref) {
  return (
    <Portal>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content ref={ref} {...props} />
      </ChakraSelect.Positioner>
    </Portal>
  )
})

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  ChakraSelect.ItemProps
>(function SelectItem(props, ref) {
  return (
    <ChakraSelect.Item ref={ref} {...props}>
      {props.children}
      <ChakraSelect.ItemIndicator />
    </ChakraSelect.Item>
  )
})
