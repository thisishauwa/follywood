#!/usr/bin/env node

/**
 * Alternative Firebase Auth to Supabase Migration
 * Uses Supabase REST API instead of direct PostgreSQL connection
 */

require('dotenv').config();
const fs = require('fs');
const https = require('https');
const { getFirestoreInstance } = require('../migration-tools/firestore/utils');

class APIBasedAuthMigration {
    constructor() {
        this.supabaseUrl = 'https://vejkcysxjhuotptwjtjs.supabase.co';
        this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.migrationReport = {
            startTime: new Date().toISOString(),
            totalUsers: 0,
            processedUsers: 0,
            successfulUsers: 0,
            failedUsers: 0,
            errors: []
        };
        this.firestoreProfileData = new Map();
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    async makeSupabaseRequest(endpoint, method = 'POST', data = null, additionalHeaders = {}) {
        return new Promise((resolve, reject) => {
            const url = `${this.supabaseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.serviceKey,
                    'Content-Type': 'application/json',
                    ...additionalHeaders
                }
            };

            const req = https.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(responseData || '{}'));
                        } catch (e) {
                            resolve({}); // Resolve with empty for 204 No Content
                        }
                    } else {
                        reject(new Error(`Request to ${url} failed with status ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', reject);
            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async createAuthUser(firebaseUser, profileData) {
        const endpoint = '/auth/v1/admin/users';
        const displayName = firebaseUser.displayName || profileData?.display_name || '';
        const userData = {
            email: firebaseUser.email,
            password: `imported-${Date.now()}-${Math.random()}`,
            email_confirm: firebaseUser.emailVerified || false,
            user_metadata: { firebase_uid: firebaseUser.uid, full_name: displayName },
            app_metadata: { provider: 'email', providers: ['email'] },
            created_at: firebaseUser.metadata?.creationTime
        };
        return this.makeSupabaseRequest(endpoint, 'POST', userData);
    }
    
    async fetchUserByEmail(email) {
        const endpoint = `/auth/v1/admin/users?per_page=1&page=1&filter=${encodeURIComponent(email)}`;
        const response = await this.makeSupabaseRequest(endpoint, 'GET');
        const user = response.users.find(u => u.email === email);
        if (user) return user;
        throw new Error(`User with email ${email} not found via API.`);
    }

    transformAndMapProfileData(profileData) {
        const ageRangeMapping = {
            "16 - 24": "16-20", "18 - 24": "21-25", "25 - 34": "26-30", "25 - 35": "26-30",
            "35 - 44": "36-45", "45 - 54": "45+", "55+": "45+"
        };
        const rawAge = profileData.age_range || profileData.age;
        let mappedAgeRange = ageRangeMapping[rawAge] || rawAge;

        const allowedAgeRanges = ["16-20", "21-25", "26-30", "31-35", "36-45", "45+"];
        if (!allowedAgeRanges.includes(mappedAgeRange)) {
            mappedAgeRange = null; // Set to null if not a valid range
        }

        const relationshipStatusMapping = {
            "In a relationship": "dating",
            "Single": "single",
            "Married": "married",
            "dating": "dating" // ensure 'dating' passes through
        };
        const rawRelationshipStatus = profileData.relationship_status || profileData.relationship_stattus;
        let mappedRelationshipStatus = relationshipStatusMapping[rawRelationshipStatus] || rawRelationshipStatus;

        // If the mapped status is not one of the allowed values, set it to null
        const allowedStatus = ['single', 'dating', 'married', 'other'];
        if (!allowedStatus.includes(mappedRelationshipStatus)) {
            mappedRelationshipStatus = null;
        }

        // Gender mapping
        const genderMapping = {
            "Female": "female",
            "Male": "male",
            "Non-binary": "non_binary",
            "Prefer not to say": "prefer_not_to_say"
        };
        let mappedGender = genderMapping[profileData.gender] || profileData.gender;
        const allowedGenders = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
        if (!allowedGenders.includes(mappedGender)) {
            mappedGender = null;
        }

        // Sexuality mapping
        const sexualityMapping = {
            "Straight": "straight",
            "Bisexual": "bisexual",
            "Queer": "queer",
            "Lesbian": "lesbian",
            "Prefer not to say": "prefer_not_to_say"
        };
        let mappedSexuality = sexualityMapping[profileData.sexuality] || profileData.sexuality;
        const allowedSexuality = ['straight', 'bisexual', 'queer', 'lesbian', 'prefer_not_to_say'];
        if (!allowedSexuality.includes(mappedSexuality)) {
            mappedSexuality = null;
        }

        // Transform Firebase user profile data to match Supabase profiles table schema
        const dataToUpdate = {
            username: profileData.username || profileData.display_name,
            age_range: mappedAgeRange, // Use the mapped value
            gender: mappedGender,
            sexuality: mappedSexuality,
            relationship_status: mappedRelationshipStatus, // Correct typo and map value
            onboarding_completed: profileData.onboardingCompleted === true,
            points: profileData.points || 0,
            updated_at: new Date().toISOString()
        };

        Object.keys(dataToUpdate).forEach(key => (dataToUpdate[key] === undefined || dataToUpdate[key] === null) && delete dataToUpdate[key]);
        return dataToUpdate;
    }

  async updateSupabaseProfile(userId, profileData) {
    const endpoint = `/rest/v1/profiles?id=eq.${userId}`;
    let dataToUpdate = this.transformAndMapProfileData(profileData);

    if (Object.keys(dataToUpdate).length <= 1) {
        this.log(`- No new profile data to update for user ${userId}. Skipping.`);
        return;
    }

    this.log(`Updating profile for ${userId} with ${Object.keys(dataToUpdate).length} fields...`);

    try {
        return await this.makeSupabaseRequest(endpoint, 'PATCH', dataToUpdate, { 'Prefer': 'return=minimal' });
    } catch (error) {
        // Handle unique username constraint violation
        if (error.message.includes('profiles_username_key')) {
            this.log(`- Username ${dataToUpdate.username} already exists. Retrying with a unique username.`);
            dataToUpdate.username = `${dataToUpdate.username}_${Math.random().toString(36).substring(2, 7)}`;
            return this.makeSupabaseRequest(endpoint, 'PATCH', dataToUpdate, { 'Prefer': 'return=minimal' });
        }
        // Re-throw other errors
        throw error;
    }
  }

  async setProfileTrigger(enable) {
    const action = enable ? 'Enabling' : 'Disabling';
    this.log(`${action} trigger on_auth_user_created on auth.users...`);
    const endpoint = '/rest/v1/rpc/manage_migration_trigger';
    const data = { enable_trigger: enable };
    return this.makeSupabaseRequest(endpoint, 'POST', data);
  }

  async migrateUser(firebaseUser, index) {
        try {
            this.log(`Migrating user ${index + 1}: ${firebaseUser.email}`);

            // Get corresponding profile data from Firestore export first
            const profileData = this.firestoreProfileData.get(firebaseUser.uid);

            let supabaseUser;
            try {
                supabaseUser = await this.createAuthUser(firebaseUser, profileData);
            } catch (error) {
                if (error.message.includes("User already registered")) {
                    this.log(`- User ${firebaseUser.email} already exists. Fetching to update profile.`);
                    supabaseUser = await this.fetchUserByEmail(firebaseUser.email);
                } else {
                    // Re-throw other critical errors
                    throw error;
                }
            }

            // If we couldn't create or find the user, we can't proceed.
            if (!supabaseUser || !supabaseUser.id) {
                throw new Error(`Could not create or find Supabase user for ${firebaseUser.email}`);
            }

            // Step 3: Update the profile created by the trigger
            if (profileData) {
                await this.updateSupabaseProfile(supabaseUser.id, profileData);
            } else {
                this.log(`- No Firestore profile data for ${firebaseUser.email}. A profile will need to be created manually or on first login.`);
            }

            this.migrationReport.successfulUsers++;
        } catch (error) {
            this.migrationReport.failedUsers++;
            this.migrationReport.errors.push({ user: firebaseUser.email, error: error.message });
            this.log(`❌ Failed to migrate ${firebaseUser.email}: ${error.message}`);
        }
    }

    async exportFirestoreCollection(collectionName) {
        this.log(`Exporting Firestore collection: ${collectionName}...`);
        const db = getFirestoreInstance();
        const snapshot = await db.collection(collectionName).get();
        const data = snapshot.docs.map(doc => ({ ...doc.data(), firestore_id: doc.id }));
        const filePath = `migration-tools/firestore/${collectionName}.json`;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        this.log(`✅ Exported ${data.length} documents from '${collectionName}' to ${filePath}`);
        return data;
    }

  async insertSupabaseProfile(userId, profileData) {
    this.log(`Inserting profile for ${userId} with ${Object.keys(profileData).length} fields...`);
    // We must remove the updated_at field as the database sets it on insert
    delete profileData.updated_at;
    return this.makeSupabaseRequest('/rest/v1/profiles', 'POST', profileData, { 'Prefer': 'return=minimal' });
  }

    async runMigration(dryRun = true, batchSize = null, offset = 0) {
        this.log('🚀 Starting Firebase Auth Migration via API...');
        this.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

        const authUsersPath = 'migration-tools/auth/users.json';
        if (!fs.existsSync(authUsersPath)) {
            throw new Error('Firebase auth users export not found.');
        }
        let allFirebaseUsers = JSON.parse(fs.readFileSync(authUsersPath, 'utf8'));

        // Sort by creation time to ensure we keep the oldest record in case of duplicates
        allFirebaseUsers.sort((a, b) => {
            const timeA = a.metadata?.creationTime ? new Date(a.metadata.creationTime).getTime() : 0;
            const timeB = b.metadata?.creationTime ? new Date(b.metadata.creationTime).getTime() : 0;
            return timeA - timeB;
        });
        
        // Deduplicate users by email, keeping the first one (which is the oldest)
        const seenEmails = new Set();
        const uniqueFirebaseUsers = allFirebaseUsers.filter(user => {
            if (!user.email || seenEmails.has(user.email.toLowerCase())) {
                return false;
            }
            seenEmails.add(user.email.toLowerCase());
            return true;
        });

        const firestoreUsers = await this.exportFirestoreCollection('users');
        firestoreUsers.forEach(profile => this.firestoreProfileData.set(profile.firestore_id, profile));

        let usersToProcess = uniqueFirebaseUsers.slice(offset);

        if (batchSize) {
            usersToProcess = usersToProcess.slice(0, parseInt(batchSize));
        }

        this.migrationReport.totalUsers = usersToProcess.length;
        this.log(`Found ${allFirebaseUsers.length} total Firebase users. After deduplication, processing ${usersToProcess.length}...`);

        if (dryRun) {
            this.log('DRY RUN: Simulating migration...');
            for (let i = 0; i < Math.min(5, usersToProcess.length); i++) {
                const user = usersToProcess[i];
                const profileData = this.firestoreProfileData.get(user.uid);
                this.log(`[Dry Run] Would create auth user for: ${user.email} (${user.uid})`);
                if (profileData) {
                    const transformed = this.transformAndMapProfileData(profileData);
                    this.log(`[Dry Run] -> And then update profile with: ${JSON.stringify(transformed)}`);
                } else {
                    this.log(`[Dry Run] -> No matching profile data found.`);
                }
            }
            this.log('DRY RUN completed successfully');
            return;
        }

        try {
            for (let i = 0; i < usersToProcess.length; i++) {
                await this.migrateUser(usersToProcess[i], i);
                if ((i + 1) % 50 === 0) {
                    this.log(`Progress: ${i + 1}/${usersToProcess.length} users processed`);
                }
            }
        } finally {
             // No longer needed as trigger is not managed by this script
        }
        
        this.migrationReport.endTime = new Date().toISOString();
        fs.writeFileSync('migration-backups/auth-migration-report.json', JSON.stringify(this.migrationReport, null, 2));
        this.log('🎉 Migration completed!');
        this.log(`✅ Success: ${this.migrationReport.successfulUsers} users`);
        this.log(`❌ Failed: ${this.migrationReport.failedUsers} users`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || !args.includes('--live');
    const batchSize = args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || null;
    const offset = args.find(arg => arg.startsWith('--offset='))?.split('=')[1] || 0;

    try {
        const migration = new APIBasedAuthMigration();
        if (!migration.serviceKey) {
            console.log('❌ Service role key not configured. Please check your .env file.');
            return;
        }
        await migration.runMigration(dryRun, batchSize, parseInt(offset));
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}