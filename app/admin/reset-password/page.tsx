"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabaseBrowser } from "@/lib/supabase-browser"

const MIN_PASSWORD_LENGTH = 12

type RecoveryState = "checking" | "ready" | "invalid" | "complete"

export default function ResetPasswordPage() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const { data: authStateSubscription } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (!isMounted || event !== "PASSWORD_RECOVERY" || !session) return

      setError("")
      setRecoveryState("ready")
    })

    void supabaseBrowser.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) return

      setRecoveryState(!sessionError && data.session ? "ready" : "invalid")
    })

    return () => {
      isMounted = false
      authStateSubscription.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (recoveryState !== "ready") {
      setError("Ce lien de réinitialisation est invalide ou a expiré.")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password })

      if (updateError) {
        setError("La réinitialisation n’a pas abouti. Demandez un nouveau lien.")
        return
      }

      await Promise.allSettled([
        supabaseBrowser.auth.signOut({ scope: "local" }),
        signOut({ redirect: false }),
      ])

      setPassword("")
      setPasswordConfirmation("")
      setRecoveryState("complete")
    } catch {
      setError("La réinitialisation n’a pas abouti. Demandez un nouveau lien.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormAvailable = recoveryState === "ready"

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo.webp" alt="Danemo Logo" width={120} height={90} loading="eager" style={{ height: "auto" }} />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe pour votre accès d’administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recoveryState === "checking" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Vérification du lien de réinitialisation…
            </p>
          )}

          {recoveryState === "invalid" && (
            <Alert variant="destructive">
              <AlertDescription>
                Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien à un administrateur.
              </AlertDescription>
            </Alert>
          )}

          {recoveryState === "complete" && (
            <Alert>
              <AlertDescription>
                Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter avec le nouveau mot de passe.
              </AlertDescription>
            </Alert>
          )}

          {isFormAvailable && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(inputEvent) => setPassword(inputEvent.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Au moins {MIN_PASSWORD_LENGTH} caractères.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-confirmation">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={passwordConfirmation}
                  onChange={(inputEvent) => setPasswordConfirmation(inputEvent.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                {isLoading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          )}

          {recoveryState !== "checking" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/admin/login" className="text-orange-700 underline underline-offset-4 hover:text-orange-800">
                Retour à la connexion
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
