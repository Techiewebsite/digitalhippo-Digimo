export const APPWRITE_CONFIG = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    'https://fra.cloud.appwrite.io/v1',
  projectId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    '6a9b4399000ba2817e08',
  databaseId:
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
    '6aa0a8f00015379a297f',
  collections: {
    products:
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PRODUCTS ||
      'products',
    orders:
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORDERS ||
      'orders',
    users:
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS ||
      'users',
    productFiles:
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_FILES ||
      'product_files',
  },
  buckets: {
    productFiles:
      process.env.APPWRITE_STORAGE_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_FILES ||
      '6aa10cbe000dad323c41',
    media:
      process.env.APPWRITE_STORAGE_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_MEDIA ||
      '6aa10cbe000dad323c41',
  },
}

export const isAppwriteConfigured = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean(
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID.trim() !== ''
    )
  )
}
