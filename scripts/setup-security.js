#!/usr/bin/env node

/**
 * Security Setup Script for Tasbeeh App
 * This script helps configure the security environment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔒 Tasbeeh App Security Setup');
console.log('=============================\n');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Backup will be created.');
  const backupPath = path.join(process.cwd(), '.env.backup');
  fs.copyFileSync(envPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}\n`);
}

console.log('Please provide your Supabase credentials:');
console.log('(You can find these in your Supabase dashboard under Settings > API)\n');

rl.question('Enter your Supabase URL: ', (supabaseUrl) => {
  rl.question('Enter your Supabase Anon Key: ', (supabaseKey) => {
    rl.question('Environment (development/production): ', (environment) => {
      const env = environment || 'development';
      
      // Create .env content
      const envContent = `# Tasbeeh App Environment Configuration
# Generated on ${new Date().toISOString()}

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# App Configuration
EXPO_PUBLIC_APP_ENV=${env}
EXPO_PUBLIC_ENABLE_LOGGING=${env === 'development' ? 'true' : 'false'}
EXPO_PUBLIC_LOG_LEVEL=${env === 'development' ? 'debug' : 'error'}

# Security Configuration
EXPO_PUBLIC_RATE_LIMIT_ENABLED=true
EXPO_PUBLIC_MAX_AUTH_ATTEMPTS=5
EXPO_PUBLIC_LOCKOUT_DURATION=300000
`;

      // Write .env file
      fs.writeFileSync(envPath, envContent);
      
      // Create .env.example file
      const envExampleContent = `# Tasbeeh App Environment Configuration Template
# Copy this file to .env and fill in your actual values

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ENABLE_LOGGING=false
EXPO_PUBLIC_LOG_LEVEL=error

# Security Configuration
EXPO_PUBLIC_RATE_LIMIT_ENABLED=true
EXPO_PUBLIC_MAX_AUTH_ATTEMPTS=5
EXPO_PUBLIC_LOCKOUT_DURATION=300000
`;
      
      fs.writeFileSync(envExamplePath, envExampleContent);
      
      console.log('\n✅ Security configuration complete!');
      console.log('📁 Files created:');
      console.log(`   - .env (with your credentials)`);
      console.log(`   - .env.example (template for others)`);
      
      console.log('\n🔒 Security Features Enabled:');
      console.log('   ✅ Environment variables for credentials');
      console.log('   ✅ Secure token storage');
      console.log('   ✅ Enhanced input validation');
      console.log('   ✅ Rate limiting protection');
      console.log('   ✅ Secure logging system');
      
      console.log('\n📋 Next Steps:');
      console.log('   1. Review the SECURITY.md file for complete details');
      console.log('   2. Test your app with the new security features');
      console.log('   3. Consider implementing Phase 2 security features');
      console.log('   4. Schedule regular security audits');
      
      console.log('\n⚠️  Important Security Notes:');
      console.log('   - Never commit .env to version control');
      console.log('   - Rotate your Supabase keys regularly');
      console.log('   - Monitor authentication failure rates');
      console.log('   - Keep dependencies updated');
      
      console.log('\n🚀 Your Tasbeeh app is now more secure!');
      
      // Add .env to .gitignore if it exists
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes('.env')) {
          fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.local\n.env.*.local\n');
          console.log('✅ Added .env to .gitignore');
        }
      }
      
      rl.close();
    });
  });
});

rl.on('close', () => {
  console.log('\n🔒 Security setup completed successfully!');
  process.exit(0);
}); 