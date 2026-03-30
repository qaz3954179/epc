import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    colorPalette: "teal",
  },
  variants: {
    variant: {
      ghost: {
        color: '#4B5563',
        bg: "transparent",
        _hover: {
          bg: "gray.100",
        },
        '& > *': {
          color: '#4B5563',
        }
      },
    },
  },
})
