const { Client, Databases, Storage, Permission, Role, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const fs = require('fs');
const path = require('path');

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a9b4399000ba2817e08';
const DATABASE_ID = '6aa0a8f00015379a297f';
const BUCKET_ID = '6aa10cbe000dad323c41';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('ERROR: APPWRITE_API_KEY is not set in environment.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// Common standard permissions
const PUBLIC_READ_PERMS = [Permission.read(Role.any())];
const OPEN_PERMS = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

const COLLECTIONS_SPEC = [
  {
    id: 'users',
    name: 'Users',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'avatar', type: 'string', size: 2048, required: false },
      { key: 'role', type: 'string', size: 32, required: false, default: 'user' },
      { key: 'sellerStatus', type: 'string', size: 32, required: false, default: 'NONE' },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_users_userId', type: 'unique', attributes: ['userId'] },
      { key: 'idx_users_email', type: 'key', attributes: ['email'] },
    ],
  },
  {
    id: 'categories',
    name: 'Categories',
    permissions: PUBLIC_READ_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'slug', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2048, required: false },
      { key: 'image', type: 'string', size: 2048, required: false },
      { key: 'parentId', type: 'string', size: 255, required: false },
      { key: 'active', type: 'boolean', required: false, default: true },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_categories_slug', type: 'unique', attributes: ['slug'] },
      { key: 'idx_categories_active', type: 'key', attributes: ['active'] },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    permissions: PUBLIC_READ_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: false },
      { key: 'slug', type: 'string', size: 255, required: false },
      { key: 'description', type: 'string', size: 10000, required: false },
      { key: 'price', type: 'float', required: true },
      { key: 'currency', type: 'string', size: 16, required: false, default: 'XOF' },
      { key: 'categoryId', type: 'string', size: 128, required: false, default: 'ui_kits' },
      { key: 'category', type: 'string', size: 128, required: false, default: 'ui_kits' },
      { key: 'sellerId', type: 'string', size: 128, required: false, default: 'seller_official' },
      { key: 'thumbnail', type: 'string', size: 2048, required: false },
      { key: 'imageUrl', type: 'string', size: 2048, required: false },
      { key: 'images', type: 'string', size: 2048, required: false, array: true },
      { key: 'fileId', type: 'string', size: 128, required: false },
      { key: 'fileIds', type: 'string', size: 128, required: false, array: true },
      { key: 'fileUrl', type: 'string', size: 2048, required: false },
      { key: 'approvedForSale', type: 'string', size: 32, required: false, default: 'approved' },
      { key: 'priceId', type: 'string', size: 128, required: false },
      { key: 'stripeId', type: 'string', size: 128, required: false },
      { key: 'published', type: 'boolean', required: false, default: true },
      { key: 'featured', type: 'boolean', required: false, default: false },
      { key: 'downloadCount', type: 'integer', required: false, default: 0 },
      { key: 'salesCount', type: 'integer', required: false, default: 0 },
      { key: 'rating', type: 'float', required: false, default: 0 },
      { key: 'reviewCount', type: 'integer', required: false, default: 0 },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_products_category', type: 'key', attributes: ['category'] },
      { key: 'idx_products_published', type: 'key', attributes: ['published'] },
      { key: 'idx_products_approved', type: 'key', attributes: ['approvedForSale'] },
    ],
  },
  {
    id: 'orders',
    name: 'Orders',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: false },
      { key: 'userEmail', type: 'string', size: 255, required: false },
      { key: 'customerEmail', type: 'string', size: 255, required: false },
      { key: 'customerName', type: 'string', size: 255, required: false },
      { key: 'customerPhone', type: 'string', size: 64, required: false },
      { key: 'productIds', type: 'string', size: 128, required: false, array: true },
      { key: 'amount', type: 'integer', required: false, default: 0 },
      { key: 'currency', type: 'string', size: 16, required: false, default: 'XOF' },
      { key: 'paymentProvider', type: 'string', size: 32, required: false, default: 'sebpay' },
      { key: 'paymentStatus', type: 'string', size: 32, required: false, default: 'PENDING' },
      { key: 'orderStatus', type: 'string', size: 32, required: false, default: 'pending' },
      { key: 'isPaid', type: 'boolean', required: false, default: false },
      { key: 'sebpayTransactionId', type: 'string', size: 255, required: false },
      { key: 'sebpayReference', type: 'string', size: 255, required: false },
      { key: 'sebpayPaymentUrl', type: 'string', size: 2048, required: false },
      { key: 'paidAt', type: 'string', size: 128, required: false },
      { key: 'failureReason', type: 'string', size: 1000, required: false },
      { key: 'paymentAttempts', type: 'integer', required: false, default: 0 },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_orders_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_orders_paymentStatus', type: 'key', attributes: ['paymentStatus'] },
      { key: 'idx_orders_isPaid', type: 'key', attributes: ['isPaid'] },
      { key: 'idx_orders_sebpayRef', type: 'key', attributes: ['sebpayReference'] },
    ],
  },
  {
    id: 'purchases',
    name: 'Purchases',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'orderId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'userEmail', type: 'string', size: 255, required: false },
      { key: 'grantedAt', type: 'string', size: 128, required: false },
      { key: 'downloadCount', type: 'integer', required: false, default: 0 },
      { key: 'lastDownloadedAt', type: 'string', size: 128, required: false },
      { key: 'status', type: 'string', size: 32, required: false, default: 'ACTIVE' },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_purchases_user_prod', type: 'key', attributes: ['userId', 'productId'] },
      { key: 'idx_purchases_order_prod', type: 'key', attributes: ['orderId', 'productId'] },
      { key: 'idx_purchases_orderId', type: 'key', attributes: ['orderId'] },
    ],
  },
  {
    id: 'reviews',
    name: 'Reviews',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'rating', type: 'integer', required: true, min: 1, max: 5 },
      { key: 'comment', type: 'string', size: 2048, required: false },
      { key: 'userName', type: 'string', size: 255, required: false },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_reviews_productId', type: 'key', attributes: ['productId'] },
      { key: 'idx_reviews_userId', type: 'key', attributes: ['userId'] },
    ],
  },
  {
    id: 'cart',
    name: 'Cart',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'productIds', type: 'string', size: 128, required: false, array: true },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_cart_userId', type: 'unique', attributes: ['userId'] },
    ],
  },
  {
    id: 'wishlist',
    name: 'Wishlist',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_wishlist_user_prod', type: 'key', attributes: ['userId', 'productId'] },
    ],
  },
  {
    id: 'coupons',
    name: 'Coupons',
    permissions: PUBLIC_READ_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'code', type: 'string', size: 64, required: true },
      { key: 'discountType', type: 'string', size: 32, required: false, default: 'PERCENTAGE' },
      { key: 'discountValue', type: 'float', required: false, default: 10 },
      { key: 'maxUses', type: 'integer', required: false, default: 100 },
      { key: 'usedCount', type: 'integer', required: false, default: 0 },
      { key: 'expiresAt', type: 'string', size: 128, required: false },
      { key: 'active', type: 'boolean', required: false, default: true },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_coupons_code', type: 'unique', attributes: ['code'] },
    ],
  },
  {
    id: 'sellers',
    name: 'Sellers',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'storeName', type: 'string', size: 255, required: true },
      { key: 'storeSlug', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2048, required: false },
      { key: 'logo', type: 'string', size: 2048, required: false },
      { key: 'status', type: 'string', size: 32, required: false, default: 'ACTIVE' },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_sellers_userId', type: 'unique', attributes: ['userId'] },
      { key: 'idx_sellers_storeSlug', type: 'unique', attributes: ['storeSlug'] },
    ],
  },
  {
    id: 'product_files',
    name: 'Product Files',
    permissions: OPEN_PERMS,
    documentSecurity: false,
    attributes: [
      { key: 'productId', type: 'string', size: 128, required: false },
      { key: 'fileId', type: 'string', size: 128, required: false },
      { key: 'bucketId', type: 'string', size: 128, required: false, default: BUCKET_ID },
      { key: 'filename', type: 'string', size: 255, required: false },
      { key: 'filesize', type: 'integer', required: false, default: 0 },
      { key: 'mimeType', type: 'string', size: 128, required: false },
      { key: 'url', type: 'string', size: 2048, required: false },
      { key: 'createdAt', type: 'string', size: 128, required: false },
      { key: 'updatedAt', type: 'string', size: 128, required: false },
    ],
    indexes: [
      { key: 'idx_files_productId', type: 'key', attributes: ['productId'] },
    ],
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureCollection(spec) {
  console.log(`\n--- Ensuring Collection: ${spec.name} (${spec.id}) ---`);
  let collection;
  try {
    collection = await databases.getCollection(DATABASE_ID, spec.id);
    console.log(`Collection ${spec.id} already exists.`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`Creating collection ${spec.id}...`);
      collection = await databases.createCollection(
        DATABASE_ID,
        spec.id,
        spec.name,
        spec.permissions,
        spec.documentSecurity
      );
      console.log(`Collection ${spec.id} created successfully.`);
    } else {
      throw err;
    }
  }

  // Fetch existing attributes
  const existingAttrsRes = await databases.listAttributes(DATABASE_ID, spec.id);
  const existingKeys = new Set(existingAttrsRes.attributes.map((a) => a.key));

  // Create missing attributes
  for (const attr of spec.attributes) {
    if (existingKeys.has(attr.key)) {
      continue;
    }

    console.log(`Creating attribute: ${spec.id}.${attr.key} (${attr.type})`);
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          spec.id,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array
        );
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          spec.id,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default,
          attr.array
        );
      } else if (attr.type === 'float') {
        await databases.createFloatAttribute(
          DATABASE_ID,
          spec.id,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default,
          attr.array
        );
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          spec.id,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
      }
    } catch (err) {
      console.warn(`Warning creating attribute ${attr.key}:`, err.message);
    }
  }

  // Poll until all attributes are in 'available' status
  console.log(`Waiting for attributes in ${spec.id} to become available...`);
  let attempts = 0;
  while (attempts < 30) {
    const checkAttrs = await databases.listAttributes(DATABASE_ID, spec.id);
    const pending = checkAttrs.attributes.filter((a) => a.status === 'processing');
    if (pending.length === 0) {
      console.log(`All attributes in ${spec.id} are available.`);
      break;
    }
    console.log(`  Waiting for ${pending.length} attribute(s) to process: ${pending.map((p) => p.key).join(', ')}...`);
    await sleep(2000);
    attempts++;
  }

  // Create missing indexes
  if (spec.indexes && spec.indexes.length > 0) {
    const existingIdxRes = await databases.listIndexes(DATABASE_ID, spec.id);
    const existingIdxKeys = new Set(existingIdxRes.indexes.map((i) => i.key));

    for (const idx of spec.indexes) {
      if (existingIdxKeys.has(idx.key)) {
        continue;
      }

      console.log(`Creating index: ${spec.id}.${idx.key} on [${idx.attributes.join(', ')}]`);
      try {
        await databases.createIndex(
          DATABASE_ID,
          spec.id,
          idx.key,
          idx.type,
          idx.attributes
        );
      } catch (err) {
        console.warn(`Warning creating index ${idx.key}:`, err.message);
      }
    }
  }
}

async function uploadProductDigitalAsset(productId, filename, name) {
  try {
    const fileId = `asset_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36);
    
    // Check if file already exists in bucket 6aa10cbe000dad323c41
    try {
      const existing = await storage.getFile(BUCKET_ID, fileId);
      if (existing) {
        console.log(`Digital asset ${fileId} already exists in bucket ${BUCKET_ID}.`);
        return fileId;
      }
    } catch (e) {
      // Not found, proceed to upload
    }

    console.log(`Uploading digital asset ${filename} for ${name} into bucket ${BUCKET_ID}...`);
    // Create package content
    const content = Buffer.from(
      `DigitalHippo Digital Product Package\n` +
      `Product: ${name}\n` +
      `Product ID: ${productId}\n` +
      `Filename: ${filename}\n` +
      `Storage Bucket: ${BUCKET_ID}\n` +
      `Delivered through SebPay Verified Fulfillment.\n` +
      `Timestamp: ${new Date().toISOString()}\n`
    );

    const inputFile = InputFile.fromBuffer(content, filename);
    const uploaded = await storage.createFile(
      BUCKET_ID,
      fileId,
      inputFile,
      [Permission.read(Role.any())]
    );

    console.log(`Successfully uploaded digital asset ${fileId} to bucket ${BUCKET_ID}.`);
    return uploaded.$id;
  } catch (err) {
    console.warn(`Error uploading digital asset for ${productId}:`, err.message);
    return `file_${productId}`;
  }
}

async function seedInitialData() {
  console.log('\n--- Seeding Initial Data into Database 6aa0a8f00015379a297f ---');

  // 1. Seed Categories
  const categories = [
    {
      id: 'cat_ui_kits',
      name: 'UI Kits',
      slug: 'ui_kits',
      description: 'Handcrafted production UI kits, themes, and design components.',
      image: '/nav/ui-kits/mixed.jpg',
      active: true,
    },
    {
      id: 'cat_icons',
      name: 'Icons',
      slug: 'icons',
      description: 'Pixel-perfect vector icons, SVGs, and icon libraries.',
      image: '/nav/icons/picks.jpg',
      active: true,
    },
  ];

  for (const cat of categories) {
    try {
      const existing = await databases.getDocument(DATABASE_ID, 'categories', cat.id);
      console.log(`Category ${cat.slug} already exists.`);
    } catch (err) {
      if (err.code === 404) {
        console.log(`Creating category: ${cat.name} (${cat.slug})`);
        await databases.createDocument(DATABASE_ID, 'categories', cat.id, {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          active: cat.active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Seed Official Seller
  try {
    await databases.getDocument(DATABASE_ID, 'sellers', 'seller_official');
    console.log('Seller seller_official already exists.');
  } catch (err) {
    if (err.code === 404) {
      console.log('Creating official seller store...');
      await databases.createDocument(DATABASE_ID, 'sellers', 'seller_official', {
        userId: 'admin_digitalhippo',
        storeName: 'DigitalHippo Studio',
        storeSlug: 'digitalhippo-studio',
        description: 'Official verified digital creations, themes, and developer assets.',
        logo: '/favicon.ico',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 3. Seed Coupons
  const coupons = [
    {
      id: 'coup_welcome10',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 1000,
      usedCount: 0,
      active: true,
    },
    {
      id: 'coup_digital20',
      code: 'DIGITAL20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxUses: 500,
      usedCount: 0,
      active: true,
    },
  ];

  for (const c of coupons) {
    try {
      await databases.getDocument(DATABASE_ID, 'coupons', c.id);
      console.log(`Coupon ${c.code} already exists.`);
    } catch (err) {
      if (err.code === 404) {
        console.log(`Creating coupon: ${c.code}`);
        await databases.createDocument(DATABASE_ID, 'coupons', c.id, {
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          active: c.active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 4. Seed Products and upload their digital files into bucket 6aa10cbe000dad323c41
  const INITIAL_PRODUCTS = [
    {
      id: 'prod_ui_clean_modern',
      name: 'Modern Clean UI Kit',
      description: 'A comprehensive, production-ready design system and component library built for rapid application prototyping. Includes 80+ handcrafted components, full responsive grids, typography styles, and dark/light tokens.',
      price: 49,
      category: 'ui_kits',
      approvedForSale: 'approved',
      priceId: 'price_ui_clean_modern',
      filename: 'modern-clean-ui-kit.zip',
      imageUrl: '/nav/ui-kits/blue.jpg',
      images: ['/nav/ui-kits/blue.jpg', '/nav/ui-kits/mixed.jpg'],
      rating: 4.9,
      reviewCount: 28,
      salesCount: 142,
    },
    {
      id: 'prod_ui_purple_flow',
      name: 'Purple Flow Dashboard Kit',
      description: 'Sleek and polished dashboard layouts tailored for SaaS metrics, charts, billing portals, and analytics. Fully layered and optimized with auto-layout variants.',
      price: 59,
      category: 'ui_kits',
      approvedForSale: 'approved',
      priceId: 'price_ui_purple_flow',
      filename: 'purple-flow-kit.zip',
      imageUrl: '/nav/ui-kits/purple.jpg',
      images: ['/nav/ui-kits/purple.jpg', '/nav/ui-kits/mixed.jpg'],
      rating: 4.8,
      reviewCount: 19,
      salesCount: 88,
    },
    {
      id: 'prod_ui_gradient_system',
      name: 'Vibrant Design Tokens & System',
      description: 'Ultra-modern UI component set leveraging colorful accents, glassmorphic cards, responsive navigation headers, and modal systems.',
      price: 39,
      category: 'ui_kits',
      approvedForSale: 'approved',
      priceId: 'price_ui_gradient_system',
      filename: 'vibrant-design-tokens.zip',
      imageUrl: '/nav/ui-kits/mixed.jpg',
      images: ['/nav/ui-kits/mixed.jpg', '/nav/ui-kits/blue.jpg'],
      rating: 4.7,
      reviewCount: 15,
      salesCount: 64,
    },
    {
      id: 'prod_ico_essential_mono',
      name: 'Essential Line Icons Pack',
      description: '450+ crisp, geometric line icons crafted on a precise 24px grid. Exported in clean SVG format with React component wrappers included.',
      price: 24,
      category: 'icons',
      approvedForSale: 'approved',
      priceId: 'price_ico_essential_mono',
      filename: 'essential-line-icons.zip',
      imageUrl: '/nav/icons/picks.jpg',
      images: ['/nav/icons/picks.jpg', '/nav/icons/new.jpg'],
      rating: 5.0,
      reviewCount: 34,
      salesCount: 230,
    },
    {
      id: 'prod_ico_duotone_bold',
      name: 'Duotone Bold UI Icons',
      description: 'Modern two-tone icon set designed for vibrant consumer web apps and mobile interfaces. Includes Figma component libraries and SVG sprites.',
      price: 29,
      category: 'icons',
      approvedForSale: 'approved',
      priceId: 'price_ico_duotone_bold',
      filename: 'duotone-bold-icons.zip',
      imageUrl: '/nav/icons/new.jpg',
      images: ['/nav/icons/new.jpg', '/nav/icons/bestsellers.jpg'],
      rating: 4.9,
      reviewCount: 22,
      salesCount: 115,
    },
    {
      id: 'prod_ico_crypto_fintech',
      name: 'FinTech & Payments Glyph Set',
      description: 'Over 200 tailored glyphs and badges covering currencies, wallets, payment gateways, credit cards, bank transfers, and financial metrics.',
      price: 34,
      category: 'icons',
      approvedForSale: 'approved',
      priceId: 'price_ico_crypto_fintech',
      filename: 'fintech-glyph-icons.zip',
      imageUrl: '/nav/icons/bestsellers.jpg',
      images: ['/nav/icons/bestsellers.jpg', '/nav/icons/picks.jpg'],
      rating: 4.8,
      reviewCount: 16,
      salesCount: 97,
    },
  ];

  for (const prod of INITIAL_PRODUCTS) {
    // 1. Upload asset to bucket 6aa10cbe000dad323c41
    const assetFileId = await uploadProductDigitalAsset(prod.id, prod.filename, prod.name);

    // 2. Insert or update product in products collection
    try {
      await databases.getDocument(DATABASE_ID, 'products', prod.id);
      console.log(`Product ${prod.name} (${prod.id}) already exists in products collection.`);
    } catch (err) {
      if (err.code === 404) {
        console.log(`Creating product: ${prod.name} (${prod.id}) in products collection...`);
        await databases.createDocument(DATABASE_ID, 'products', prod.id, {
          name: prod.name,
          title: prod.name,
          slug: prod.id,
          description: prod.description,
          price: prod.price,
          currency: 'XOF',
          categoryId: prod.category,
          category: prod.category,
          sellerId: 'seller_official',
          thumbnail: prod.imageUrl,
          imageUrl: prod.imageUrl,
          images: prod.images,
          fileId: assetFileId,
          fileIds: [assetFileId],
          approvedForSale: 'approved',
          priceId: prod.priceId,
          published: true,
          featured: true,
          downloadCount: 0,
          salesCount: prod.salesCount,
          rating: prod.rating,
          reviewCount: prod.reviewCount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Product ${prod.id} created.`);
      }
    }

    // 3. Ensure product_files record points to bucket 6aa10cbe000dad323c41
    try {
      const fileDocId = `pfile_${prod.id}`.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36);
      try {
        await databases.getDocument(DATABASE_ID, 'product_files', fileDocId);
      } catch (e) {
        if (e.code === 404) {
          await databases.createDocument(DATABASE_ID, 'product_files', fileDocId, {
            productId: prod.id,
            fileId: assetFileId,
            bucketId: BUCKET_ID,
            filename: prod.filename,
            filesize: 15000000,
            mimeType: 'application/zip',
            url: `/api/download?productId=${prod.id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`Registered product_file record for ${prod.id}`);
        }
      }
    } catch (err) {
      console.warn(`Warning writing product_file for ${prod.id}:`, err.message);
    }
  }
}

async function runMigration() {
  console.log('====================================================');
  console.log('Starting DigitalHippo Appwrite Infrastructure Migration');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Database ID: ${DATABASE_ID}`);
  console.log(`Bucket ID: ${BUCKET_ID}`);
  console.log('====================================================');

  for (const spec of COLLECTIONS_SPEC) {
    await ensureCollection(spec);
  }

  await seedInitialData();

  console.log('\n====================================================');
  console.log('Appwrite Infrastructure Migration Completed Successfully!');
  console.log('====================================================');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
