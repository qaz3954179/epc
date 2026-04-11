import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import useAuth from "@/hooks/useAuth"

type UserRole = "admin" | "parent" | "child"

interface RouteGuardProps {
  /** 允许访问的角色列表 */
  allowedRoles: UserRole[]
  children: React.ReactNode
}

/**
 * 路由权限守卫：根据用户角色控制页面访问
 * 不在允许列表中的角色会被重定向到首页
 */
const RouteGuard = ({ allowedRoles, children }: RouteGuardProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const userRole = (user?.role as UserRole) || "parent"
  const allowed = allowedRoles.includes(userRole)

  useEffect(() => {
    if (user && !allowed) {
      navigate({ to: "/" })
    }
  }, [user, allowed, navigate])

  if (!user || !allowed) return null

  return <>{children}</>
}

export default RouteGuard
