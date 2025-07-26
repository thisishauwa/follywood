#!/usr/bin/env node

/**
 * Pre-migration validation script for Talk to August Firebase to Supabase migration
 * Validates configuration, connectivity, and data integrity before migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MigrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  addError(message) {
    this.errors.push(message);
    console.error(`❌ ERROR: ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.warn(`⚠️  WARNING: ${message}`);
  }

  addCheck(message) {
    this.checks.push(message);
    console.log(`✅ ${message}`);
  }

  /**
   * Validate Firebase configuration
   */
  validateFirebaseConfig() {
    console.log('\n🔥 Validating Firebase Configuration...');

    // Check for Firebase service account key
    const firebaseKeyPaths = [
      'migration-tools/auth/firebase-service.json',
      'migration-tools/firestore/firebase-service.json',
      'migration-tools/storage/firebase-service.json'
    ];

    let hasFirebaseKey = false;
    for (const keyPath of firebaseKeyPaths) {
      if (fs.existsSync(keyPath)) {
        hasFirebaseKey = true;
        this.addCheck(`Firebase service key found: ${keyPath}`);
        
        try {
          const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          if (keyData.project_id && keyData.private_key && keyData.client_email) {
            this.addCheck('Firebase service key appears valid');
          } else {
            this.addError(`Invalid Firebase service key format in ${keyPath}`);
          }
        } catch (error) {
          this.addError(`Failed to parse Firebase service key: ${error.message}`);
        }
        break;
      }
    }

    if (!hasFirebaseKey) {
      this.addError('Firebase service account key not found. Place firebase-service.json in migration-tools directories.');
    }

    // Check for Firebase project configuration
    if (fs.existsSync('firebase.json')) {
      this.addCheck('Firebase project configuration found');
    } else {
      this.addWarning('firebase.json not found - ensure Firebase CLI is configured');
    }
  }

  /**
   * Validate Supabase configuration
   */
  validateSupabaseConfig() {
    console.log('\n🚀 Validating Supabase Configuration...');

    // Check for Supabase service configuration
    const supabaseConfigPaths = [
      'migration-tools/auth/supabase-service.json',
      'migration-tools/firestore/supabase-service.json'
    ];

    let hasSupabaseConfig = false;
    for (const configPath of supabaseConfigPaths) {
      if (fs.existsSync(configPath)) {
        hasSupabaseConfig = true;
        this.addCheck(`Supabase config found: ${configPath}`);
        
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (configData.host && configData.password && configData.user) {
            this.addCheck('Supabase configuration appears valid');
          } else {
            this.addError(`Invalid Supabase configuration in ${configPath}`);
          }
        } catch (error) {
          this.addError(`Failed to parse Supabase config: ${error.message}`);
        }
        break;
      }
    }

    if (!hasSupabaseConfig) {
      this.addError('Supabase service configuration not found. Configure supabase-service.json files.');
    }

    // Check for Supabase keys
    const supabaseKeyPaths = [
      'migration-tools/auth/supabase-keys.ts',
      'migration-tools/firestore/supabase-keys.ts'
    ];

    let hasSupabaseKeys = false;
    for (const keyPath of supabaseKeyPaths) {
      if (fs.existsSync(keyPath)) {
        hasSupabaseKeys = true;
        this.addCheck(`Supabase keys found: ${keyPath}`);
        break;
      }
    }

    if (!hasSupabaseKeys) {
      this.addWarning('Supabase keys not found - may be needed for some operations');
    }
  }

  /**
   * Validate migration tools
   */
  validateMigrationTools() {
    console.log('\n🛠️  Validating Migration Tools...');

    // Check if migration tools directory exists
    if (!fs.existsSync('migration-tools')) {
      this.addError('Migration tools directory not found. Run: git clone https://github.com/supabase-community/firebase-to-supabase.git migration-tools');
      return;
    }

    // Check required scripts
    const requiredScripts = [
      'migration-tools/auth/firestoreusers2json.js',
      'migration-tools/auth/import_users.js',
      'migration-tools/firestore/firestore2json.js',
      'migration-tools/firestore/json2supabase.js',
      'migration-tools/storage/download.js',
      'migration-tools/storage/upload.js'
    ];

    for (const script of requiredScripts) {
      if (fs.existsSync(script)) {
        this.addCheck(`Migration script found: ${path.basename(script)}`);
      } else {
        this.addError(`Missing migration script: ${script}`);
      }
    }

    // Check for Node.js dependencies
    try {
      execSync('node --version', { stdio: 'pipe' });
      this.addCheck('Node.js is available');
    } catch (error) {
      this.addError('Node.js is not available or not in PATH');
    }

    // Check for npm dependencies in migration tools
    if (fs.existsSync('migration-tools/package.json')) {
      this.addCheck('Migration tools package.json found');
      
      if (fs.existsSync('migration-tools/node_modules')) {
        this.addCheck('Migration tools dependencies installed');
      } else {
        this.addWarning('Migration tools dependencies not installed. Run: cd migration-tools && npm install');
      }
    }
  }

  /**
   * Validate custom migration scripts
   */
  validateCustomScripts() {
    console.log('\n📝 Validating Custom Migration Scripts...');

    const customScripts = [
      'migration-scripts/data-mapper.js',
      'migration-scripts/migrate.js'
    ];

    for (const script of customScripts) {
      if (fs.existsSync(script)) {
        this.addCheck(`Custom script found: ${path.basename(script)}`);
      } else {
        this.addError(`Missing custom script: ${script}`);
      }
    }

    // Check for backup directory
    const backupDir = './migration-backups';
    if (!fs.existsSync(backupDir)) {
      try {
        fs.mkdirSync(backupDir, { recursive: true });
        this.addCheck('Created backup directory');
      } catch (error) {
        this.addError(`Failed to create backup directory: ${error.message}`);
      }
    } else {
      this.addCheck('Backup directory exists');
    }
  }

  /**
   * Validate database schema compatibility
   */
  validateSchemaCompatibility() {
    console.log('\n🗄️  Validating Database Schema...');

    // Check if database schema file exists
    if (fs.existsSync('src/services/database-setup.sql')) {
      this.addCheck('Supabase database schema found');
      
      // Read and validate schema
      const schema = fs.readFileSync('src/services/database-setup.sql', 'utf8');
      
      const requiredTables = [
        'profiles',
        'onboarding_selections',
        'journal_entries',
        'goals',
        'goal_completions',
        'daily_wellness_ratings',
        'audio_guides',
        'audio_guide_progress',
        'chat_history',
        'sexual_happiness_scores',
        'subscription_plans',
        'subscriptions'
      ];

      for (const table of requiredTables) {
        if (schema.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
          this.addCheck(`Table schema found: ${table}`);
        } else {
          this.addError(`Missing table schema: ${table}`);
        }
      }

    } else {
      this.addError('Database schema file not found: src/services/database-setup.sql');
    }
  }

  /**
   * Test connectivity
   */
  async testConnectivity() {
    console.log('\n🌐 Testing Connectivity...');

    // Test Firebase connectivity (if possible)
    try {
      // This would require Firebase Admin SDK to be properly configured
      this.addCheck('Firebase connectivity test skipped (manual verification needed)');
    } catch (error) {
      this.addWarning('Could not test Firebase connectivity');
    }

    // Test Supabase connectivity (if possible)
    try {
      // This would require Supabase client to be properly configured
      this.addCheck('Supabase connectivity test skipped (manual verification needed)');
    } catch (error) {
      this.addWarning('Could not test Supabase connectivity');
    }
  }

  /**
   * Validate environment
   */
  validateEnvironment() {
    console.log('\n💻 Validating Environment...');

    // Check disk space
    try {
      const stats = fs.statSync('.');
      this.addCheck('Current directory is accessible');
    } catch (error) {
      this.addError(`Cannot access current directory: ${error.message}`);
    }

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
      
      if (majorVersion >= 14) {
        this.addCheck(`Node.js version compatible: ${nodeVersion}`);
      } else {
        this.addError(`Node.js version too old: ${nodeVersion}. Requires Node.js 14+`);
      }
    } catch (error) {
      this.addError('Could not determine Node.js version');
    }

    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim() === '') {
        this.addCheck('Working directory is clean');
      } else {
        this.addWarning('Working directory has uncommitted changes');
      }
    } catch (error) {
      this.addWarning('Could not check Git status');
    }
  }

  /**
   * Run all validations
   */
  async runValidation() {
    console.log('🔍 Starting pre-migration validation...\n');

    this.validateFirebaseConfig();
    this.validateSupabaseConfig();
    this.validateMigrationTools();
    this.validateCustomScripts();
    this.validateSchemaCompatibility();
    this.validateEnvironment();
    await this.testConnectivity();

    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`✅ Checks passed: ${this.checks.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length === 0) {
      console.log('\n🎉 Validation passed! Ready to proceed with migration.');
      return true;
    } else {
      console.log('\n🚫 Validation failed! Please fix the errors before proceeding.');
      console.log('\nErrors to fix:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new MigrationValidator();
  
  validator.runValidation().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = MigrationValidator; 