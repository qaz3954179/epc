import { useEffect, useRef } from "react"
import * as Blockly from "blockly"
import { javascriptGenerator } from "blockly/javascript"
import { Box } from "@chakra-ui/react"

interface BlocklyEditorProps {
  initialXml?: string
  onChange?: (xml: string, code: string) => void
}

export default function BlocklyEditor({ initialXml, onChange }: BlocklyEditorProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)

  useEffect(() => {
    if (!blocklyDiv.current) return

    // 初始化 Blockly 工作区
    const workspace = Blockly.inject(blocklyDiv.current, {
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
      grid: {
        spacing: 20,
        length: 3,
        colour: "#ccc",
        snap: true,
      },
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
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(initialXml),
          workspace
        )
      } catch (e) {
        console.error("Failed to load initial XML:", e)
      }
    }

    // 监听变化
    workspace.addChangeListener(() => {
      if (onChange) {
        const xml = Blockly.Xml.workspaceToDom(workspace)
        const xmlText = Blockly.Xml.domToText(xml)
        const code = javascriptGenerator.workspaceToCode(workspace)
        onChange(xmlText, code)
      }
    })

    return () => {
      workspace.dispose()
    }
  }, [])

  return (
    <Box
      ref={blocklyDiv}
      w="100%"
      h="100%"
      minH="500px"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
    />
  )
}
