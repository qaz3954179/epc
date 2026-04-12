import { useEffect, useRef } from "react"
import * as Blockly from "blockly"
import { javascriptGenerator } from "blockly/javascript"
import * as zhHans from "blockly/msg/zh-hans"
import { Box } from "@chakra-ui/react"

Blockly.setLocale(zhHans as unknown as Record<string, string>)

interface BlocklyEditorProps {
  initialXml?: string
  onChange?: (xml: string, code: string) => void
}

export default function BlocklyEditor({ initialXml, onChange }: BlocklyEditorProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!blocklyDiv.current) return

    console.log("BlocklyEditor mounting, initialXml length:", initialXml?.length || 0)

    const workspace = Blockly.inject(blocklyDiv.current, {
      media: "/blockly-media/",
      toolbox: {
        kind: "categoryToolbox",
        contents: [
          {
            kind: "category",
            name: "逻辑",
            colour: "#5C81A6",
            contents: [
              { kind: "block", type: "controls_if" },
              { kind: "block", type: "logic_compare" },
              { kind: "block", type: "logic_operation" },
              { kind: "block", type: "logic_negate" },
              { kind: "block", type: "logic_boolean" },
            ],
          },
          {
            kind: "category",
            name: "循环",
            colour: "#5CA65C",
            contents: [
              { kind: "block", type: "controls_repeat_ext" },
              { kind: "block", type: "controls_whileUntil" },
              { kind: "block", type: "controls_for" },
            ],
          },
          {
            kind: "category",
            name: "数学",
            colour: "#5C68A6",
            contents: [
              { kind: "block", type: "math_number" },
              { kind: "block", type: "math_arithmetic" },
              { kind: "block", type: "math_single" },
            ],
          },
          {
            kind: "category",
            name: "文本",
            colour: "#5CA68D",
            contents: [
              { kind: "block", type: "text" },
              { kind: "block", type: "text_print" },
            ],
          },
          {
            kind: "category",
            name: "变量",
            colour: "#A65C81",
            custom: "VARIABLE",
          },
        ],
      },
      grid: { spacing: 20, length: 3, colour: "#ccc", snap: true },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
    })

    workspaceRef.current = workspace

    // 加载初始 XML
    if (initialXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(initialXml)
        Blockly.Xml.domToWorkspace(dom, workspace)
        console.log("Loaded XML, blocks:", workspace.getAllBlocks(false).length)
      } catch (e) {
        console.error("Failed to load initial XML:", e)
      }
    } else {
      console.log("No initialXml to load")
    }

    // 只在用户实际操作时触发 onChange，忽略初始化事件
    let ready = false
    setTimeout(() => { ready = true }, 100)

    workspace.addChangeListener((e: Blockly.Events.Abstract) => {
      if (!ready) return
      if (e.isUiEvent) return
      if (onChangeRef.current) {
        const xml = Blockly.Xml.workspaceToDom(workspace)
        const xmlText = Blockly.Xml.domToText(xml)
        const code = javascriptGenerator.workspaceToCode(workspace)
        onChangeRef.current(xmlText, code)
      }
    })

    return () => {
      workspace.dispose()
      workspaceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      ref={blocklyDiv}
      w="100%"
      h="100%"
      borderRadius="xl"
      overflow="hidden"
    />
  )
}
