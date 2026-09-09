'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PaymentStatusProps {
  orderEmail: string
  orderId: string
  isPaid: boolean
}

type StatusType = 'PAID' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'CANCELLED' | 'EXPIRED'

const PaymentStatus = ({
  orderEmail,
  orderId,
  isPaid: initialIsPaid,
}: PaymentStatusProps) => {
  const router = useRouter()

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/verify-payment?orderId=${orderId}`)
      if (!res.ok) {
        return { isPaid: initialIsPaid, status: initialIsPaid ? 'PAID' : 'PENDING' }
      }
      return res.json()
    },
    enabled: true,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status
      if (currentStatus === 'PAID' || currentStatus === 'FAILED' || currentStatus === 'CANCELLED') {
        return false
      }
      return 3000
    },
  })

  const currentStatus: StatusType =
    (data?.status as StatusType) || (initialIsPaid ? 'PAID' : 'PENDING')
  const isPaid = currentStatus === 'PAID' || initialIsPaid || Boolean(data?.isPaid)

  useEffect(() => {
    if (data?.isPaid && !initialIsPaid) {
      router.refresh()
    }
  }, [data?.isPaid, initialIsPaid, router])

  return (
    <div className='mt-8 space-y-6'>
      {/* Real-time Status Card */}
      <div className='rounded-xl border p-5 bg-white shadow-sm'>
        {isPaid ? (
          <div className='space-y-3' id='payment-status-paid'>
            <div className='flex items-center gap-3 text-emerald-600'>
              <CheckCircle2 className='h-6 w-6 flex-shrink-0' />
              <div>
                <h4 className='font-semibold text-gray-900'>Payment successful</h4>
                <p className='text-sm text-gray-600'>
                  Your payment has been confirmed. Your digital product is now available in your purchases.
                </p>
              </div>
            </div>
            <div className='pt-2 flex flex-wrap gap-2'>
              <Button asChild size='sm' className='gap-1.5' id='view-my-purchases-btn'>
                <Link href='/sell'>
                  View My Purchases
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            </div>
          </div>
        ) : currentStatus === 'FAILED' ? (
          <div className='space-y-3' id='payment-status-failed'>
            <div className='flex items-center gap-3 text-red-600'>
              <XCircle className='h-6 w-6 flex-shrink-0' />
              <div>
                <h4 className='font-semibold text-gray-900'>Payment failed</h4>
                <p className='text-sm text-gray-600'>
                  We could not confirm your payment.
                </p>
              </div>
            </div>
            <div className='pt-2 flex flex-wrap gap-2'>
              <Button asChild variant='destructive' size='sm' id='try-again-btn'>
                <Link href='/cart'>
                  <RefreshCw className='h-4 w-4 mr-1.5' />
                  Try Again
                </Link>
              </Button>
            </div>
          </div>
        ) : currentStatus === 'CANCELLED' ? (
          <div className='space-y-3' id='payment-status-cancelled'>
            <div className='flex items-center gap-3 text-amber-600'>
              <AlertCircle className='h-6 w-6 flex-shrink-0' />
              <div>
                <h4 className='font-semibold text-gray-900'>Payment cancelled</h4>
                <p className='text-sm text-gray-600'>
                  Your payment was cancelled.
                </p>
              </div>
            </div>
            <div className='pt-2 flex flex-wrap gap-2'>
              <Button asChild variant='outline' size='sm' id='return-to-checkout-btn'>
                <Link href='/cart'>
                  <ShoppingCart className='h-4 w-4 mr-1.5' />
                  Return to Checkout
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-3' id='payment-status-pending'>
            <div className='flex items-center gap-3 text-amber-600'>
              <Clock className='h-6 w-6 flex-shrink-0 animate-spin text-amber-500' />
              <div>
                <h4 className='font-semibold text-gray-900'>Payment pending</h4>
                <p className='text-sm text-gray-600'>
                  Your payment is still being processed. We will update your order when payment is confirmed.
                </p>
              </div>
            </div>
            <div className='pt-2 flex items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => refetch()}
                disabled={isFetching}
                id='check-payment-status-btn'
                className='gap-1.5'>
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                Check Payment Status
              </Button>
              {isFetching && (
                <span className='text-xs text-muted-foreground'>Checking SebPay gateway...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order & Delivery Details */}
      <div className='grid grid-cols-2 gap-x-4 text-sm text-gray-600 border-t pt-4'>
        <div>
          <p className='font-medium text-gray-900'>Recipient Email</p>
          <p className='text-gray-600 text-xs sm:text-sm mt-0.5'>{orderEmail}</p>
        </div>

        <div>
          <p className='font-medium text-gray-900'>Order ID</p>
          <p className='font-mono text-xs text-gray-600 mt-0.5 truncate'>{orderId}</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentStatus
