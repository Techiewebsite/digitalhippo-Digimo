'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { ArrowRight, Sparkles, Store } from 'lucide-react'

export default function BecomeSellerHeroCard() {
  const { user } = useAuth()
  const destinationHref = user ? '/sell' : '/sign-in?as=seller&origin=sell'

  return (
    <div className='relative w-full max-w-2xl my-7 text-left group'>
      {/* Eye-catching animated gradient border glow */}
      <div
        className='absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-80 blur-[2px] transition duration-500 group-hover:opacity-100 group-hover:blur-xs animate-gradient-x motion-reduce:animate-none'
        aria-hidden='true'
      />

      {/* Main Card Container */}
      <div className='relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white/95 backdrop-blur-xs p-5 sm:px-6 sm:py-5 border border-blue-100 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300'>
        <div className='flex items-start gap-3.5 flex-1'>
          <div className='hidden sm:flex shrink-0 w-11 h-11 rounded-xl bg-blue-50 text-blue-600 items-center justify-center border border-blue-100/80 shadow-2xs group-hover:scale-105 transition-transform duration-300'>
            <Store className='w-5 h-5' />
          </div>

          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80'>
                <span className='relative flex h-1.5 w-1.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 motion-reduce:animate-none' />
                  <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600' />
                </span>
                <Sparkles className='w-3 h-3 text-blue-600' />
                <span>Creator Marketplace</span>
              </span>
            </div>

            <h3 className='font-bold text-gray-900 text-lg sm:text-xl tracking-tight flex items-center gap-1.5'>
              Become a seller
            </h3>

            <p className='mt-1 text-sm text-gray-600 leading-snug'>
              If you&apos;d like to sell high-quality digital products, you can do so in
              minutes.{' '}
              <Link
                href={destinationHref}
                className='font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 underline-offset-4 hover:underline sm:hidden'>
                <span>Get started</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </Link>
            </p>
          </div>
        </div>

        {/* Action Button for desktop / tablet */}
        <div className='w-full sm:w-auto shrink-0 flex justify-end'>
          <Link
            href={destinationHref}
            className='w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 group/btn focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'>
            <span>Get started</span>
            <ArrowRight className='w-4 h-4 transition-transform group-hover/btn:translate-x-1' />
          </Link>
        </div>
      </div>
    </div>
  )
}
