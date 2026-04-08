import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: { fontSize: "16px" },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
      background: "linear-gradient(160deg, #fff8f0 0%, #fff0fa 50%, #f0fff8 100%)",
      minHeight: "100vh",
    },
    ".main-link": { color: "ui.main", fontWeight: "bold" },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: {
            DEFAULT: { value: "#FF6B35" },
            200: { value: "rgba(255, 107, 53, 0.15)" },
          },
        },
      },
      fonts: {
        heading: { value: "'PingFang SC', 'Microsoft YaHei', sans-serif" },
        body:    { value: "'PingFang SC', 'Microsoft YaHei', sans-serif" },
      },
      radii: {
        card: { value: "20px" },
      },
    },
    semanticTokens: {
      colors: {
        primary:   { value: "#FF6B35" },   // 活力橙
        secondary: { value: "#FFD60A" },   // 明黄
        accent:    { value: "#06D6A0" },   // 薄荷绿
        content: {
          DEFAULT: { bg: { value: "transparent" } },
        },
        menu: {
          DEFAULT: { color: { value: "#6B7280" } },
          active:  { color: { value: "#FF6B35" } },
          hover: {
            color: { value: "#FF6B35" },
            bg:    { value: "rgba(255, 107, 53, 0.08)" },
          },
        },
        description: { value: "#6B7280" },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
