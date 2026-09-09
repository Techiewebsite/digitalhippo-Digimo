'use client'

import { useEffect, useState } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { auth } from '@/lib/appwrite/auth'
import { useSearchParams } from 'next/navigation'

interface VerifyEmailProps {
  token: string
}

const VerifyEmail = ({ token }: VerifyEmailProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [isError, setIsError] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') || ''

  useEffect(() => {
    let mounted = true
    const verify = async () => {
      try {
        await auth.verifyEmail({ userId, secret: token })
        if (mounted) {
          setIsSuccess(true)
          setIsLoading(false)
        }
      } catch {
        if (mounted) {
          setIsError(true)
          setIsLoading(false)
        }
      }
    }

    verify()

    return () => {
      mounted = false
    }
  }, [token, userId])

  if (isError) {
    return (
      <div className='flex flex-col items-center gap-2'>
        <XCircle className='h-8 w-8 text-red-600' />
        <h3 className='font-semibold text-xl'>
          There was a problem
        </h3>
        <p className='text-muted-foreground text-sm'>
          This token is not valid or might be expired.
          Please try again.
        </p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className='flex h-full flex-col items-center justify-center'>
        <div className='relative mb-4 h-60 w-60 text-muted-foreground'>
          <Image
            src='/hippo-email-sent.png'
            fill
            alt='the email was sent'
          />
        </div>

        <h3 className='font-semibold text-2xl'>
          You&apos;re all set!
        </h3>
        <p className='text-muted-foreground text-center mt-1'>
          Thank you for verifying your email.
        </p>
        <Link
          className={buttonVariants({ className: 'mt-4' })}
          href='/sign-in'>
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center gap-2'>
      <Loader2 className='animate-spin h-8 w-8 text-zinc-300' />
      <h3 className='font-semibold text-xl'>
        Verifying...
      </h3>
      <p className='text-muted-foreground text-sm'>
        This won&apos;t take long.
      </p>
    </div>
  )
}

export default VerifyEmail
