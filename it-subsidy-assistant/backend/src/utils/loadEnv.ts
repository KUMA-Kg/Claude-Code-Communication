import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Load environment variables based on NODE_ENV
 * Priority order:
 * 1. .env.{NODE_ENV}.local (not tracked in git)
 * 2. .env.{NODE_ENV}
 * 3. .env.local (not tracked in git)
 * 4. .env
 */
export function loadEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env'
  ];

  // Load each env file if it exists
  envFiles.forEach(file => {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      const result = config({ path });
      if (result.error) {
        console.warn(`Warning: Failed to load ${file}:`, result.error.message);
      } else {
        console.log(`✅ Loaded environment from ${file}`);
      }
    }
  });

  // Validate NODE_ENV
  const validEnvironments = ['development', 'test', 'staging', 'production'];
  if (!validEnvironments.includes(nodeEnv)) {
    console.warn(`⚠️  Warning: Invalid NODE_ENV "${nodeEnv}". Valid values: ${validEnvironments.join(', ')}`);
  }

  // Security check for production
  if (nodeEnv === 'production') {
    const devSecrets = ['temporary', 'development', 'test', 'example'];
    const jwtSecret = process.env.JWT_SECRET || '';
    
    if (devSecrets.some(word => jwtSecret.toLowerCase().includes(word))) {
      console.error('❌ SECURITY ERROR: Development secrets detected in production!');
      console.error('Please generate proper production secrets using: npm run generate:secrets');
      process.exit(1);
    }

    if (jwtSecret.length < 32) {
      console.error('❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters in production!');
      process.exit(1);
    }
  }
}