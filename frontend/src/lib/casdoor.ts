/**
 * Casdoor OAuth 工具函数
 */

export interface CasdoorConfig {
  endpoint: string
  client_id: string
  org_name: string
  app_name: string
}

let _config: CasdoorConfig | null = null

export async function getCasdoorConfig(): Promise<CasdoorConfig> {
  if (_config) return _config
  const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/oauth/casdoor/config`)
  if (!resp.ok) throw new Error("Failed to fetch Casdoor config")
  _config = await resp.json()
  return _config!
}

/**
 * 构建 Casdoor OAuth 登录 URL
 */
export function buildCasdoorLoginUrl(config: CasdoorConfig, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: config.client_id,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: crypto.randomUUID(),
  })
  return `${config.endpoint}/login/oauth/authorize?${params.toString()}`
}

/**
 * 用授权码换取本系统 JWT token
 */
export async function exchangeOAuthCode(code: string, state?: string): Promise<{
  access_token: string
  token_type: string
  is_new_user: boolean
}> {
  const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/oauth/casdoor/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || "OAuth 登录失败")
  }
  return resp.json()
}
