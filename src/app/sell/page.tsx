'use client'

import { useState, useEffect } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { productsService } from '@/lib/appwrite/products'
import { ordersService } from '@/lib/appwrite/orders'
import { Product, Order } from '@/types'
import {
  Package,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

const SellerDashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('39')
  const [category, setCategory] = useState<'ui_kits' | 'icons'>('ui_kits')
  const [imageUrl, setImageUrl] = useState('/nav/ui-kits/mixed.jpg')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in?as=seller')
    }
  }, [user, authLoading, router])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productsService.getProducts({ limit: 50 })
      setProducts(res.items)
    } catch {
      toast.error('Could not load products')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const list = await ordersService.getAllOrders()
      setOrders(list)
    } catch {
      toast.error('Could not load orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadOrders()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a product name')
      return
    }

    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await productsService.createProduct({
        name,
        description:
          description ||
          'High quality digital asset created with pixel-perfect attention to detail.',
        price: numericPrice,
        category,
        imageUrl,
      })

      toast.success(`'${created.name}' listed successfully in Appwrite catalog!`)
      setName('')
      setDescription('')
      setIsModalOpen(false)
      await loadProducts()
    } catch {
      toast.error('Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <MaxWidthWrapper className='py-20'>
        <div className='flex justify-center items-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
        </div>
      </MaxWidthWrapper>
    )
  }

  return (
    <MaxWidthWrapper className='py-12'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-gray-200'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
            Seller Dashboard
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Manage your digital products, track approvals, and add new assets to the Appwrite catalog.
          </p>
        </div>

        <div className='mt-4 md:mt-0 flex gap-3'>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='gap-2'>
            <Plus className='w-4 h-4' />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className='mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 bg-blue-50 p-3 rounded-lg text-blue-600'>
              <Package className='h-6 w-6' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  Total Products
                </dt>
                <dd className='text-2xl font-bold text-gray-900'>
                  {products.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 bg-green-50 p-3 rounded-lg text-green-600'>
              <CheckCircle2 className='h-6 w-6' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  Approved For Sale
                </dt>
                <dd className='text-2xl font-bold text-gray-900'>
                  {products.filter((p) => p.approvedForSale === 'approved').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 bg-amber-50 p-3 rounded-lg text-amber-600'>
              <Clock className='h-6 w-6' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  Pending Review
                </dt>
                <dd className='text-2xl font-bold text-gray-900'>
                  0
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 bg-purple-50 p-3 rounded-lg text-purple-600'>
              <DollarSign className='h-6 w-6' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  Catalog Value
                </dt>
                <dd className='text-2xl font-bold text-gray-900'>
                  {formatPrice(
                    products.reduce((acc, curr) => acc + curr.price, 0)
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='mt-10 flex items-center gap-2 border-b border-gray-200 pb-2'>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}>
          <Package className='w-4 h-4 inline mr-1.5' />
          Products Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}>
          <CreditCard className='w-4 h-4 inline mr-1.5' />
          SebPay Orders & Payments ({orders.length})
        </button>
      </div>

      {activeTab === 'products' ? (
        /* Product List */
        <div className='mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm'>
          <div className='px-6 py-5 border-b border-gray-200 flex justify-between items-center'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Your Digital Products
            </h2>
            <span className='text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium'>
              Appwrite Backend Sync Active
            </span>
          </div>

          {loading ? (
            <div className='p-12 flex justify-center items-center'>
              <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
            </div>
          ) : products.length === 0 ? (
            <div className='p-12 text-center'>
              <Package className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-semibold text-gray-900'>
                No products yet
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Get started by adding your first digital product.
              </p>
              <div className='mt-6'>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className='w-4 h-4 mr-2' /> Add Product
                </Button>
              </div>
            </div>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {products.map((product) => {
                const firstImage = product.images?.[0]?.image
                const url =
                  typeof firstImage === 'string'
                    ? firstImage
                    : firstImage?.url || '/nav/ui-kits/blue.jpg'

                return (
                  <li
                    key={product.id}
                    className='p-6 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div className='flex items-center space-x-4'>
                      <div className='relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                        <Image
                          src={url}
                          alt={product.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div>
                        <h3 className='text-base font-medium text-gray-900'>
                          {product.name}
                        </h3>
                        <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                          <span className='capitalize font-medium text-gray-600'>
                            {product.category === 'ui_kits' ? 'UI Kit' : 'Icon Set'}
                          </span>
                          <span>•</span>
                          <span className='inline-flex items-center text-green-700'>
                            <CheckCircle2 className='w-3.5 h-3.5 mr-1' /> Approved
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between sm:justify-end gap-6'>
                      <span className='text-base font-semibold text-gray-900'>
                        {formatPrice(product.price)}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className='text-sm text-blue-600 hover:text-blue-500 font-medium inline-flex items-center gap-1'>
                        View in Store <ArrowRight className='w-4 h-4' />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : (
        /* Orders & SebPay Payments List */
        <div className='mt-6 space-y-4'>
          <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-800'>
            <ShieldCheck className='w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5' />
            <div>
              <p className='font-semibold'>Production Server-Side Payment Verification Active</p>
              <p className='text-xs text-emerald-700 mt-0.5'>
                Orders are fulfilled only after authoritative verification from the SebPay production gateway.
                Customer clients cannot arbitrarily modify payment status or grant unauthorized product access.
              </p>
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm'>
            <div className='px-6 py-5 border-b border-gray-200 flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-900'>
                SebPay Orders & Payment Records
              </h2>
              <Button
                variant='outline'
                size='sm'
                onClick={loadOrders}
                disabled={loadingOrders}
                className='text-xs'>
                {loadingOrders ? <Loader2 className='w-3.5 h-3.5 animate-spin mr-1' /> : null}
                Refresh Orders
              </Button>
            </div>

            {loadingOrders ? (
              <div className='p-12 flex justify-center items-center'>
                <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
              </div>
            ) : orders.length === 0 ? (
              <div className='p-12 text-center'>
                <CreditCard className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-semibold text-gray-900'>
                  No orders recorded yet
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Customer checkout orders initiated through SebPay will appear here.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm text-gray-600'>
                  <thead className='bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200'>
                    <tr>
                      <th className='px-6 py-3.5'>Order ID</th>
                      <th className='px-6 py-3.5'>Customer</th>
                      <th className='px-6 py-3.5'>Amount</th>
                      <th className='px-6 py-3.5'>Provider</th>
                      <th className='px-6 py-3.5'>SebPay Reference</th>
                      <th className='px-6 py-3.5'>Payment Status</th>
                      <th className='px-6 py-3.5'>Date</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {orders.map((o) => {
                      const userEmail =
                        typeof o.user === 'object' && o.user ? o.user.email : o.userEmail || 'Customer'
                      const isPaid = o._isPaid || o.paymentStatus === 'PAID'
                      return (
                        <tr key={o.id} className='hover:bg-gray-50/80 transition'>
                          <td className='px-6 py-4 font-mono text-xs font-semibold text-gray-900'>
                            {o.id}
                          </td>
                          <td className='px-6 py-4 text-xs font-medium text-gray-900'>
                            {userEmail}
                          </td>
                          <td className='px-6 py-4 text-xs font-semibold text-gray-900'>
                            {o.amount ? `${o.amount.toLocaleString('fr-FR')} ${o.currency || 'XOF'}` : '—'}
                          </td>
                          <td className='px-6 py-4'>
                            <span className='inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700'>
                              SebPay Live
                            </span>
                          </td>
                          <td className='px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[140px]'>
                            {o.sebpayTransactionId || o.sebpayReference || '—'}
                          </td>
                          <td className='px-6 py-4'>
                            {isPaid ? (
                              <span className='inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'>
                                <CheckCircle2 className='w-3.5 h-3.5' /> PAID
                              </span>
                            ) : o.paymentStatus === 'FAILED' ? (
                              <span className='inline-flex items-center gap-1 rounded bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800'>
                                FAILED
                              </span>
                            ) : o.paymentStatus === 'CANCELLED' ? (
                              <span className='inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800'>
                                CANCELLED
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800'>
                                <Clock className='w-3.5 h-3.5' /> PENDING
                              </span>
                            )}
                          </td>
                          <td className='px-6 py-4 text-xs text-gray-500 whitespace-nowrap'>
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in'>
          <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative'>
            <button
              onClick={() => setIsModalOpen(false)}
              className='absolute top-5 right-5 text-gray-400 hover:text-gray-600'>
              <X className='w-5 h-5' />
            </button>

            <h2 className='text-xl font-bold text-gray-900'>
              Add New Digital Product
            </h2>
            <p className='text-sm text-muted-foreground mt-1'>
              List a new asset in the Appwrite database collection.
            </p>

            <form onSubmit={handleCreateProduct} className='mt-6 space-y-4'>
              <div>
                <Label htmlFor='prod-name'>Product Name</Label>
                <Input
                  id='prod-name'
                  required
                  placeholder='e.g., Nova SaaS UI Kit'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='mt-1'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='prod-category'>Category</Label>
                  <select
                    id='prod-category'
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as 'ui_kits' | 'icons')
                    }
                    className='mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
                    <option value='ui_kits'>UI Kit</option>
                    <option value='icons'>Icon Set</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor='prod-price'>Price (USD)</Label>
                  <Input
                    id='prod-price'
                    type='number'
                    min='1'
                    step='1'
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className='mt-1'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='prod-desc'>Description</Label>
                <textarea
                  id='prod-desc'
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Describe the components, styles, formats, and design system inclusions...'
                  className='mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>

              <div>
                <Label htmlFor='prod-img'>Preview Image</Label>
                <select
                  id='prod-img'
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className='mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
                  <option value='/nav/ui-kits/blue.jpg'>UI Kit - Blue Minimal</option>
                  <option value='/nav/ui-kits/purple.jpg'>UI Kit - Purple Dashboard</option>
                  <option value='/nav/ui-kits/mixed.jpg'>UI Kit - Mixed Craft</option>
                  <option value='/nav/icons/picks.jpg'>Icons - Essential Line</option>
                  <option value='/nav/icons/new.jpg'>Icons - Creative Duotone</option>
                  <option value='/nav/icons/bestsellers.jpg'>Icons - Solid Glyphs</option>
                </select>
              </div>

              <div className='pt-4 flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  ) : null}
                  Publish Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </MaxWidthWrapper>
  )
}

export default SellerDashboardPage
