const { Client, Databases } = require('node-appwrite');

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a9b4399000ba2817e08';
const DATABASE_ID = '6aa0a8f00015379a297f';
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function audit() {
  const collectionsRes = await databases.listCollections(DATABASE_ID);
  
  const report = {};
  
  for (const col of collectionsRes.collections) {
    const colDetail = await databases.getCollection(DATABASE_ID, col.$id);
    report[col.$id] = {
      id: col.$id,
      name: col.name,
      permissions: col.$permissions,
      attributes: colDetail.attributes.map(a => ({
        key: a.key,
        type: a.type,
        status: a.status,
        required: a.required,
        array: a.array || false,
        size: a.size || null,
        default: a.default !== undefined ? a.default : null,
      })),
      indexes: colDetail.indexes.map(idx => ({
        key: idx.key,
        type: idx.type,
        status: idx.status,
        attributes: idx.attributes,
        orders: idx.orders || [],
      })),
    };
  }

  console.log(JSON.stringify(report, null, 2));
}

audit().catch(console.error);
