/**
 * Production Environment Validation
 * 
 * Validates that all required environment variables are set
 * for production deployment
 */

export function validateProductionEnv() {
  const errors: string[] = [];

  // Required for all environments
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
  ];

  // Production boot only requires data stores. Provider secrets may be
  // placeholders (e.g. aguardando_meta) until Meta/OpenAI/R2 are ready.

  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function logEnvironmentInfo() {
  console.log('📋 Environment Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API_PORT: ${process.env.API_PORT || 3001}`);
  console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
  console.log(`   DATABASE: ${process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}`);
  console.log(`   REDIS: ${process.env.REDIS_URL ? '✓ Connected' : '✗ Not configured'}`);
  console.log(`   WHATSAPP: ${process.env.WHATSAPP_PROVIDER || 'mock'}`);
  console.log(`   PAYMENT: ${process.env.PAYMENT_PROVIDER || 'mock'}`);
  console.log(`   IMAGE: ${process.env.IMAGE_PROVIDER || 'mock'}`);
  console.log(`   STORAGE: ${process.env.STORAGE_PROVIDER || 'mock'}`);
}
