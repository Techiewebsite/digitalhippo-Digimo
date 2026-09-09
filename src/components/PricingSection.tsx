'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Lock,
  Download,
  FolderSync,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingSectionProps {
  className?: string
}

export default function PricingSection({ className }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const handleStartSelling = (planName: string) => {
    if (authLoading) return

    if (user) {
      // User is logged in -> route directly to seller dashboard
      router.push(`/sell?plan=${encodeURIComponent(planName.toLowerCase())}`)
    } else {
      // Unauthenticated -> route to sign-in with origin=sell so they arrive at seller dashboard
      router.push(`/sign-in?as=seller&origin=sell&plan=${encodeURIComponent(planName.toLowerCase())}`)
    }
  }

  return (
    <section
      id='pricing'
      className={cn(
        'relative py-20 overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white',
        className
      )}>
      {/* Subtle ambient backdrop decoration */}
      <div
        className='absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-50/50 blur-3xl pointer-events-none rounded-full'
        aria-hidden='true'
      />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Suspenseful & conversion-focused Intro Header */}
        <div className='text-center max-w-3xl mx-auto mb-12 sm:mb-16'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-4 shadow-xs'>
            <Sparkles className='w-3.5 h-3.5 text-blue-600' />
            <span>Your next sale could start here.</span>
          </div>

          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900'>
            Pick the right plan for you
          </h2>

          <p className='mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto'>
            It’s completely free to get started. We only charge a small transaction fee for every
            sale you make on any of our plans.
          </p>

          <p className='mt-2 text-sm font-medium text-blue-700'>
            Start small. Build your audience. Scale when you&apos;re ready.
          </p>

          {/* Billing & Currency Controls */}
          <div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5'>
            <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider'>
              <span>Currency:</span>
              <span className='font-bold text-gray-900'>XAF</span>
            </div>

            <div
              role='group'
              aria-label='Billing frequency'
              className='inline-flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200/90 shadow-inner'>
              <button
                type='button'
                onClick={() => setBillingCycle('monthly')}
                aria-pressed={billingCycle === 'monthly'}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                )}>
                Monthly
              </button>

              <button
                type='button'
                onClick={() => setBillingCycle('annually')}
                aria-pressed={billingCycle === 'annually'}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                  billingCycle === 'annually'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                )}>
                <span>Annually</span>
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                  save up to 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 xl:gap-8 items-stretch'>
          {/* 1. STARTER PLAN */}
          <div
            className='relative flex flex-col rounded-2xl bg-white border border-gray-200 p-7 sm:p-8 shadow-xs hover:shadow-md transition-shadow duration-200'>
            {/* Free Forever Banner */}
            <div className='inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4'>
              <Zap className='w-3.5 h-3.5 text-emerald-600' />
              <span>YES, IT&apos;S FREE FOREVER!</span>
            </div>

            <h3 className='text-2xl font-bold text-gray-900'>Starter</h3>

            <p className='mt-2 text-sm text-gray-600 min-h-[40px]'>
              With the Starter plan, you can get started selling any kind of product on Bovira for Free.
            </p>

            <div className='mt-6 pb-6 border-b border-gray-100'>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-extrabold text-gray-900'>Free</span>
                <span className='text-sm text-gray-500 font-medium'>/ forever</span>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                No monthly subscription. 0 XAF upfront.
              </p>
            </div>

            {/* Features */}
            <div className='py-6 flex-1'>
              <div className='flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 mb-4'>
                <span className='text-sm font-medium text-gray-700'>Number of products</span>
                <span className='text-base font-bold text-gray-900 px-2.5 py-0.5 rounded-md bg-white border border-gray-200 shadow-2xs'>
                  10
                </span>
              </div>

              <ul className='space-y-3 text-sm text-gray-600'>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Verified seller dashboard</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Instant protected digital downloads</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Secure customer checkout via SebPay</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Unlimited customers & downloads</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className='pt-4 border-t border-gray-100'>
              <Button
                type='button'
                onClick={() => handleStartSelling('Starter')}
                variant='outline'
                className='w-full py-6 text-base font-semibold border-gray-300 hover:border-gray-400 hover:bg-gray-50'>
                <span>Start selling now</span>
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
              <p className='mt-2.5 text-center text-xs text-gray-500'>
                No credit card required to start
              </p>
            </div>
          </div>

          {/* 2. PRO PLAN */}
          <div
            className='relative flex flex-col rounded-2xl bg-white border border-gray-200 p-7 sm:p-8 shadow-xs hover:shadow-md transition-shadow duration-200'>
            <div className='inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 mb-4'>
              <TrendingUp className='w-3.5 h-3.5 text-gray-600' />
              <span>For Growing Creators</span>
            </div>

            <h3 className='text-2xl font-bold text-gray-900'>Pro plan</h3>

            <p className='mt-2 text-sm text-gray-600 min-h-[40px]'>
              Appropriate for creators who are growing their product catalog and expanding sales.
            </p>

            <div className='mt-6 pb-6 border-b border-gray-100'>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-extrabold text-gray-900'>
                  {billingCycle === 'monthly' ? '2,500' : '2,000'}
                </span>
                <span className='text-sm font-semibold text-gray-700'>XAF</span>
                <span className='text-sm text-gray-500 font-medium'>/ month</span>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                {billingCycle === 'annually'
                  ? 'Billed as 24,000 XAF annually (save 6,000 XAF)'
                  : 'Billed monthly. Cancel anytime.'}
              </p>
            </div>

            {/* Features */}
            <div className='py-6 flex-1'>
              <div className='flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 mb-4'>
                <span className='text-sm font-medium text-gray-700'>Number of products</span>
                <span className='text-base font-bold text-gray-900 px-2.5 py-0.5 rounded-md bg-white border border-gray-200 shadow-2xs'>
                  50 products
                </span>
              </div>

              <ul className='space-y-3 text-sm text-gray-600'>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Expanded 50 product catalog</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Verified seller dashboard</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Instant protected digital downloads</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Secure customer checkout via SebPay</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Sales & revenue analytics</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className='pt-4 border-t border-gray-100'>
              <Button
                type='button'
                onClick={() => handleStartSelling('Pro plan')}
                variant='outline'
                className='w-full py-6 text-base font-semibold border-gray-300 hover:border-gray-400 hover:bg-gray-50'>
                <span>Start selling now</span>
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
              <p className='mt-2.5 text-center text-xs text-gray-500'>
                Expand your shop in minutes
              </p>
            </div>
          </div>

          {/* 3. PREMIUM PLAN (RECOMMENDED & EMPHASIZED) */}
          <div
            className='relative flex flex-col rounded-2xl bg-white border-2 border-blue-600 p-7 sm:p-8 shadow-xl lg:-translate-y-2 hover:shadow-2xl transition-all duration-200 ring-4 ring-blue-50'>
            {/* Top Recommendation Badge */}
            <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5'>
              <Sparkles className='w-3.5 h-3.5' />
              <span>RECOMMENDED</span>
            </div>

            <div className='flex items-center justify-between mt-1 mb-2'>
              <h3 className='text-2xl font-bold text-gray-900'>Premium</h3>
              <span className='text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full'>
                Top Tier
              </span>
            </div>

            {/* Power Creators Banner */}
            <div className='inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 mb-3'>
              <span>💪🏼 🚀 FOR POWER CREATORS</span>
            </div>

            <p className='text-sm text-gray-600 min-h-[40px]'>
              For power creators that have a lot of courses and memberships to sell, now you can do so much more!
            </p>

            <div className='mt-5 pb-6 border-b border-gray-100'>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-extrabold text-blue-600'>
                  {billingCycle === 'monthly' ? '5,000' : '4,000'}
                </span>
                <span className='text-sm font-semibold text-gray-700'>XAF</span>
                <span className='text-sm text-gray-500 font-medium'>/ month</span>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                {billingCycle === 'annually'
                  ? 'Billed as 48,000 XAF annually (save 12,000 XAF)'
                  : 'Billed monthly. Scale without limits.'}
              </p>
            </div>

            {/* Features */}
            <div className='py-6 flex-1'>
              <div className='flex items-center justify-between p-3 rounded-lg bg-blue-50/70 border border-blue-100 mb-4'>
                <span className='text-sm font-semibold text-blue-950'>Number of products</span>
                <span className='text-base font-extrabold text-blue-700 px-2.5 py-0.5 rounded-md bg-white border border-blue-200 shadow-2xs'>
                  Unlimited products
                </span>
              </div>

              <ul className='space-y-3 text-sm text-gray-700'>
                <li className='flex items-center gap-2.5 font-medium'>
                  <Check className='w-4 h-4 text-blue-600 shrink-0' />
                  <span>Unlimited digital product uploads</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-blue-600 shrink-0' />
                  <span>Courses, templates, assets & memberships</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-blue-600 shrink-0' />
                  <span>Verified seller status & store profile</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-blue-600 shrink-0' />
                  <span>Instant protected digital delivery</span>
                </li>
                <li className='flex items-center gap-2.5'>
                  <Check className='w-4 h-4 text-blue-600 shrink-0' />
                  <span>Full revenue tracking & order management</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className='pt-4 border-t border-gray-100'>
              <Button
                type='button'
                onClick={() => handleStartSelling('Premium')}
                className='w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all'>
                <span>Start selling now</span>
                <Rocket className='w-4 h-4 ml-2' />
              </Button>
              <p className='mt-2.5 text-center text-xs text-blue-900/80 font-medium'>
                Empower your creator business
              </p>
            </div>
          </div>
        </div>

        {/* Tasteful Trust & Capabilities Section */}
        <div className='mt-16 sm:mt-20 pt-12 border-t border-gray-200'>
          <div className='text-center max-w-2xl mx-auto mb-10'>
            <h3 className='text-xl sm:text-2xl font-bold text-gray-900'>
              Built for creators who want to sell more.
            </h3>
            <p className='mt-2 text-sm text-gray-600'>
              Everything you need to deliver high-quality digital goods reliably.
            </p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 text-center'>
            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center'>
                <Check className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Start for free</span>
            </div>

            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center'>
                <Rocket className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Sell digital products</span>
            </div>

            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center'>
                <Lock className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Secure checkout</span>
            </div>

            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center'>
                <Download className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Protected digital downloads</span>
            </div>

            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center'>
                <FolderSync className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Grow your product catalog</span>
            </div>

            <div className='p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center'>
                <TrendingUp className='w-4 h-4' />
              </div>
              <span className='text-xs sm:text-sm font-semibold text-gray-800'>Upgrade when you&apos;re ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
