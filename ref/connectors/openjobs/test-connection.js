#!/usr/bin/env node

import { QdrantClient } from '@qdrant/js-client-rest';

console.log('Testing Qdrant connection...\n');

const client = new QdrantClient({
  url: 'https://n8n-qdrant.katsu6.easypanel.host',
  checkCompatibility: false,
});

try {
  console.log('Calling getCollections...');
  const result = await client.getCollections();
  console.log('✅ Success!');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
