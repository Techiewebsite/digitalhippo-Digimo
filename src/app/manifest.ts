import { MetadataRoute } from 'next'
import { SITE_CONFIG, SITE_LOGO_URL } from '@/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.name,
    short_name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: SITE_LOGO_URL,
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
  }
}
