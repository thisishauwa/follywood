# Firebase to Supabase Migration Plan

## Overview
This document outlines the complete migration strategy from Firebase to Supabase for the Talk to August app, ensuring data integrity, user authentication continuity, and seamless transition.

## Migration Components

### 1. Authentication Migration
**Goal**: Migrate all Firebase Auth users to Supabase Auth while preserving login capabilities

**Process**:
- Export Firebase users with password hash parameters
- Import users to Supabase Auth with proper password hashing
- Implement middleware for password verification during transition period
- Maintain user UUIDs for data continuity

### 2. Firestore Data Migration
**Goal**: Migrate Firebase collections to Supabase tables with proper schema mapping

**Firebase → Supabase Mapping**:
```
Firebase Collection     → Supabase Table
users                  → profiles
user_profiles          → profiles (merged)
journal_entries        → journal_entries
goals                  → goals
goal_completions       → goal_completions
audio_progress         → audio_guide_progress
chat_messages          → chat_history
wellness_ratings       → daily_wellness_ratings
happiness_scores       → sexual_happiness_scores
subscriptions          → subscriptions
```

### 3. Storage Migration
**Goal**: Migrate Firebase Storage files to Supabase Storage

**Components**:
- Audio files (guides, recordings)
- User profile images
- Journal attachments (if any)

## Detailed Migration Steps

### Phase 1: Pre-Migration Setup
1. **Environment Setup**
   - Clone migration tools
   - Configure Firebase service account
   - Configure Supabase connection
   - Set up development environment

2. **Data Audit**
   - Export Firebase user count
   - Audit Firestore collections and document counts
   - Inventory Firebase Storage usage
   - Document custom fields and data structures

3. **Schema Preparation**
   - Ensure Supabase schema matches data requirements
   - Create temporary staging tables if needed
   - Set up data transformation rules

### Phase 2: Authentication Migration
1. **Export Firebase Users**
   - Use `firestoreusers2json.js` to export all users
   - Capture password hash parameters
   - Export user metadata and custom claims

2. **Import to Supabase**
   - Use `import_users.js` to import users
   - Preserve user UUIDs for data relationship integrity
   - Set up password verification middleware

3. **Testing**
   - Test user login with existing credentials
   - Verify user metadata transfer
   - Test password reset functionality

### Phase 3: Data Migration
1. **Export Firestore Data**
   - Use `firestore2json.js` to export each collection
   - Apply data transformation rules
   - Handle nested documents and arrays

2. **Data Transformation**
   - Map Firebase document IDs to Supabase UUIDs
   - Transform data types (timestamps, references)
   - Handle array fields and nested objects

3. **Import to Supabase**
   - Use `json2supabase.js` with custom mapping
   - Import in dependency order (users → profiles → related data)
   - Validate foreign key relationships

### Phase 4: Storage Migration
1. **Download Firebase Storage**
   - Export all files from Firebase Storage
   - Organize by bucket and path structure

2. **Upload to Supabase Storage**
   - Create equivalent bucket structure
   - Upload files maintaining path references
   - Update database references to new URLs

### Phase 5: Validation & Testing
1. **Data Integrity Checks**
   - Compare record counts between Firebase and Supabase
   - Validate critical user journeys
   - Test data relationships and constraints

2. **Application Testing**
   - Update app configuration to use Supabase
   - Test all core features
   - Verify authentication flows

3. **Performance Testing**
   - Compare query performance
   - Test under load
   - Optimize if necessary

### Phase 6: Go-Live
1. **Final Sync**
   - Export any new data created during migration
   - Perform incremental update
   - Verify synchronization

2. **Cutover**
   - Update DNS/configuration to point to Supabase
   - Monitor for issues
   - Keep Firebase as backup for 30 days

## Risk Mitigation

### Data Loss Prevention
- Full backups before starting migration
- Incremental migration with rollback points
- Comprehensive testing environment
- Data validation at each step

### User Experience Continuity
- Transparent authentication migration
- Password reset fallback for any auth issues
- Gradual feature migration if needed
- Clear communication plan

### Technical Risks
- Dry run migrations in staging environment
- Automated rollback procedures
- 24/7 monitoring during cutover
- Team on standby for immediate response

## Custom Migration Scripts Needed

### 1. User Profile Merger
```javascript
// Merge Firebase 'users' and 'user_profiles' collections into Supabase 'profiles'
// Handle conflicting fields and data normalization
```

### 2. Timestamp Converter
```javascript
// Convert Firebase Timestamps to PostgreSQL TIMESTAMPTZ
// Handle timezone conversions
```

### 3. Reference Mapper
```javascript
// Map Firebase document references to Supabase foreign keys
// Maintain referential integrity
```

### 4. Array Field Handler
```javascript
// Convert Firebase arrays to PostgreSQL array columns
// Handle nested objects within arrays
```

## Data Mapping Details

### User/Profile Mapping
```
Firebase: /users/{uid}        → Supabase: profiles.id
Firebase: /user_profiles/{uid} → Supabase: profiles.* (merged)
```

### Journal Entries
```
Firebase: /journal_entries/{id} → Supabase: journal_entries.*
- Convert createdAt timestamp
- Map userId reference
- Handle tags array
```

### Goals & Completions
```
Firebase: /goals/{id} → Supabase: goals.*
Firebase: /goal_completions/{id} → Supabase: goal_completions.*
- Map goal references
- Convert completion timestamps
```

### Chat History
```
Firebase: /chat_messages/{id} → Supabase: chat_history.*
- Map user references
- Convert message timestamps
- Handle message threading if present
```

## Timeline Estimate

**Week 1**: Setup and Preparation
- Environment configuration
- Data audit and schema validation
- Migration scripts development

**Week 2**: Authentication Migration
- User export and import
- Authentication testing
- Middleware implementation

**Week 3**: Data Migration
- Collection exports
- Data transformation
- Supabase imports and validation

**Week 4**: Storage and Final Testing
- Storage migration
- End-to-end testing
- Performance optimization

**Week 5**: Go-Live Preparation
- Final sync
- Cutover planning
- Monitoring setup

## Success Criteria

1. **100% user migration** with preserved authentication
2. **Zero data loss** during migration
3. **Functional parity** with Firebase implementation
4. **Performance equivalence** or improvement
5. **Seamless user experience** during transition

## Rollback Plan

If issues arise during migration:
1. Immediately revert DNS/configuration to Firebase
2. Analyze and fix issues in staging environment
3. Re-attempt migration with lessons learned
4. Maintain Firebase as active system until confident in Supabase migration

## Team Responsibilities

- **Database Migration**: Lead developer + 1 backup
- **Authentication**: Authentication specialist
- **Testing**: QA team + selected beta users
- **Monitoring**: DevOps/Infrastructure team
- **Communication**: Product manager + support team 