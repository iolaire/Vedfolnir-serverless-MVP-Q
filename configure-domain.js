#!/usr/bin/env node

/*
 * Copyright (C) 2025 iolaire mcfadden
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Load domain configuration
let domainConfig;
try {
  domainConfig = JSON.parse(fs.readFileSync('./domain-config.json', 'utf8'));
} catch (error) {
  console.error('❌ Error: domain-config.json not found. Copy domain-config.sample.json to domain-config.json and update with your domain.');
  process.exit(1);
}

console.log('🔧 Configuring Lambda CORS for domain:', domainConfig.fullDomain);

// Update Lambda CORS configuration
execSync(`aws lambda update-function-url-config \
  --function-name ${domainConfig.lambdaFunctionName} \
  --cors AllowOrigins="https://${domainConfig.fullDomain}",AllowMethods="POST",AllowHeaders="*"`, 
  { stdio: 'inherit' });

console.log('✅ CORS configuration updated');
console.log(`🌐 Lambda now accepts requests from: https://${domainConfig.fullDomain}`);
