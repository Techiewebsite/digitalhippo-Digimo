import { ID } from 'appwrite'
import { account } from './client'
import { isAppwriteConfigured } from './config'
import { User } from '@/types'

const LOCAL_USER_KEY = 'digitalhippo_user'

export const auth = {
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null

    if (isAppwriteConfigured()) {
      try {
        const appwriteUser = await account.get()
        const user: User = {
          id: appwriteUser.$id,
          email: appwriteUser.email,
          role: 'user',
          createdAt: appwriteUser.$createdAt,
          updatedAt: appwriteUser.$updatedAt,
        }
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
        document.cookie = `appwrite-user-id=${user.id}; path=/; max-age=604800; SameSite=Lax`
        return user
      } catch {
        localStorage.removeItem(LOCAL_USER_KEY)
        document.cookie = 'appwrite-user-id=; path=/; max-age=0'
        return null
      }
    }

    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY)
      if (stored) {
        return JSON.parse(stored) as User
      }
    } catch {
      // ignore parsing error
    }
    return null
  },

  async signUp({
    email,
    password,
  }: {
    email: string
    password: string
  }): Promise<{ success: boolean; sentToEmail: string }> {
    if (isAppwriteConfigured()) {
      try {
        const newId = ID.unique()
        await account.create(newId, email, password)
        try {
          await account.createEmailPasswordSession(email, password)
        } catch {
          // session create after sign-up if required
        }
        const user: User = {
          id: newId,
          email,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
        document.cookie = `appwrite-user-id=${user.id}; path=/; max-age=604800; SameSite=Lax`
        return { success: true, sentToEmail: email }
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string }
        if (error.code === 409) {
          const conflictError = new Error('This email is already in use. Sign in instead?')
          ;(conflictError as unknown as { code: string }).code = 'CONFLICT'
          throw conflictError
        }
        throw new Error(error.message || 'Failed to create account with Appwrite')
      }
    }

    // Local fallback when Appwrite credentials are not yet configured in UI
    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser))
    document.cookie = `appwrite-user-id=${mockUser.id}; path=/; max-age=604800; SameSite=Lax`
    return { success: true, sentToEmail: email }
  },

  async signIn({
    email,
    password,
  }: {
    email: string
    password: string
  }): Promise<{ success: boolean; user: User }> {
    if (isAppwriteConfigured()) {
      try {
        try {
          await account.deleteSession('current')
        } catch {
          // ignore if no active session
        }
        await account.createEmailPasswordSession(email, password)
        const appwriteUser = await account.get()
        const user: User = {
          id: appwriteUser.$id,
          email: appwriteUser.email,
          role: 'user',
          createdAt: appwriteUser.$createdAt,
          updatedAt: appwriteUser.$updatedAt,
        }
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
        document.cookie = `appwrite-user-id=${user.id}; path=/; max-age=604800; SameSite=Lax`
        return { success: true, user }
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string }
        const unauthorizedError = new Error(error.message || 'Invalid email or password.')
        ;(unauthorizedError as unknown as { code: string; data?: { code: string } }).data = {
          code: 'UNAUTHORIZED',
        }
        throw unauthorizedError
      }
    }

    // Local fallback
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
    document.cookie = `appwrite-user-id=${user.id}; path=/; max-age=604800; SameSite=Lax`
    return { success: true, user }
  },

  async signOut(): Promise<void> {
    if (isAppwriteConfigured()) {
      try {
        await account.deleteSession('current')
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY)
      document.cookie = 'appwrite-user-id=; path=/; max-age=0'
    }
  },

  async verifyEmail({
    userId,
    secret,
  }: {
    userId: string
    secret: string
  }): Promise<{ success: boolean }> {
    if (isAppwriteConfigured()) {
      try {
        await account.updateVerification(userId, secret)
        return { success: true }
      } catch {
        throw new Error('Verification failed')
      }
    }
    return { success: true }
  },
}
