import { createFileRoute, Link } from "@tanstack/react-router"

const Logs = () => {
  return (
    <div>
      <Link to="/">
      
      </Link>
    </div>
  )
}

export const Route = createFileRoute("/coins/logs")({
  component: Logs,
})