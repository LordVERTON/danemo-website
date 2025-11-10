import React, { createContext, useContext, useMemo } from "react"

type TabsContextValue = {
  value: string
  onValueChange?: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const ctx = useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  const isActive = ctx.value === value
  return (
    <button
      type="button"
      data-state={isActive ? "active" : "inactive"}
      className={className}
      onClick={() => ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}


