'use client'

import Link from 'next/link'
import { buttonVariants } from './ui/button'
import UserAccountNav from './UserAccountNav'
import { useAuth } from '@/hooks/use-auth'

const NavUser = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className='flex items-center space-x-4'>
        <div className='h-8 w-16 bg-gray-100 animate-pulse rounded' />
      </div>
    )
  }

  if (user) {
    return (
      <div className='flex items-center space-x-6'>
        <UserAccountNav user={user} />
        <span className='h-6 w-px bg-gray-200' aria-hidden='true' />
      </div>
    )
  }

  return (
    <div className='flex items-center space-x-6'>
      <Link
        href='/sign-in'
        className={buttonVariants({
          variant: 'ghost',
        })}>
        Sign in
      </Link>

      <span className='h-6 w-px bg-gray-200' aria-hidden='true' />

      <Link
        href='/sign-up'
        className={buttonVariants({
          variant: 'ghost',
        })}>
        Create account
      </Link>

      <span className='h-6 w-px bg-gray-200' aria-hidden='true' />
    </div>
  )
}

export default NavUser
