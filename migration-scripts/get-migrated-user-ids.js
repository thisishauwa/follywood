#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const https = require('https');

class UserIdFetcher {
    constructor() {
        this.supabaseUrl = 'https://vejkcysxjhuotptwjtjs.supabase.co';
        this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!this.serviceKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env file.');
        }
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    async fetchUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const url = `${this.supabaseUrl}/auth/v1/admin/users?per_page=1&page=1&filter=${encodeURIComponent(email)}`;
            const options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.serviceKey,
                }
            };
            const req = https.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(responseData);
                        const user = parsed.users.find(u => u.email === email);
                        resolve(user);
                    } else {
                        reject(new Error(`API request failed with status ${res.statusCode}: ${responseData}`));
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }
}

async function main() {
    const authUsersPath = 'migration-tools/auth/users.json';
    if (!fs.existsSync(authUsersPath)) {
        console.error('❌ Firebase auth users export not found at ' + authUsersPath);
        return;
    }
    const allFirebaseUsers = JSON.parse(fs.readFileSync(authUsersPath, 'utf8'));
    const emailsToFetch = allFirebaseUsers.map(u => u.email).filter(Boolean);

    console.log(`Fetching Supabase UUIDs for ${emailsToFetch.length} users...`);

    const fetcher = new UserIdFetcher();
    const foundUserIds = [];

    for (const email of emailsToFetch) {
        try {
            const user = await fetcher.fetchUserByEmail(email);
            if (user && user.id) {
                console.log(`✅ Found: ${email} -> ${user.id}`);
                foundUserIds.push(user.id);
            } else {
                // This case is handled by the check above, but good for verbosity
                // console.log(`- User with email ${email} not found.`);
            }
        } catch (error) {
            console.error(`❌ Error fetching user ${email}: ${error.message}`);
        }
    }
    
    const outputPath = 'migration-backups/user_ids_to_delete.json';
    fs.writeFileSync(outputPath, JSON.stringify(foundUserIds, null, 2));
    console.log(`\nSaved ${foundUserIds.length} user IDs to ${outputPath}`);
}

if (require.main === module) {
    main().catch(console.error);
} 