#!/usr/bin/env node
/**
 * Secret Rotation Automation Script
 * Safely rotates API keys and secrets with zero-downtime deployment
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Secret configurations
const SECRETS = {
  REQUEST_SECRET: {
    name: 'REQUEST_SECRET',
    generator: () => crypto.randomBytes(32).toString('base64'),
    minLength: 16,
    description: 'Server-side HMAC signing secret'
  },
  TURNSTILE_SECRET_KEY: {
    name: 'TURNSTILE_SECRET_KEY',
    generator: null, // Manual rotation required
    description: 'Cloudflare Turnstile secret (rotate via Cloudflare dashboard)'
  },
  GEMINI_API_KEY: {
    name: 'GEMINI_API_KEY',
    generator: null, // Manual rotation required
    description: 'Google AI API key (rotate via Google Cloud Console)'
  },
  UPSTASH_REDIS_REST_TOKEN: {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    generator: null, // Manual rotation required
    description: 'Upstash Redis token (rotate via Upstash dashboard)'
  }
};

console.log('🔐 SonaMoney Secret Rotation Tool\n');
console.log('⚠️  WARNING: This will rotate production secrets.');
console.log('   Ensure you have a rollback plan before proceeding.\n');

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function generateSecret(config) {
  if (config.generator) {
    return config.generator();
  }
  return null;
}

function verifyVercelAuth() {
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('❌ Not authenticated with Vercel. Run: vercel login');
    return false;
  }
}

function getCurrentSecret(secretName) {
  try {
    const result = execSync(`vercel env ls production 2>/dev/null | grep ${secretName}`, { encoding: 'utf8' });
    return result.trim();
  } catch {
    return null;
  }
}

async function rotateSecret(secretName, config) {
  console.log(`\n📝 Rotating ${secretName}...`);
  console.log(`   Description: ${config.description}`);

  // Check if auto-rotatable
  if (!config.generator) {
    console.log(`   ⚠️  ${secretName} requires manual rotation`);
    console.log(`   Please rotate via the respective dashboard`);
    return false;
  }

  // Generate new secret
  const newSecret = generateSecret(config);
  console.log(`   ✅ New secret generated (${newSecret.length} chars)`);

  // Verify old secret exists
  const oldSecret = getCurrentSecret(secretName);
  if (!oldSecret) {
    console.log(`   ⚠️  No existing secret found. This will create a new one.`);
  }

  // Confirm rotation
  const confirm = await prompt(`   Rotate ${secretName}? (yes/no): `);
  if (confirm.toLowerCase() !== 'yes') {
    console.log(`   ⏭️  Skipped`);
    return false;
  }

  try {
    // Add new secret to Vercel
    console.log(`   🚀 Deploying new secret to Vercel...`);
    
    // Method 1: Using vercel env add with stdin
    const addCmd = `echo "${newSecret}" | vercel env add ${secretName} production --yes`;
    execSync(addCmd, { stdio: 'pipe' });
    
    console.log(`   ✅ Secret updated in Vercel`);
    
    // Deploy to apply changes
    console.log(`   🔄 Triggering deployment...`);
    execSync('vercel --prod --yes', { stdio: 'pipe' });
    
    console.log(`   ✅ Deployment complete`);
    console.log(`   📅 Old secret can be removed after 24 hours`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Rotation failed:`, error.message);
    return false;
  }
}

async function rotateSupabaseKey() {
  console.log(`\n📝 Rotating Supabase Service Role Key...`);
  console.log(`   ⚠️  This requires manual steps:`);
  console.log(`   1. Go to https://app.supabase.io`);
  console.log(`   2. Select your project`);
  console.log(`   3. Go to Project Settings > API`);
  console.log(`   4. Click "Regenerate" next to service_role key`);
  console.log(`   5. Copy the new key`);
  console.log(`   6. Update in Vercel: vercel env add SUPABASE_SERVICE_ROLE_KEY production`);
  
  const confirm = await prompt(`   Have you completed these steps? (yes/no): `);
  return confirm.toLowerCase() === 'yes';
}

async function main() {
  // Verify authentication
  if (!verifyVercelAuth()) {
    process.exit(1);
  }

  console.log('✅ Authenticated with Vercel\n');

  // Show current rotation schedule
  console.log('📅 Recommended Rotation Schedule:');
  console.log('   • REQUEST_SECRET: Every 90 days');
  console.log('   • API Keys (Gemini, Upstash): Every 180 days');
  console.log('   • Service Role Keys: Every 365 days\n');

  // Menu
  console.log('Select secrets to rotate:');
  console.log('1. REQUEST_SECRET (auto-generated)');
  console.log('2. All auto-rotatable secrets');
  console.log('3. Manual rotation guide');
  console.log('4. Exit\n');

  const choice = await prompt('Enter choice (1-4): ');

  switch (choice) {
    case '1':
      await rotateSecret('REQUEST_SECRET', SECRETS.REQUEST_SECRET);
      break;
    
    case '2':
      console.log('\n🔄 Rotating all auto-rotatable secrets...\n');
      for (const [name, config] of Object.entries(SECRETS)) {
        if (config.generator) {
          await rotateSecret(name, config);
        }
      }
      break;
    
    case '3':
      console.log('\n📖 Manual Rotation Guide:\n');
      console.log('Google AI (Gemini):');
      console.log('  https://makersuite.google.com/app/apikey\n');
      console.log('Upstash Redis:');
      console.log('  https://console.upstash.com/\n');
      console.log('Cloudflare Turnstile:');
      console.log('  https://dash.cloudflare.com/ > Turnstile\n');
      console.log('Supabase:');
      await rotateSupabaseKey();
      break;
    
    case '4':
      console.log('👋 Exiting...');
      break;
    
    default:
      console.log('❌ Invalid choice');
  }

  console.log('\n✨ Secret rotation complete!');
  console.log('📊 Remember to:');
  console.log('   • Test application functionality');
  console.log('   • Monitor error rates');
  console.log('   • Update team password manager');
  console.log('   • Schedule next rotation\n');
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { rotateSecret, generateSecret, SECRETS };
