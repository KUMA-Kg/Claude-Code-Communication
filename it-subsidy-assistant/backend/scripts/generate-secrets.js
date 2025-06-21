#!/usr/bin/env node

/**
 * Script to generate secure random secrets for JWT tokens
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
}

console.log('🔐 Generating secure secrets for production use...\n');

const jwtSecret = generateSecret(64);
const jwtRefreshSecret = generateSecret(64);

console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);

console.log('\n📋 Instructions:');
console.log('1. Copy the above secrets to your .env.production file');
console.log('2. Never commit these secrets to version control');
console.log('3. Use a secure secret management service in production (e.g., AWS Secrets Manager, HashiCorp Vault)');
console.log('4. Rotate these secrets regularly (recommended: every 90 days)');
console.log('\n⚠️  Security Tips:');
console.log('- Each environment should have unique secrets');
console.log('- Never reuse development secrets in production');
console.log('- Store production secrets securely');
console.log('- Enable audit logging for secret access');