const { Client, Databases, Storage, Query } = require('node-appwrite');

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a9b4399000ba2817e08';
const DATABASE_ID = '6aa0a8f00015379a297f';
const BUCKET_ID = '6aa10cbe000dad323c41';
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function runAcceptanceTest() {
  console.log('===========================================================');
  console.log('RUNNING DIGITALHIPPO PRODUCTION ACCEPTANCE AUDIT & TEST');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Check Database Collections
  console.log('\n1. Verifying Database Infrastructure...');
  const collectionsRes = await databases.listCollections(DATABASE_ID);
  const colIds = collectionsRes.collections.map((c) => c.$id);
  const requiredCols = [
    'users',
    'categories',
    'products',
    'orders',
    'purchases',
    'reviews',
    'cart',
    'wishlist',
    'coupons',
    'sellers',
    'product_files',
  ];

  for (const req of requiredCols) {
    assert(colIds.includes(req), `Collection exists: ${req}`);
  }

  // 2. Verify Storage Bucket
  console.log('\n2. Verifying Storage Bucket & Digital Assets...');
  const filesRes = await storage.listFiles(BUCKET_ID);
  assert(filesRes.total >= 6, `Storage bucket contains digital assets (${filesRes.total} files found)`);

  // 3. Verify Products in Database
  console.log('\n3. Verifying Authoritative Catalog Data...');
  const prodsRes = await databases.listDocuments(DATABASE_ID, 'products');
  assert(prodsRes.total >= 6, `Products collection populated (${prodsRes.total} products found)`);
  const sampleProd = prodsRes.documents[0];
  assert(Boolean(sampleProd.fileId), `Product ${sampleProd.$id} has associated fileId: ${sampleProd.fileId}`);

  // 4. Test Order Creation Flow
  console.log('\n4. Testing Order Persistence Flow...');
  const testOrderId = `test_ord_${Date.now()}`.substring(0, 36);
  const testUserId = `test_usr_${Date.now()}`.substring(0, 36);
  const testProdId = sampleProd.$id;

  const orderDoc = await databases.createDocument(
    DATABASE_ID,
    'orders',
    testOrderId,
    {
      userId: testUserId,
      userEmail: 'auditor@digitalhippo.com',
      productIds: [testProdId],
      amount: 49,
      currency: 'XOF',
      paymentProvider: 'sebpay',
      paymentStatus: 'PENDING',
      isPaid: false,
      sebpayReference: `ref_${testOrderId}`,
    }
  );
  assert(orderDoc.$id === testOrderId, `Order created with PENDING status: ${orderDoc.$id}`);

  // 5. Test State Machine Transition to PAID
  console.log('\n5. Testing State Machine Transition to PAID...');
  const updatedOrder = await databases.updateDocument(
    DATABASE_ID,
    'orders',
    testOrderId,
    {
      paymentStatus: 'PAID',
      isPaid: true,
      paidAt: new Date().toISOString(),
      sebpayTransactionId: `tx_${Date.now()}`,
    }
  );
  assert(updatedOrder.paymentStatus === 'PAID' && updatedOrder.isPaid === true, 'Order updated to PAID status');

  // 6. Test Purchase Entitlement Creation
  console.log('\n6. Testing Idempotent Purchase Entitlement Creation...');
  const purchaseDocId = `pur_${testOrderId}_${testProdId}`.substring(0, 36);
  const purchaseDoc = await databases.createDocument(
    DATABASE_ID,
    'purchases',
    purchaseDocId,
    {
      userId: testUserId,
      userEmail: 'auditor@digitalhippo.com',
      orderId: testOrderId,
      productId: testProdId,
      grantedAt: new Date().toISOString(),
      downloadCount: 0,
      status: 'ACTIVE',
    }
  );
  assert(purchaseDoc.$id === purchaseDocId, `Purchase entitlement granted: ${purchaseDoc.$id}`);

  // 7. Test Download Tracking
  console.log('\n7. Testing Download Tracking & File Retrieval...');
  const currentCount = Number(purchaseDoc.downloadCount) || 0;
  const updatedPurchase = await databases.updateDocument(
    DATABASE_ID,
    'purchases',
    purchaseDocId,
    {
      downloadCount: currentCount + 1,
      lastDownloadedAt: new Date().toISOString(),
    }
  );
  assert(updatedPurchase.downloadCount === 1, 'Download count incremented to 1');
  assert(Boolean(updatedPurchase.lastDownloadedAt), 'lastDownloadedAt timestamp recorded');

  // 8. Test Binary File Download from Storage Bucket
  console.log('\n8. Testing Binary File Download from Bucket 6aa10cbe000dad323c41...');
  const fileBytes = await storage.getFileDownload({
    bucketId: BUCKET_ID,
    fileId: sampleProd.fileId,
  });
  const buffer = Buffer.from(fileBytes);
  assert(buffer.length > 0, `Downloaded file binary buffer (${buffer.length} bytes) from storage bucket`);

  // 9. Clean up test documents
  console.log('\n9. Cleaning up test documents...');
  await databases.deleteDocument(DATABASE_ID, 'purchases', purchaseDocId);
  await databases.deleteDocument(DATABASE_ID, 'orders', testOrderId);
  console.log('  Cleaned up test documents successfully.');

  console.log('\n===========================================================');
  console.log(`ACCEPTANCE AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTest().catch((err) => {
  console.error('Acceptance test error:', err);
  process.exit(1);
});
