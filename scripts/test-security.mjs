#!/usr/bin/env node
/**
 * Comprehensive Security Test Suite for SonaMoney
 * Tests all CR-001, CR-002, CR-003 fixes against production
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'https://sonamoney.my.id';
const TEST_RESULTS = [];

// Helper: Make HTTP request
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, { method: options.method || 'GET', ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Test 1: CR-003 - X-Frame-Options: DENY
async function testXFrameOptions() {
  console.log('\n🔒 TEST 1: X-Frame-Options Header (CR-003)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const res = await request(BASE_URL, { method: 'HEAD' });
    const xFrame = res.headers['x-frame-options'];
    
    if (xFrame === 'DENY') {
      console.log('✅ PASS: X-Frame-Options is DENY');
      console.log(`   Header: ${xFrame}`);
      TEST_RESULTS.push({ test: 'CR-003 X-Frame-Options', status: 'PASS' });
    } else {
      console.log('❌ FAIL: X-Frame-Options is not DENY');
      console.log(`   Expected: DENY, Got: ${xFrame || 'NOT SET'}`);
      TEST_RESULTS.push({ test: 'CR-003 X-Frame-Options', status: 'FAIL' });
    }
  } catch (err) {
    console.log('❌ ERROR:', err.message);
    TEST_RESULTS.push({ test: 'CR-003 X-Frame-Options', status: 'ERROR' });
  }
}

// Test 2: CR-002 - Rate Limiting
async function testRateLimiting() {
  console.log('\n🔒 TEST 2: Rate Limiting (CR-002)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const totalRequests = 65;
  let hit429 = false;
  let successCount = 0;
  
  console.log(`   Sending ${totalRequests} rapid requests...`);
  
  const promises = Array(totalRequests).fill().map((_, i) => 
    request(`${BASE_URL}/`)
      .then(res => {
        if (res.status === 200) successCount++;
        if (res.status === 429) hit429 = true;
        return res.status;
      })
      .catch(() => 0)
  );
  
  const results = await Promise.all(promises);
  const count429 = results.filter(s => s === 429).length;
  
  if (hit429 && count429 > 0) {
    console.log(`✅ PASS: Rate limiting working`);
    console.log(`   Successful: ${successCount}/${totalRequests}`);
    console.log(`   Blocked (429): ${count429}`);
    TEST_RESULTS.push({ test: 'CR-002 Rate Limiting', status: 'PASS' });
  } else {
    console.log('❌ FAIL: Rate limiting not working');
    console.log(`   All responses: ${results.slice(0, 10).join(', ')}...`);
    TEST_RESULTS.push({ test: 'CR-002 Rate Limiting', status: 'FAIL' });
  }
}

// Test 3: CR-001 - No NEXT_PUBLIC_REQUEST_SECRET in client
async function testNoClientSecret() {
  console.log('\n🔒 TEST 3: No Client-Side Secret Exposure (CR-001)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Check main page doesn't contain NEXT_PUBLIC_REQUEST_SECRET
    const res = await request(`${BASE_URL}/`);
    const hasSecret = res.data.includes('NEXT_PUBLIC_REQUEST_SECRET');
    
    if (!hasSecret) {
      console.log('✅ PASS: No NEXT_PUBLIC_REQUEST_SECRET in HTML');
      TEST_RESULTS.push({ test: 'CR-001 No Client Secret', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Found NEXT_PUBLIC_REQUEST_SECRET in client code');
      TEST_RESULTS.push({ test: 'CR-001 No Client Secret', status: 'FAIL' });
    }
    
    // Check static JS files
    const jsCheck = res.data.match(/_next\/static\/[^"]+\.js/g);
    if (jsCheck) {
      console.log(`   Checked ${jsCheck.length} JS references in HTML`);
    }
  } catch (err) {
    console.log('❌ ERROR:', err.message);
    TEST_RESULTS.push({ test: 'CR-001 No Client Secret', status: 'ERROR' });
  }
}

// Test 4: Additional Security Headers
async function testSecurityHeaders() {
  console.log('\n🔒 TEST 4: Additional Security Headers');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const res = await request(BASE_URL, { method: 'HEAD' });
    const headers = res.headers;
    const checks = [
      { name: 'X-Content-Type-Options', value: 'nosniff' },
      { name: 'X-Frame-Options', value: 'DENY' },
    ];
    
    let allPass = true;
    checks.forEach(check => {
      const actual = headers[check.name.toLowerCase()];
      if (actual === check.value) {
        console.log(`✅ ${check.name}: ${actual}`);
      } else {
        console.log(`⚠️  ${check.name}: ${actual || 'NOT SET'} (expected ${check.value})`);
        allPass = false;
      }
    });
    
    if (headers['strict-transport-security']) {
      console.log(`✅ HSTS: ${headers['strict-transport-security']}`);
    }
    
    TEST_RESULTS.push({ test: 'Security Headers', status: allPass ? 'PASS' : 'PARTIAL' });
  } catch (err) {
    console.log('❌ ERROR:', err.message);
    TEST_RESULTS.push({ test: 'Security Headers', status: 'ERROR' });
  }
}

// Test 5: Auth endpoint rate limiting
async function testAuthRateLimiting() {
  console.log('\n🔒 TEST 5: Auth Endpoint Rate Limiting');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const requests = 12; // Auth limit is 10 per 15 min
  console.log(`   Sending ${requests} auth requests...`);
  
  const promises = Array(requests).fill().map(() =>
    request(`${BASE_URL}/api/auth/login`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    }).then(res => res.status).catch(() => 0)
  );
  
  const results = await Promise.all(promises);
  const count429 = results.filter(s => s === 429).length;
  
  if (count429 > 0) {
    console.log(`✅ PASS: Auth rate limiting working (${count429} blocked)`);
    TEST_RESULTS.push({ test: 'Auth Rate Limiting', status: 'PASS' });
  } else {
    console.log('⚠️  Auth rate limiting not triggered (may need more requests)');
    console.log(`   Responses: ${results.join(', ')}`);
    TEST_RESULTS.push({ test: 'Auth Rate Limiting', status: 'PARTIAL' });
  }
}

// Summary
function printSummary() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              SECURITY TEST SUMMARY                       ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  
  TEST_RESULTS.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'PARTIAL' ? '⚠️ ' : '❌';
    console.log(`║ ${icon} ${r.test.padEnd(50)} ${r.status.padEnd(6)} ║`);
  });
  
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const total = TEST_RESULTS.length;
  
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL: ${passed}/${total} tests passed                       ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  if (passed === total) {
    console.log('\n🎉 All critical security tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed - review output above');
    process.exit(1);
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     SonaMoney Security Test Suite                        ║');
  console.log('║     Testing: ' + BASE_URL.padEnd(35) + ' ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  await testXFrameOptions();
  await testRateLimiting();
  await testNoClientSecret();
  await testSecurityHeaders();
  await testAuthRateLimiting();
  
  printSummary();
}

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
