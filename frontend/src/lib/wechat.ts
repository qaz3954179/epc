/**
 * 微信 OAuth 工具函数
 */

export interface WeChatConfig {
  app_id: string
  login_type: "open" | "mp"
  enabled: boolean
}

let _config: WeChatConfig | null = null

/**
 * 获取微信配置
 */
export async function getWeChatConfig(): Promise<WeChatConfig> {
  if (_config) return _config
  const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/oauth/wechat/config`)
  if (!resp.ok) throw new Error("Failed to fetch WeChat config")
  _config = await resp.json()
  return _config!
}

/**
 * 获取微信授权 URL，直接跳转
 */
export async function buildWeChatLoginUrl(redirectUri: string, state?: string): Promise<string | null> {
  const config = await getWeChatConfig()
  if (!config.enabled) return null

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    ...(state ? { state } : {}),
  })

  const resp = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/oauth/wechat/authorize-url?${params.toString()}`
  )
  if (!resp.ok) throw new Error("Failed to get WeChat authorize URL")

  const data = await resp.json()
  return data.authorize_url as string
}

/**
 * 用微信授权码换取本系统 JWT token
 */
export async function exchangeWeChatCode(code: string, state?: string): Promise<{
  access_token: string
  token_type: string
  is_new_user: boolean
}> {
  const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/oauth/wechat/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || "微信登录失败")
  }
  return resp.json()
}
