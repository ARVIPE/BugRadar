// src/app/signup/page.tsx
"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Moon, Sun, AlertCircle } from "lucide-react"

// Ya no necesitamos el cliente de Supabase aquí. ¡Más limpio!

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [theme, setTheme] = useState("theme-dark")

  // ... (tus hooks de tema se mantienen igual)
    const applyTheme = (t: string) => {
    document.documentElement.className = t
  }
  
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const initial = stored === "theme-light" || stored === "theme-dark" ? stored : theme
    setTheme(initial)
    applyTheme(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const toggleTheme = () => {
    setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark")
  }

  // --- Lógica de registro actualizada para llamar a nuestra API ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden 🐞")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si la API devuelve un error, lo mostramos
        throw new Error(data.error || 'Algo salió mal.')
      }

      // ¡Éxito!
      alert("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.")
      router.push("/") // Redirigimos al login

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-skin-bg`}>
      {/*<button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full text-black transition-transform transform hover:scale-110"
          aria-label="Toggle theme"
        >
          {theme === "theme-dark" ? <Sun size={20} style={{ color: 'yellow' }} /> : <Moon size={20} style={{ color: 'black' }} />}
        </button>*/}
      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-700 max-w-xl w-full bg-skin-panel relative">
        <div className="w-full p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-6">
            <Image
              src={password ? "/bugradar-logo-eyesClosed.png" : "/bugradar-logo.png"}
              alt="BugRadar Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold mt-4 text-skin-title">Crea tu cuenta en BugRadar</h1>
            <p className="text-sm text-skin-subtitle">Monitoriza tus apps. Atrapa bugs a tiempo. Duerme mejor.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            {/* ... (el resto del formulario JSX es el mismo) ... */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-skin-subtitle">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-skin-subtitle">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-skin-subtitle">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>

            <p className="mt-4 text-sm text-skin-subtitle text-center">
              ¿Ya tienes una cuenta?{" "}
              <a href="/" className="text-yellow-400 hover:underline">
                Inicia sesión
              </a>
            </p>
          </form>

          <p className="mt-8 text-xs text-skin-subtitle text-center italic">
            "Los bugs no se registran solos. Todavía. 🐛"
          </p>
        </div>
      </div>
    </div>
  )
}