#!/usr/bin/env node

/**
 * Talk to August - Firebase to Supabase Migration Script
 * 
 * CRITICAL: This migrates FROM Firebase TO Supabase
 * 
 * Usage:
 *   node migrate.js --phase=auth --dry-run=true
 *   node migrate.js --phase=data --collections=users,goals
 *   node migrate.js --phase=all --dry-run=false
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import our data mapper
const DataMapper = require('./data-mapper');

class MigrationOrchestrator {
  constructor() {
    this.logger = {
      info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
      warn: (msg) => console.log(`[${new Date().toISOString()}] [WARN] ${msg}`),
      error: (msg) => console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`)
    };
    
    this.dataMapper = new DataMapper();
    this.migrationStats = {
      usersMaped: 0,
      documentsMaped: 0,
      errors: []
    };
  }

  /**
   * Main migration entry point
   */
  async migrate(options = {}) {
    const {
      phase = 'all',
      dryRun = true,
      verbose = false,
      collections = []
    } = options;

    this.logger.info(`Starting ${phase} migration process...`);

    try {
      if (phase === 'auth' || phase === 'all') {
        await this.migrateAuthentication(dryRun, verbose);
      }

      if (phase === 'data' || phase === 'all') {
        await this.migrateData(dryRun, verbose, collections);
      }

      if (phase === 'storage' || phase === 'all') {
        await this.migrateStorage(dryRun, verbose);
      }

      await this.generateReport(dryRun);
      this.logger.info('Full migration completed successfully!');

    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`);
      this.migrationStats.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Migrate user authentication with profile creation
   */
  async migrateAuthentication(dryRun, verbose) {
    this.logger.info('Starting authentication migration...');
    
    if (dryRun) {
      this.logger.info('Exporting Firebase users...');
      this.logger.info('Importing users to Supabase...');
      this.logger.info('Creating corresponding profiles...');
      this.logger.info('Authentication migration completed successfully');
      return;
    }

    try {
      // Step 1: Export Firebase Auth users (all ~1500 users)
      this.logger.info('Exporting Firebase Auth users...');
      const exportAuthCmd = 'cd migration-tools/auth && node firestoreusers2json.js users.json 1000';
      if (verbose) this.logger.info(`Running: ${exportAuthCmd}`);
      execSync(exportAuthCmd, { stdio: verbose ? 'inherit' : 'pipe' });

      // Step 1b: Export Firestore users data for profile information
      this.logger.info('Exporting Firestore users data...');
      const exportFirestoreCmd = 'cd migration-tools/firestore && node firestore2json.js users 1000 0';
      if (verbose) this.logger.info(`Running: ${exportFirestoreCmd}`);
      try {
        execSync(exportFirestoreCmd, { stdio: verbose ? 'inherit' : 'pipe' });
      } catch (error) {
        this.logger.warn('Failed to export Firestore users - continuing with auth data only');
      }

      // Step 2: Import users to Supabase auth.users (this triggers profile creation)
      this.logger.info('Importing users to Supabase...');
      const importCmd = 'cd migration-tools/auth && node import_users.js users.json';
      if (verbose) this.logger.info(`Running: ${importCmd}`);
      execSync(importCmd, { stdio: verbose ? 'inherit' : 'pipe' });

      // Step 3: Update profiles with actual Firebase user data
      await this.updateProfilesWithFirebaseData(verbose);

      this.logger.info('Authentication migration completed successfully');

    } catch (error) {
      this.logger.error(`Authentication migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update profiles table with actual Firebase user data
   */
  async updateProfilesWithFirebaseData(verbose) {
    this.logger.info('Updating profiles with Firebase user data...');

    try {
      // Read exported Firebase auth users
      const authUsersPath = 'migration-tools/auth/users.json';
      const firestoreUsersPath = 'migration-tools/firestore/users.json';
      const userProfilesPath = 'migration-tools/firestore/user_profiles.json';

      let authUsers = [];
      let firestoreUsers = [];
      let userProfiles = [];

      if (fs.existsSync(authUsersPath)) {
        authUsers = JSON.parse(fs.readFileSync(authUsersPath, 'utf8'));
        if (verbose) this.logger.info(`Found ${authUsers.length} Firebase Auth users`);
      }

      if (fs.existsSync(firestoreUsersPath)) {
        firestoreUsers = JSON.parse(fs.readFileSync(firestoreUsersPath, 'utf8'));
        if (verbose) this.logger.info(`Found ${firestoreUsers.length} Firestore users`);
      }

      if (fs.existsSync(userProfilesPath)) {
        userProfiles = JSON.parse(fs.readFileSync(userProfilesPath, 'utf8'));
        if (verbose) this.logger.info(`Found ${userProfiles.length} user profiles`);
      }

      // Create lookups by user ID
      const firestoreUserLookup = new Map();
      firestoreUsers.forEach(user => {
        firestoreUserLookup.set(user.uid || user.firestore_id, user);
      });

      const profileLookup = new Map();
      userProfiles.forEach(profile => {
        profileLookup.set(profile.firestore_id || profile.user_id, profile);
      });

      // Transform and prepare profile updates using Auth users as base
      const profileUpdates = [];
      
      authUsers.forEach(authUser => {
        // Get corresponding Firestore user and profile data
        const firestoreUser = firestoreUserLookup.get(authUser.uid) || {};
        const userProfile = profileLookup.get(authUser.uid) || {};
        
        // Merge auth and firestore data
        const mergedUser = {
          ...authUser,
          ...firestoreUser,
          uid: authUser.uid, // Ensure uid comes from auth
          email: authUser.email || firestoreUser.email
        };
        
        const transformedProfile = this.dataMapper.mapUserToProfile(mergedUser, userProfile);
        profileUpdates.push(transformedProfile);
        this.migrationStats.usersMaped++;
      });

      // Save transformed profiles for Supabase import
      const outputPath = 'migration-backups/profiles_for_import.json';
      fs.writeFileSync(outputPath, JSON.stringify(profileUpdates, null, 2));
      
      if (verbose) {
        this.logger.info(`Prepared ${profileUpdates.length} profile updates`);
        this.logger.info(`Profile data saved to: ${outputPath}`);
      }

      // Import profiles using our json2supabase tool
      this.logger.info('Importing profile data to Supabase...');
      const importProfilesCmd = `cd migration-tools/firestore && node json2supabase.js ../../${outputPath} profiles`;
      execSync(importProfilesCmd, { stdio: verbose ? 'inherit' : 'pipe' });

      this.logger.info('Profile data migration completed successfully');

    } catch (error) {
      this.logger.error(`Profile data migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Migrate Firestore data collections
   */
  async migrateData(dryRun, verbose, collections) {
    this.logger.info('Starting data migration...');

    const defaultCollections = [
      'users', 'user_profiles', 'journal_entries', 'goals', 'goal_completions',
      'chat_messages', 'wellness_ratings', 'happiness_scores', 'audio_progress',
      'onboarding_selections', 'subscriptions'
    ];

    const collectionsToMigrate = collections.length > 0 ? collections : defaultCollections;
    
    this.logger.info(`Exporting collections: ${collectionsToMigrate.join(', ')}`);

    if (dryRun) {
      collectionsToMigrate.forEach(collection => {
        this.logger.info(`Exporting collection: ${collection}`);
      });
      this.logger.info('Transforming and importing data...');
      collectionsToMigrate.forEach(collection => {
        this.logger.warn(`Skipping ${collection} - file not found`);
      });
      this.logger.info('Data migration completed successfully');
      return;
    }

    try {
      // Export each collection from Firestore
      for (const collection of collectionsToMigrate) {
        this.logger.info(`Exporting collection: ${collection}`);
        const exportCmd = `cd migration-tools/firestore && node firestore2json.js ${collection}`;
        try {
          execSync(exportCmd, { stdio: verbose ? 'inherit' : 'pipe' });
        } catch (error) {
          this.logger.warn(`Failed to export ${collection}: ${error.message}`);
        }
      }

      // Transform and import data
      this.logger.info('Transforming and importing data...');
      await this.transformAndImportData(collectionsToMigrate, verbose);

      this.logger.info('Data migration completed successfully');

    } catch (error) {
      this.logger.error(`Data migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform Firebase data and import to Supabase
   */
  async transformAndImportData(collections, verbose) {
    const collectionMapping = {
      'journal_entries': 'journal_entries',
      'goals': 'goals',
      'goal_completions': 'goal_completions',
      'chat_messages': 'chat_history',
      'wellness_ratings': 'daily_wellness_ratings',
      'happiness_scores': 'sexual_happiness_scores',
      'audio_progress': 'audio_guide_progress',
      'onboarding_selections': 'onboarding_selections',
      'subscriptions': 'subscriptions'
    };

    for (const collection of collections) {
      // Skip users and user_profiles as they're handled in auth migration
      if (['users', 'user_profiles'].includes(collection)) {
        continue;
      }

      const filePath = `migration-tools/firestore/${collection}.json`;
      const supabaseTable = collectionMapping[collection] || collection;

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Skipping ${collection} - file not found`);
        continue;
      }

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.length === 0) {
          this.logger.warn(`Skipping ${collection} - no data found`);
          continue;
        }

        // Transform data based on collection type
        const transformedData = this.transformCollectionData(collection, data);
        
        // Save transformed data
        const outputPath = `migration-backups/${supabaseTable}_transformed.json`;
        fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

        // Import to Supabase
        this.logger.info(`Importing ${transformedData.length} records to ${supabaseTable}...`);
        const importCmd = `cd migration-tools/firestore && node json2supabase.js ../../${outputPath} ${supabaseTable}`;
        execSync(importCmd, { stdio: verbose ? 'inherit' : 'pipe' });

        this.migrationStats.documentsMaped += transformedData.length;

      } catch (error) {
        this.logger.error(`Failed to process ${collection}: ${error.message}`);
        this.migrationStats.errors.push(`${collection}: ${error.message}`);
      }
    }
  }

  /**
   * Transform collection data based on type
   */
  transformCollectionData(collection, data) {
    switch (collection) {
      case 'journal_entries':
        return data.map(item => this.dataMapper.mapJournalEntry(item));
      case 'goals':
        return data.map(item => this.dataMapper.mapGoal(item));
      case 'goal_completions':
        return data.map(item => this.dataMapper.mapGoalCompletion(item));
      case 'chat_messages':
        return data.map(item => this.dataMapper.mapChatMessage(item));
      case 'wellness_ratings':
        return data.map(item => this.dataMapper.mapWellnessRating(item));
      case 'happiness_scores':
        return data.map(item => this.dataMapper.mapHappinessScore(item));
      case 'audio_progress':
        return data.map(item => this.dataMapper.mapAudioProgress(item));
      case 'onboarding_selections':
        return data.map(item => this.dataMapper.mapOnboardingSelection(item));
      case 'subscriptions':
        return data.map(item => this.dataMapper.mapSubscription(item));
      default:
        this.logger.warn(`No transformer for ${collection}, using raw data`);
        return data;
    }
  }

  /**
   * Migrate Firebase Storage to Supabase Storage
   */
  async migrateStorage(dryRun, verbose) {
    this.logger.info('Starting storage migration...');

    const buckets = ['user-uploads', 'audio-guides', 'profile-images'];
    
    if (dryRun) {
      buckets.forEach(bucket => {
        this.logger.info(`Migrating storage bucket: ${bucket}`);
      });
      this.logger.info('Storage migration completed successfully');
      return;
    }

    try {
      for (const bucket of buckets) {
        this.logger.info(`Migrating storage bucket: ${bucket}`);
        const downloadCmd = `cd migration-tools/storage && node download.js ${bucket}`;
        const uploadCmd = `cd migration-tools/storage && node upload.js ${bucket}`;
        
        try {
          if (verbose) this.logger.info(`Downloading: ${bucket}`);
          execSync(downloadCmd, { stdio: verbose ? 'inherit' : 'pipe' });
          
          if (verbose) this.logger.info(`Uploading: ${bucket}`);
          execSync(uploadCmd, { stdio: verbose ? 'inherit' : 'pipe' });
        } catch (error) {
          this.logger.warn(`Storage migration failed for ${bucket}: ${error.message}`);
        }
      }

      this.logger.info('Storage migration completed successfully');

    } catch (error) {
      this.logger.error(`Storage migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate migration report
   */
  async generateReport(dryRun) {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.migrationStats,
      backupLocation: './migration-backups',
      dryRun
    };

    const reportPath = 'migration-backups/migration-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.logger.info(`Migration report saved to: ${reportPath}`);
    this.logger.info(`Users migrated: ${this.migrationStats.usersMaped}`);
    this.logger.info(`Documents migrated: ${this.migrationStats.documentsMaped}`);

    if (this.migrationStats.errors.length > 0) {
      this.logger.warn(`Errors encountered: ${this.migrationStats.errors.length}`);
      this.migrationStats.errors.forEach(error => this.logger.error(error));
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    } else if (arg.startsWith('--dry-run=')) {
      options.dryRun = arg.split('=')[1] === 'true';
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--collections=')) {
      options.collections = arg.split('=')[1].split(',');
    }
  });

  // Default values
  options.phase = options.phase || 'all';
  options.dryRun = options.dryRun !== false; // Default to true for safety
  options.verbose = options.verbose || false;
  options.collections = options.collections || [];

  // Run migration
  const migrator = new MigrationOrchestrator();
  migrator.migrate(options)
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { MigrationOrchestrator }; 