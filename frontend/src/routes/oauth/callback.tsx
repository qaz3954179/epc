import { Container, Spinner, Text } from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { exchangeOAuthCode } from "@/lib/casdoor"

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

    exchangeOAuthCode(code, state || undefined)
      .then((data) => {
        localStorage.setItem("access_token", data.access_token)
        navigate({ to: "/" })
      })
      .catch((err) => {
        setError(err.message || "登录失败，请重试")
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
