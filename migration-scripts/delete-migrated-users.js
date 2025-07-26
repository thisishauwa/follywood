#!/usr/bin/env node

/**
 * Supabase User Deletion Script
 * Deletes users from Supabase Auth using the Admin API.
 */

require('dotenv').config();
const fs = require('fs');
const https = require('https');

class UserDeleter {
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

  async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const url = `${this.supabaseUrl}/auth/v1/admin/users/${userId}`;
      const options = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.serviceKey}`,
          'apikey': this.serviceKey,
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            this.log(`✅ Successfully deleted user ${userId}`);
            resolve();
          } else {
            reject(new Error(`Failed to delete user ${userId}. Status: ${res.statusCode}, Body: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async run(userIds) {
    this.log(`🔥 Starting deletion of ${userIds.length} users...`);
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        await this.deleteUser(userId);
        successCount++;
      } catch (error) {
        this.log(`❌ ${error.message}`);
        failCount++;
      }
    }

    this.log('🎉 Deletion process completed!');
    this.log(`✅ Success: ${successCount} users`);
    this.log(`❌ Failed: ${failCount} users`);
  }
}

async function main() {
  const usersIdPath = 'migration-backups/user_ids_to_delete.json';
  if (!fs.existsSync(usersIdPath)) {
    console.error('❌ User IDs file not found at ' + usersIdPath);
    console.error('Please run get-migrated-user-ids.js first.');
    return;
  }

  console.log(`Preparing to delete users from ${usersIdPath}.`);

  const userIdsToDelete = JSON.parse(fs.readFileSync(usersIdPath, 'utf8'));

  if (userIdsToDelete.length > 0) {
    const deleter = new UserDeleter();
    await deleter.run(userIdsToDelete);
  } else {
      console.log('No users to delete.');
  }
}

if (require.main === module) {
  main().catch(console.error);
} 