// src/app/page.tsx
"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Moon, Sun, AlertCircle } from "lucide-react" // 1. Importar AlertCircle
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null) // 2. Estado para el mensaje de error
  const [isLoading, setIsLoading] = useState(false) // Estado para deshabilitar el botón
  const router = useRouter()
  const [theme, setTheme] = useState("theme-dark")


  const applyTheme = (t: string) => {
    document.documentElement.className = t
  }

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const initial = stored === "theme-light" || stored === "theme-dark" ? stored : theme
    setTheme(initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme)
    }
    applyTheme(theme)
  }, [theme])

    // Sincronizar con otras pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "theme-light" || e.newValue === "theme-dark")) {
        setTheme(e.newValue)
        applyTheme(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])


  const toggleTheme = () => {
    setTheme(prev => (prev === "theme-dark" ? "theme-light" : "theme-dark"))
  }


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Resetea el error al intentar de nuevo
    setIsLoading(true) // Deshabilita el botón

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setIsLoading(false) // Vuelve a habilitar el botón

    if (result?.ok) {
      router.push('/dashboard')
    } else {
      // 3. Muestra un mensaje de error claro en la UI
      setError("El correo o la contraseña son incorrectos. Porfavor intentalo de nuevo.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-bg transition-colors">
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
              className='rounded-full'
            />
            <h1 className="text-2xl font-bold mt-4 text-skin-title">Welcome to BugRadar</h1>
            <p className="text-sm text-skin-subtitle">Real-time error monitoring for your Docker apps</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-skin-subtitle">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null) // Limpia el error al escribir
                }}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-skin-subtitle">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null) // Limpia el error al escribir
                }}
              />
            </div>
            
            {/* --- 4. Renderizado condicional del mensaje de error --- */}
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading} // Deshabilita el botón mientras se procesa
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <p className="mt-4 text-sm text-skin-subtitle text-center">
              Don't have an account?{" "}
              <a href="/signup" className="text-yellow-400 hover:underline">Sign up</a>
            </p>
          </form>

          <p className="mt-8 text-xs text-skin-subtitle text-center italic">
            "Even bugs deserve to be seen... and reported 👀"
          </p>
        </div>
      </div>
    </div>
  )
}