import { Query } from 'appwrite'
import { databases } from './client'
import { APPWRITE_CONFIG, isAppwriteConfigured } from './config'
import { INITIAL_PRODUCTS } from './mock-catalog'
import { Product } from '@/types'

export interface GetProductsParams {
  category?: string
  sort?: 'asc' | 'desc'
  limit?: number
  page?: number
}

// In-memory / local storage cache for seller-created products when running locally
const SELLER_PRODUCTS_KEY = 'digitalhippo_seller_products'

const getStoredSellerProducts = (): Product[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SELLER_PRODUCTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const productsService = {
  async getProducts({
    category,
    sort = 'desc',
    limit = 10,
    page = 1,
  }: GetProductsParams = {}): Promise<{
    items: Product[]
    nextPage: number | null
  }> {
    if (isAppwriteConfigured()) {
      try {
        const queries: string[] = [Query.limit(limit)]

        if (page > 1) {
          queries.push(Query.offset((page - 1) * limit))
        }

        if (category) {
          queries.push(Query.equal('category', category))
        }

        if (sort === 'desc') {
          queries.push(Query.orderDesc('$createdAt'))
        } else {
          queries.push(Query.orderAsc('$createdAt'))
        }

        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.products,
          queries
        )

        if (response.documents.length > 0) {
          const items: Product[] = response.documents.map((doc) => ({
            id: doc.$id,
            name: doc.name,
            description: doc.description || '',
            price: Number(doc.price),
            category: doc.category as 'ui_kits' | 'icons',
            approvedForSale: doc.approvedForSale || 'approved',
            priceId: doc.priceId || doc.$id,
            product_files: doc.product_files || {
              id: doc.fileId || doc.$id,
              filename: `${doc.name || doc.$id}.zip`,
              url: `/api/download?productId=${doc.$id}`,
            },
            images: Array.isArray(doc.images)
              ? doc.images.map((img: string | { url?: string; image?: { url?: string } }) => {
                  if (typeof img === 'string') {
                    return { image: { id: img, url: img } }
                  }
                  const url = (img as { url?: string }).url || (img as { image?: { url?: string } }).image?.url || '/nav/ui-kits/blue.jpg'
                  return { image: { id: url, url } }
                })
              : [
                  {
                    image: {
                      id: doc.$id,
                      url: doc.imageUrl || '/nav/ui-kits/blue.jpg',
                    },
                  },
                ],
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          }))

          const hasNextPage = response.total > page * limit
          return {
            items,
            nextPage: hasNextPage ? page + 1 : null,
          }
        }
      } catch (err) {
        console.warn('Appwrite listDocuments failed, using fallback catalog:', err)
      }
    }

    // Fallback combined with any locally created products
    const sellerProducts = getStoredSellerProducts()
    let pool = [...sellerProducts, ...INITIAL_PRODUCTS]

    if (category) {
      pool = pool.filter((p) => p.category === category)
    }

    if (sort === 'asc') {
      pool.sort((a, b) => a.price - b.price)
    } else {
      pool.sort((a, b) => b.price - a.price)
    }

    const startIndex = (page - 1) * limit
    const items = pool.slice(startIndex, startIndex + limit)
    const hasNextPage = pool.length > startIndex + limit

    return {
      items,
      nextPage: hasNextPage ? page + 1 : null,
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isAppwriteConfigured()) {
      try {
        const doc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.products,
          id
        )

        return {
          id: doc.$id,
          name: doc.name,
          description: doc.description || '',
          price: Number(doc.price),
          category: doc.category as 'ui_kits' | 'icons',
          approvedForSale: doc.approvedForSale || 'approved',
          priceId: doc.priceId || doc.$id,
          product_files: doc.product_files || {
            id: doc.fileId || doc.$id,
            filename: `${doc.name || doc.$id}.zip`,
            url: `/api/download?productId=${doc.$id}`,
          },
          images: Array.isArray(doc.images)
            ? doc.images.map((img: string | { url?: string; image?: { url?: string } }) => {
                if (typeof img === 'string') {
                  return { image: { id: img, url: img } }
                }
                const url = (img as { url?: string }).url || (img as { image?: { url?: string } }).image?.url || '/nav/ui-kits/blue.jpg'
                return { image: { id: url, url } }
              })
            : [
                {
                  image: {
                    id: doc.$id,
                    url: doc.imageUrl || '/nav/ui-kits/blue.jpg',
                  },
                },
              ],
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }
      } catch (err) {
        console.warn(`Appwrite getDocument(${id}) error:`, err)
      }
    }

    const sellerProducts = getStoredSellerProducts()
    const pool = [...sellerProducts, ...INITIAL_PRODUCTS]
    const found = pool.find((p) => p.id === id)
    return found || null
  },

  async createProduct(productData: {
    name: string
    description: string
    price: number
    category: 'ui_kits' | 'icons'
    imageUrl?: string
  }): Promise<Product> {
    const newProduct: Product = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      approvedForSale: 'approved',
      priceId: 'price_' + Math.random().toString(36).substring(2, 9),
      product_files: {
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        url: productData.imageUrl || '/nav/ui-kits/mixed.jpg',
        filename: `${productData.name.toLowerCase().replace(/\s+/g, '-')}.zip`,
        filesize: 12000000,
      },
      images: [
        {
          id: 'img_' + Math.random().toString(36).substring(2, 9),
          image: {
            id: 'med_' + Math.random().toString(36).substring(2, 9),
            url:
              productData.imageUrl ||
              (productData.category === 'ui_kits'
                ? '/nav/ui-kits/mixed.jpg'
                : '/nav/icons/new.jpg'),
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isAppwriteConfigured()) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.products,
          newProduct.id,
          {
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            category: newProduct.category,
            approvedForSale: 'approved',
            priceId: newProduct.priceId,
            imageUrl: productData.imageUrl || '/nav/ui-kits/mixed.jpg',
          }
        )
      } catch (err) {
        console.warn('Appwrite createDocument error:', err)
      }
    }

    if (typeof window !== 'undefined') {
      const current = getStoredSellerProducts()
      localStorage.setItem(
        SELLER_PRODUCTS_KEY,
        JSON.stringify([newProduct, ...current])
      )
    }

    return newProduct
  },
}
