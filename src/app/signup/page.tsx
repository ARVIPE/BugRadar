'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import style from './signup.module.css'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleSignup = (e: any) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords don't match 🐞")
      return
    }

    // Aquí podrías agregar lógica de registro real con fetch(), supabase, etc.
    console.log('User registered:', { email, password })
    router.push('/dashboard')
  }

  return (
    <div className={`${style.background} min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-200 to-yellow-100`}>
      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 max-w-xl w-full">
        <div className="w-full bg-white p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-6">
            <Image
              src={password ? "/bugradar-logo-eyesClosed.png" : "/bugradar-logo.png"}
              alt="BugRadar Logo"
              width={100}
              height={100}
            />
            <h1 className="text-2xl font-bold mt-4 text-gray-800">Create your BugRadar account</h1>
            <p className="text-sm text-gray-600">Monitor your apps. Catch bugs early. Sleep better.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full border border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300"
            >
              Sign Up
            </Button>

            <p className="mt-4 text-sm text-gray-600 text-center">
              Already have an account? <a href="/" className="text-yellow-500 hover:underline">Sign in</a>
            </p>
          </form>

          <p className="mt-8 text-xs text-gray-400 text-center italic">
            "Bugs don’t register themselves. Yet. 🐛"
          </p>
        </div>
      </div>
    </div>
  )
}
