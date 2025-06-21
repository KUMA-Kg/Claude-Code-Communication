// Test script to check environment variable loading
require('dotenv').config();

console.log('=== Environment Variable Test ===');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('\nChecking required environment variables:');

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missing = [];
required.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: SET (length: ${value.length})`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    missing.push(key);
  }
});

if (missing.length > 0) {
  console.log('\n❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}

// Check .env file existence
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log('\n.env file path:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('.env file size:', content.length, 'bytes');
  console.log('First 5 lines of .env:');
  console.log(content.split('\n').slice(0, 5).join('\n'));
}