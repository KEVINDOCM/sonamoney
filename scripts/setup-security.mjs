#!/usr/bin/env node
/**
 * Security Setup Script for SonaMoney
 * Generates server-only REQUEST_SECRET and validates environment
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 SonaMoney Security Setup\n');

// Generate cryptographically secure REQUEST_SECRET
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

const secret = generateSecret();

console.log('✅ Generated new server-only REQUEST_SECRET:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Next Steps:');
console.log('1. Copy the secret above');
console.log('2. Add it to your .env.local file as:');
console.log('   REQUEST_SECRET=' + secret);
console.log('3. NEVER add NEXT_PUBLIC_ prefix to this variable');
console.log('4. This secret should ONLY be used server-side\n');

// Check current .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('NEXT_PUBLIC_REQUEST_SECRET')) {
    console.log('⚠️  WARNING: Found NEXT_PUBLIC_REQUEST_SECRET in .env.local');
    console.log('   Please remove it and use REQUEST_SECRET instead\n');
  }
}

console.log('🔧 Upstash Redis Setup Instructions:');
console.log('1. Visit https://upstash.com/ and sign up');
console.log('2. Create a new Redis database');
console.log('3. Copy the REST URL and REST TOKEN');
console.log('4. Add them to .env.local:\n');
console.log('   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io');
console.log('   UPSTASH_REDIS_REST_TOKEN=your-token-here\n');
