'use client'

import { Button } from '@/components/ui/button'
import { PRODUCT_CATEGORIES } from '@/config'
import { useCart } from '@/hooks/use-cart'
import { cn, formatPrice } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { ordersService } from '@/lib/appwrite/orders'

const Page = () => {
  const { items, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const productIds = items.map(({ product }) => product.id)

  const [isMounted, setIsMounted] = useState<boolean>(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const cartTotal = items.reduce(
    (total, { product }) => total + product.price,
    0
  )

  const fee = 1

  const handleCheckout = async () => {
    if (items.length === 0) return

    if (!user) {
      router.push('/sign-in?origin=cart')
      return
    }

    setIsLoading(true)

    try {
      const settlementAmountXOF = Math.round((cartTotal + fee) * 600)

      // 1. Prepare / create order in Appwrite with authoritative XOF settlement amount
      const order = await ordersService.createOrder({
        userId: user.id,
        userEmail: user.email,
        products: items.map((i) => i.product),
        amount: settlementAmountXOF,
        currency: 'XOF',
        isPaid: false,
      })

      // 2. Call secure server-side payment endpoint (Netlify Function / API)
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds,
          orderId: order.id,
          userId: user.id,
          userEmail: user.email,
          origin: window.location.origin,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to initiate checkout session')
      }

      const data = await res.json()
      if (data.url) {
        clearCart()
        router.push(data.url)
      } else {
        throw new Error('No payment URL returned')
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || 'Something went wrong with checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-white'>
      <div className='mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
          Shopping Cart
        </h1>

        <div className='mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16'>
          <div
            className={cn('lg:col-span-7', {
              'rounded-lg border-2 border-dashed border-zinc-200 p-12':
                isMounted && items.length === 0,
            })}>
            <h2 className='sr-only'>
              Items in your shopping cart
            </h2>

            {isMounted && items.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center space-y-1'>
                <div
                  aria-hidden='true'
                  className='relative mb-4 h-40 w-40 text-muted-foreground'>
                  <Image
                    src='/hippo-empty-cart.png'
                    fill
                    loading='eager'
                    alt='empty shopping cart hippo'
                  />
                </div>
                <h3 className='font-semibold text-2xl'>
                  Your cart is empty
                </h3>
                <p className='text-muted-foreground text-center'>
                  Whoops! Nothing to show here yet.
                </p>
              </div>
            ) : null}

            <ul
              className={cn({
                'divide-y divide-gray-200 border-b border-t border-gray-200':
                  isMounted && items.length > 0,
              })}>
              {isMounted &&
                items.map(({ product }) => {
                  const label = PRODUCT_CATEGORIES.find(
                    (c) => c.value === product.category
                  )?.label

                  const { image } = product.images[0]

                  return (
                    <li
                      key={product.id}
                      className='flex py-6 sm:py-10'>
                      <div className='flex-shrink-0'>
                        <div className='relative h-24 w-24'>
                          {typeof image !== 'string' &&
                          image.url ? (
                            <Image
                              fill
                              src={image.url}
                              alt='product image'
                              className='h-full w-full rounded-md object-cover object-center sm:h-48 sm:w-48'
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className='ml-4 flex flex-1 flex-col justify-between sm:ml-6'>
                        <div className='relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0'>
                          <div>
                            <div className='flex justify-between'>
                              <h3 className='text-sm'>
                                <Link
                                  href={`/product/${product.id}`}
                                  className='font-medium text-gray-700 hover:text-gray-800'>
                                  {product.name}
                                </Link>
                              </h3>
                            </div>

                            <div className='mt-1 flex text-sm'>
                              <p className='text-muted-foreground'>
                                Category: {label}
                              </p>
                            </div>

                            <p className='mt-1 text-sm font-medium text-gray-900'>
                              {formatPrice(product.price)}
                            </p>
                          </div>

                          <div className='mt-4 sm:mt-0 sm:pr-9 w-20'>
                            <div className='absolute right-0 top-0'>
                              <Button
                                aria-label='remove product'
                                onClick={() =>
                                  removeItem(product.id)
                                }
                                variant='ghost'>
                                <X
                                  className='h-5 w-5'
                                  aria-hidden='true'
                                />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <p className='mt-4 flex space-x-2 text-sm text-gray-700'>
                          <Check className='h-5 w-5 flex-shrink-0 text-green-500' />

                          <span>
                            Eligible for instant delivery
                          </span>
                        </p>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>

          <section className='mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8'>
            <h2 className='text-lg font-medium text-gray-900'>
              Order summary
            </h2>

            <div className='mt-6 space-y-4'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-600'>
                  Subtotal
                </p>
                <p className='text-sm font-medium text-gray-900'>
                  {isMounted ? (
                    formatPrice(cartTotal)
                  ) : (
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  )}
                </p>
              </div>

              <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
                <div className='flex items-center text-sm text-muted-foreground'>
                  <span>Flat Transaction Fee</span>
                </div>
                <div className='text-sm font-medium text-gray-900'>
                  {isMounted ? (
                    formatPrice(fee)
                  ) : (
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
                <div className='text-base font-medium text-gray-900'>
                  Order Total
                </div>
                <div className='text-right'>
                  <div className='text-base font-bold text-gray-900'>
                    {isMounted ? (
                      formatPrice(cartTotal + fee)
                    ) : (
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                    )}
                  </div>
                  {isMounted && (
                    <div className='text-xs text-muted-foreground'>
                      ≈ {((cartTotal + fee) * 600).toLocaleString('fr-FR')} XOF
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SebPay Payment Method Details */}
            <div className='mt-6 border-t border-gray-200 pt-4'>
              <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                Payment Method
              </p>
              <div className='rounded-lg border-2 border-primary/40 bg-primary/5 p-3 flex items-center justify-between'>
                <div className='flex items-center gap-2.5'>
                  <div className='h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary ring-offset-2' />
                  <div>
                    <div className='flex items-center gap-1.5'>
                      <p className='text-sm font-semibold text-gray-900'>SebPay</p>
                      <span className='rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800'>
                        Live
                      </span>
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Mobile Money (MTN, Moov, Orange) & Cards
                    </p>
                  </div>
                </div>
                <span className='text-xs font-bold text-primary'>XOF</span>
              </div>
            </div>

            <div className='mt-6'>
              <Button
                id='pay-with-sebpay-button'
                disabled={items.length === 0 || isLoading}
                onClick={handleCheckout}
                className='w-full'
                size='lg'>
                {isLoading ? (
                  <Loader2 className='w-4 h-4 animate-spin mr-1.5' />
                ) : null}
                Pay with SebPay
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Page
