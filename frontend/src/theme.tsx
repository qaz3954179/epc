import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: {
            DEFAULT: {
              value: "#FF6B6B",
            },
            200: {
              value: 'rgba(255, 107, 107, 0.2)'
            }
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        primary: { value: "#FF6B6B" },
        content: {
          DEFAULT: {
            bg: { value: '#F9FAFB' }
          }
        },
        menu: {
          DEFAULT: {
            color: { value: '#4B5563' },
          },
          active: {
            color: { value: 'ui.main' },
          },
          hover: {
            color: { value: 'colors.ui.main' },
            bg: { value: 'colors.ui.main.200' }
          }
        },
        description: {
          value: '#6B7280'
        }
      }
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
