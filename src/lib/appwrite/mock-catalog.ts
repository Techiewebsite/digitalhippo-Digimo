import { Product } from '@/types'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_ui_clean_modern',
    name: 'Modern Clean UI Kit',
    description:
      'A comprehensive, production-ready design system and component library built for rapid application prototyping. Includes 80+ handcrafted components, full responsive grids, typography styles, and dark/light tokens.',
    price: 49,
    category: 'ui_kits',
    approvedForSale: 'approved',
    priceId: 'price_ui_clean_modern',
    product_files: {
      id: 'file_ui_clean_modern',
      url: '/nav/ui-kits/blue.jpg',
      filename: 'modern-clean-ui-kit.zip',
      filesize: 14500000,
    },
    images: [
      {
        id: 'img_1',
        image: {
          id: 'med_1',
          url: '/nav/ui-kits/blue.jpg',
          filename: 'blue.jpg',
        },
      },
      {
        id: 'img_2',
        image: {
          id: 'med_2',
          url: '/nav/ui-kits/mixed.jpg',
          filename: 'mixed.jpg',
        },
      },
    ],
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 'prod_ui_purple_flow',
    name: 'Purple Flow Dashboard Kit',
    description:
      'Sleek and polished dashboard layouts tailored for SaaS metrics, charts, billing portals, and analytics. Fully layered and optimized with auto-layout variants.',
    price: 59,
    category: 'ui_kits',
    approvedForSale: 'approved',
    priceId: 'price_ui_purple_flow',
    product_files: {
      id: 'file_ui_purple_flow',
      url: '/nav/ui-kits/purple.jpg',
      filename: 'purple-flow-kit.zip',
      filesize: 18200000,
    },
    images: [
      {
        id: 'img_3',
        image: {
          id: 'med_3',
          url: '/nav/ui-kits/purple.jpg',
          filename: 'purple.jpg',
        },
      },
      {
        id: 'img_4',
        image: {
          id: 'med_4',
          url: '/nav/ui-kits/mixed.jpg',
          filename: 'mixed.jpg',
        },
      },
    ],
    createdAt: '2026-02-01T14:30:00.000Z',
    updatedAt: '2026-02-01T14:30:00.000Z',
  },
  {
    id: 'prod_icons_essential_line',
    name: 'Essential Line Icon Set',
    description:
      'Over 600 consistent, pixel-perfect 24px stroke icons across 12 categories: navigation, commerce, media, system, social, communication, and devices. Available in SVG, PNG, and React components.',
    price: 29,
    category: 'icons',
    approvedForSale: 'approved',
    priceId: 'price_icons_essential_line',
    product_files: {
      id: 'file_icons_essential',
      url: '/nav/icons/picks.jpg',
      filename: 'essential-line-icons.zip',
      filesize: 8900000,
    },
    images: [
      {
        id: 'img_5',
        image: {
          id: 'med_5',
          url: '/nav/icons/picks.jpg',
          filename: 'picks.jpg',
        },
      },
      {
        id: 'img_6',
        image: {
          id: 'med_6',
          url: '/nav/icons/new.jpg',
          filename: 'new.jpg',
        },
      },
    ],
    createdAt: '2026-02-10T09:15:00.000Z',
    updatedAt: '2026-02-10T09:15:00.000Z',
  },
  {
    id: 'prod_icons_solid_bestseller',
    name: 'Bestseller Solid Glyphs',
    description:
      'Bold, filled glyph icons crafted for high-contrast UI states, mobile navigation bars, and marketing badges. Vector-optimized with optical balance.',
    price: 35,
    category: 'icons',
    approvedForSale: 'approved',
    priceId: 'price_icons_solid_bestseller',
    product_files: {
      id: 'file_icons_bestseller',
      url: '/nav/icons/bestsellers.jpg',
      filename: 'solid-glyphs.zip',
      filesize: 11400000,
    },
    images: [
      {
        id: 'img_7',
        image: {
          id: 'med_7',
          url: '/nav/icons/bestsellers.jpg',
          filename: 'bestsellers.jpg',
        },
      },
      {
        id: 'img_8',
        image: {
          id: 'med_8',
          url: '/nav/icons/new.jpg',
          filename: 'new.jpg',
        },
      },
    ],
    createdAt: '2026-02-18T16:45:00.000Z',
    updatedAt: '2026-02-18T16:45:00.000Z',
  },
  {
    id: 'prod_ui_mixed_craft',
    name: 'Craft Mobile App UI Kit',
    description:
      'High-conversion mobile application flows covering onboarding, checkout, profile settings, social feeds, and search filtering. Built for iOS and Android layouts.',
    price: 55,
    category: 'ui_kits',
    approvedForSale: 'approved',
    priceId: 'price_ui_mixed_craft',
    product_files: {
      id: 'file_ui_craft',
      url: '/nav/ui-kits/mixed.jpg',
      filename: 'craft-mobile-kit.zip',
      filesize: 22100000,
    },
    images: [
      {
        id: 'img_9',
        image: {
          id: 'med_9',
          url: '/nav/ui-kits/mixed.jpg',
          filename: 'mixed.jpg',
        },
      },
      {
        id: 'img_10',
        image: {
          id: 'med_10',
          url: '/nav/ui-kits/blue.jpg',
          filename: 'blue.jpg',
        },
      },
    ],
    createdAt: '2026-03-01T11:00:00.000Z',
    updatedAt: '2026-03-01T11:00:00.000Z',
  },
  {
    id: 'prod_icons_duotone_creative',
    name: 'Creative Studio Duo-Tone Icons',
    description:
      'Expressive two-tone colored vector iconography with secondary opacity highlights. Perfect for modern web products, creative agency showcases, and tech dashboards.',
    price: 39,
    category: 'icons',
    approvedForSale: 'approved',
    priceId: 'price_icons_duotone',
    product_files: {
      id: 'file_icons_duotone',
      url: '/nav/icons/new.jpg',
      filename: 'creative-duotone-icons.zip',
      filesize: 9800000,
    },
    images: [
      {
        id: 'img_11',
        image: {
          id: 'med_11',
          url: '/nav/icons/new.jpg',
          filename: 'new.jpg',
        },
      },
      {
        id: 'img_12',
        image: {
          id: 'med_12',
          url: '/nav/icons/picks.jpg',
          filename: 'picks.jpg',
        },
      },
    ],
    createdAt: '2026-03-05T13:20:00.000Z',
    updatedAt: '2026-03-05T13:20:00.000Z',
  },
]
