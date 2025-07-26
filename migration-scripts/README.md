# Firebase to Supabase Migration Scripts

This directory contains custom migration scripts specifically designed for migrating Talk to August from Firebase to Supabase.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 14+ installed
- Firebase Admin SDK access to your Firebase project
- Supabase project with appropriate permissions
- Git repository is in a clean state (recommended)

### 2. Setup

```bash
# Install dependencies for migration tools
cd migration-tools
npm install

# Return to project root
cd ..

# Make scripts executable
chmod +x migration-scripts/*.js
```

### 3. Configuration

#### Firebase Configuration
1. Go to your Firebase Console
2. Navigate to Project Settings → Service Accounts
3. Generate a new private key
4. Save the JSON file as `firebase-service.json` in:
   - `migration-tools/auth/`
   - `migration-tools/firestore/`
   - `migration-tools/storage/`

#### Supabase Configuration
1. Update the following files with your Supabase credentials:
   - `migration-tools/auth/supabase-service.json`
   - `migration-tools/firestore/supabase-service.json`

```json
{
  "host": "your-project.supabase.co",
  "password": "your-database-password",
  "user": "postgres",
  "database": "postgres",
  "port": 5432
}
```

### 4. Pre-Migration Validation

```bash
# Run validation to check setup
node migration-scripts/validate.js
```

Fix any errors before proceeding.

## 📋 Migration Process

### Phase 1: Authentication Migration

```bash
# Dry run (recommended first)
node migration-scripts/migrate.js --phase=auth --dry-run

# Actual migration
node migration-scripts/migrate.js --phase=auth
```

This will:
- Export all Firebase users with password hashes
- Import users to Supabase Auth
- Preserve user UIDs for data continuity

### Phase 2: Data Migration

```bash
# Migrate all collections
node migration-scripts/migrate.js --phase=data

# Migrate specific collections only
node migration-scripts/migrate.js --phase=data --collections=users,journal_entries,goals
```

This will:
- Export Firebase collections to JSON
- Transform data using custom mappers
- Import to appropriate Supabase tables

### Phase 3: Storage Migration

```bash
# Migrate all storage buckets
node migration-scripts/migrate.js --phase=storage

# Migrate specific buckets
node migration-scripts/migrate.js --phase=storage --buckets=user-uploads,audio-guides
```

### Full Migration

```bash
# Run all phases in sequence
node migration-scripts/migrate.js --phase=all --verbose
```

## 📊 Data Mapping

### Collection Mappings

| Firebase Collection | Supabase Table | Notes |
|-------------------|----------------|-------|
| `users` | `profiles` | Merged with user_profiles |
| `user_profiles` | `profiles` | Merged with users |
| `journal_entries` | `journal_entries` | Direct mapping |
| `goals` | `goals` | Direct mapping |
| `goal_completions` | `goal_completions` | Goal ID references mapped |
| `chat_messages` | `chat_history` | Direct mapping |
| `wellness_ratings` | `daily_wellness_ratings` | Direct mapping |
| `happiness_scores` | `sexual_happiness_scores` | Direct mapping |
| `audio_progress` | `audio_guide_progress` | Direct mapping |
| `onboarding_selections` | `onboarding_selections` | Direct mapping |
| `subscriptions` | `subscriptions` | Plan references need manual mapping |

### Field Mappings

#### Users → Profiles
```javascript
{
  id: firebaseUser.uid,                    // Preserved
  username: userProfile.username,          // From user_profiles
  age_range: userProfile.age_range,        // From user_profiles  
  gender: userProfile.gender,              // From user_profiles
  sexuality: userProfile.sexuality,        // From user_profiles
  relationship_status: userProfile.relationship_status, // From user_profiles
  onboarding_completed: userProfile.onboarding_completed,
  points: userProfile.points || 0,
  updated_at: converted_timestamp
}
```

#### Timestamp Conversion
Firebase Timestamps are converted to PostgreSQL TIMESTAMPTZ:
```javascript
// Firebase: { _seconds: 1640995200, _nanoseconds: 0 }
// Supabase: "2022-01-01T00:00:00.000Z"
```

## 🛠️ Custom Scripts

### Data Mapper (`data-mapper.js`)
Handles all data transformations:
- Timestamp conversions
- ID mapping and preservation
- Field name normalization
- Data type conversions

### Migration Orchestrator (`migrate.js`)
Main migration controller:
- Coordinates migration phases
- Handles errors and rollbacks
- Generates migration reports
- Supports dry-run mode

### Validator (`validate.js`)
Pre-migration validation:
- Checks configuration files
- Validates dependencies
- Tests connectivity
- Verifies schema compatibility

## 📁 File Structure

```
migration-scripts/
├── README.md                    # This file
├── data-mapper.js              # Data transformation logic
├── migrate.js                  # Main migration orchestrator
├── validate.js                 # Pre-migration validation
├── package.json                # Dependencies
└── migration-backups/          # Generated during migration
    ├── firebase-users.json
    ├── journal_entries.json
    ├── profiles_transformed.json
    └── migration-report.json
```

## 🔧 Advanced Usage

### Custom Collection Migration

```bash
# Migrate only specific collections
node migration-scripts/migrate.js --phase=data --collections=users,goals --verbose
```

### Backup Directory

```bash
# Use custom backup location
node migration-scripts/migrate.js --backup-dir=/path/to/backups --phase=all
```

### Dry Run Mode

```bash
# Test migration without making changes
node migration-scripts/migrate.js --phase=all --dry-run --verbose
```

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Permission Errors**
   - Ensure service account has Firestore and Auth read permissions
   - Check that project ID is correct in service key

2. **Supabase Connection Errors**
   - Verify database credentials
   - Check that RLS policies allow insertions
   - Ensure tables exist (run database-setup.sql first)

3. **Data Mapping Errors**
   - Check that all required fields are present
   - Verify foreign key relationships
   - Review transformation logs

4. **Memory Issues with Large Datasets**
   - Use collection-specific migrations
   - Increase Node.js memory: `node --max-old-space-size=4096`
   - Process in smaller batches

### Recovery

If migration fails midway:

1. **Check the migration report** in `migration-backups/migration-report.json`
2. **Review logs** for specific error messages
3. **Fix issues** and re-run specific phase
4. **Use backups** to restore if needed

```bash
# Re-run specific phase after fixing issues
node migration-scripts/migrate.js --phase=data --collections=goals
```

## 📈 Post-Migration

### Validation Steps

1. **Compare record counts** between Firebase and Supabase
2. **Test user authentication** with existing credentials
3. **Verify data relationships** and foreign keys
4. **Test core application features**
5. **Performance testing** with typical usage patterns

### App Configuration Updates

After successful migration, update your app to use Supabase:

1. Update Supabase client configuration
2. Remove Firebase SDK dependencies
3. Update authentication flows
4. Update data access patterns
5. Test thoroughly in staging environment

## 🆘 Support

If you encounter issues:

1. Run validation script first: `node migration-scripts/validate.js`
2. Check migration logs in `migration-backups/`
3. Review this README for troubleshooting steps
4. Consult the official migration guides referenced in `MIGRATION_PLAN.md`

## 📚 Resources

- [Supabase Migration Documentation](https://supabase.com/docs/guides/platform/migrating-to-supabase)
- [Firebase to Supabase Community Tools](https://github.com/supabase-community/firebase-to-supabase)
- [Talk to August Migration Plan](../MIGRATION_PLAN.md) 