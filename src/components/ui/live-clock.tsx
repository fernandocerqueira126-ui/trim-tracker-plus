import { useEffect, useState } from "react"

export function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground font-medium mb-1">
        HORÁRIO DO SISTEMA
      </div>
      <div className="text-3xl font-bold text-primary font-mono tracking-wider">
        {formatTime(time)}
      </div>
      <div className="text-sm text-muted-foreground">
        {formatDate(time)}
      </div>
    </div>
  )
}