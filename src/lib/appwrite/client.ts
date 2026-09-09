import { Client, Account, Databases, Storage } from 'appwrite'
import { APPWRITE_CONFIG } from './config'

const client = new Client()

if (APPWRITE_CONFIG.endpoint) {
  client.setEndpoint(APPWRITE_CONFIG.endpoint)
}

if (APPWRITE_CONFIG.projectId) {
  client.setProject(APPWRITE_CONFIG.projectId)
}

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export { client }
