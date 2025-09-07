"use client"

import Image from "next/image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Moon, Sun } from "lucide-react"  // íconos cool

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()
  const [theme, setTheme] = useState("theme-dark")

  const THEMES = ["theme-light", "theme-dark"]

  
  useEffect(() => {
    document.body.classList.remove(...THEMES)
    document.body.classList.add(theme)
  }, [theme])
  
  const toggleTheme = () => {
    setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark")
  }


  const handleSignup = (e: any) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords don't match 🐞")
      return
    }

    console.log("User registered:", { email, password })
    router.push("/dashboard")
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-skin-bg`}>
      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border border-gray-700 max-w-xl w-full">
         <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full text-black transition-transform transform hover:scale-110"
          aria-label="Toggle theme"
        >
          {theme === "theme-dark" ? <Sun size={20} style={{ color: 'yellow' }} /> : <Moon size={20} style={{ color: 'black' }} />}
        </button>
        <div className="w-full bg-skin-panel p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-6">
            <Image
              src={password ? "/bugradar-logo-eyesClosed.png" : "/bugradar-logo.png"}
              alt="BugRadar Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold mt-4 text-skin-title">Create your BugRadar account</h1>
            <p className="text-sm text-skin-subtitle">Monitor your apps. Catch bugs early. Sleep better.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-skin-subtitle">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-300 dark:border-gray-700 focus:border-yellow-500 focus:ring-yellow-500"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-300 dark:border-gray-700 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-skin-subtitle">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-300 dark:border-gray-700 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300"
            >
              Sign Up
            </Button>

            <p className="mt-4 text-sm text-skin-subtitle text-center">
              Already have an account?{" "}
              <a href="/" className="text-yellow-400 hover:underline">
                Sign in
              </a>
            </p>
          </form>

          <p className="mt-8 text-xs text-skin-subtitle text-center italic">
            "Bugs don't register themselves. Yet. 🐛"
          </p>
        </div>
      </div>
    </div>
  )
}
