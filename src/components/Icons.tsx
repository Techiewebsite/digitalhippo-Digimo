import Image from 'next/image'
import { SITE_LOGO_URL, SITE_NAME } from '@/config'

export interface LogoProps {
  className?: string
  width?: number
  height?: number
  alt?: string
}

export const Icons = {
  logo: ({
    className,
    alt = SITE_NAME,
    width = 80,
    height = 80,
  }: LogoProps) => (
    <Image
      src={SITE_LOGO_URL}
      alt={alt}
      width={width}
      height={height}
      className={className || 'h-10 w-10 object-contain'}
      priority
    />
  ),
}
