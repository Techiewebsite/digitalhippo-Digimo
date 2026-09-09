'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { auth } from '@/lib/appwrite/auth'
import { useAuthContext } from '@/context/auth-context'

export const useAuth = () => {
  const router = useRouter()
  const { user, isLoading, setUser, refreshUser } = useAuthContext()

  const signOut = async () => {
    try {
      await auth.signOut()
      setUser(null)
      toast.success('Signed out successfully')
      router.push('/sign-in')
      router.refresh()
    } catch {
      toast.error("Couldn't sign out, please try again.")
    }
  }

  const signIn = async (credentials: { email: string; password: string }) => {
    const res = await auth.signIn(credentials)
    if (res.user) {
      setUser(res.user)
    }
    return res
  }

  const signUp = async (credentials: { email: string; password: string }) => {
    const res = await auth.signUp(credentials)
    return res
  }

  return {
    user,
    isLoading,
    signOut,
    signIn,
    signUp,
    refreshUser,
  }
}
