"use client"
import Image from 'next/image'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import style from './login.module.css'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleClick = (e: any) => {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-800`}>
      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-700 max-w-xl w-full">
        {/* Panel izquierdo con login */}
        <div className="w-full bg-gray-800 p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-6">
            <Image
              src={password ? "/bugradar-logo-eyesClosed.png" : "/bugradar-logo.png"}
              alt="BugRadar Logo"
              width={100}
              height={100}
              className='rounded-full'
            />
            <h1 className="text-2xl font-bold mt-4 text-white">Welcome to BugRadar</h1>
            <p className="text-sm text-gray-400">Real-time error monitoring for your Docker apps</p>
          </div>

          <form className="space-y-4" onSubmit={handleClick}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full bg-gray-900 text-white border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full bg-gray-900 text-white border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300"
            >
              Sign In
            </Button>

            <p className="mt-4 text-sm text-gray-400 text-center">
              Don't have an account? <a href="/signup" className="text-yellow-400 hover:underline">Sign up</a>
            </p>
          </form>

          <p className="mt-8 text-xs text-gray-500 text-center italic">
            "Even bugs deserve to be seen... and reported 👀"
          </p>
        </div>
      </div>
    </div>
  )
}
