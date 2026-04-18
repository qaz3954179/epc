import { Container, Spinner, Text } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { exchangeOAuthCode } from "@/lib/casdoor"
import { exchangeWeChatCode } from "@/lib/wechat"

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallback,
})

function OAuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")

    if (!code) {
      setError("缺少授权码")
      return
    }

    // 判断是微信登录还是 Casdoor 登录
    // 微信回调的 code 通常较长，且 URL 可能包含特定参数
    // 更可靠的方式：先尝试微信回调，如果失败再尝试 Casdoor
    const tryWeChat = async () => {
      try {
        const data = await exchangeWeChatCode(code, state || undefined)
        localStorage.setItem("access_token", data.access_token)
        navigate({ to: "/" })
        return true
      } catch {
        return false
      }
    }

    const tryCasdoor = async () => {
      try {
        const data = await exchangeOAuthCode(code, state || undefined)
        localStorage.setItem("access_token", data.access_token)
        navigate({ to: "/" })
        return true
      } catch {
        return false
      }
    }

    // 先尝试微信，再尝试 Casdoor
    tryWeChat().then((wechatOk) => {
      if (!wechatOk) {
        tryCasdoor().then((casdoorOk) => {
          if (!casdoorOk) {
            setError("登录失败，请重试")
          }
        })
      }
    })
  }, [navigate])

  return (
    <Container h="100vh" centerContent justifyContent="center">
      {error ? (
        <Text color="red.500" fontSize="lg">{error}</Text>
      ) : (
        <>
          <Spinner size="xl" color="primary" mb={4} />
          <Text color="#6B7280">正在登录，请稍候...</Text>
        </>
      )}
    </Container>
  )
}
