"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Vérification des identifiants en dur d'abord
    if (email === "admin@danemo.be" && password === "admin123") {
      localStorage.setItem("danemo_admin_session", "authenticated")
      localStorage.setItem("danemo_admin_role", "admin")
      router.push("/admin")
      return
    }
    
    if (email === "operator@danemo.be" && password === "operator123") {
      localStorage.setItem("danemo_admin_session", "authenticated")
      localStorage.setItem("danemo_admin_role", "operator")
      router.push("/admin")
      return
    }

    // Sinon, essayer avec Supabase Auth
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError("Email ou mot de passe incorrect")
      } else {
        // Store session marker and role from user metadata if present
        localStorage.setItem("danemo_admin_session", "authenticated")
        const roleFromMetadata = (data.user?.user_metadata as any)?.role
        const derivedRole = roleFromMetadata || (email === "operator@danemo.be" ? "operator" : "admin")
        localStorage.setItem("danemo_admin_role", derivedRole)
        router.push("/admin")
      }
    } catch (err: any) {
      setError("Email ou mot de passe incorrect")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo.webp" alt="Danemo Logo" width={120} height={90} className="object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">Administration Danemo</CardTitle>
          <CardDescription>Connectez-vous pour accéder au panneau d'administration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@danemo.be"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
