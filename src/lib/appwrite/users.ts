import { databases } from './client'
import { APPWRITE_CONFIG, isAppwriteConfigured } from './config'
import { User } from '@/types'

export const usersService = {
  async getUserProfile(userId: string): Promise<User | null> {
    if (isAppwriteConfigured()) {
      try {
        const doc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          userId
        )
        return {
          id: doc.$id,
          email: doc.email,
          role: doc.role || 'user',
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }
      } catch (err) {
        console.warn(`Appwrite getUserProfile(${userId}) error:`, err)
      }
    }
    return null
  },
}
