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

// Auto-detect AWS resources (no longer saved to config)
console.log('🔍 Auto-detecting AWS resources...');

// Dynamically detect Amplify App ID by project name
let APP_ID;
try {
    const amplifyApps = JSON.parse(execSync('aws amplify list-apps --query "apps" --output json', { encoding: 'utf8' }));
    const projectApp = amplifyApps.find(app => 
        app.name.includes(domainConfig.projectName) || 
        app.description?.includes(domainConfig.projectName)
    );
    if (projectApp) {
        APP_ID = projectApp.appId;
        console.log(`🔍 Found Amplify App for project "${domainConfig.projectName}": ${APP_ID}`);
    } else {
        console.log(`⚠️ No Amplify app found for project "${domainConfig.projectName}", creating one...`);
        const createResult = JSON.parse(execSync(`aws amplify create-app --name "${domainConfig.projectName}" --description "Alt text generator for ${domainConfig.projectName}" --tags "Project=${domainConfig.projectName},Environment=prod,ManagedBy=vedfolnir" --query "app" --output json`, { encoding: 'utf8' }));
        APP_ID = createResult.appId;
        console.log(`✅ Created Amplify App: ${APP_ID}`);
    }
} catch (error) {
    console.log(`⚠️ Error finding Amplify app, creating one for project "${domainConfig.projectName}"...`);
    const createResult = JSON.parse(execSync(`aws amplify create-app --name "${domainConfig.projectName}" --description "Alt text generator for ${domainConfig.projectName}" --tags "Project=${domainConfig.projectName},Environment=prod,ManagedBy=vedfolnir" --query "app" --output json`, { encoding: 'utf8' }));
    APP_ID = createResult.appId;
    console.log(`✅ Created Amplify App: ${APP_ID}`);
}

const BRANCH_NAME = 'main';

function run(command) {
  console.log(`🔧 ${command}`);
  return execSync(command, { stdio: 'inherit' });
}

console.log('🚀 Starting Amplify Zip Deployment...');
console.log(`🌐 Target Domain: ${domainConfig.fullDomain}`);
console.log(`📋 Project Name: ${domainConfig.projectName}`);

// Dynamically detect Lambda function name based on project
let LAMBDA_NAME;
try {
    const lambdaFunctions = JSON.parse(execSync('aws lambda list-functions --output json', { encoding: 'utf8' }));
    const matchingFunction = lambdaFunctions.Functions.find(func => 
        func.FunctionName.includes(domainConfig.projectName) || 
        func.FunctionName.includes('alt-text') || 
        func.FunctionName.includes('bedrock')
    );
    if (matchingFunction) {
        LAMBDA_NAME = matchingFunction.FunctionName;
        console.log(`🔍 Found Lambda function: ${LAMBDA_NAME}`);
    } else {
        throw new Error('No matching Lambda function found');
    }
} catch (error) {
    console.error('❌ Error: Could not find Lambda function for project');
    process.exit(1);
}

// Get current Lambda URL dynamically
let lambdaUrl;
try {
    lambdaUrl = execSync(`aws lambda get-function-url-config --function-name ${LAMBDA_NAME} --query FunctionUrl --output text`, { encoding: 'utf8' }).trim();
} catch (error) {
    console.log('⚠️ Function URL not found, creating one...');
    execSync(`aws lambda create-function-url-config --function-name ${LAMBDA_NAME} --auth-type NONE --cors "AllowCredentials=false,AllowHeaders=*,AllowMethods=*,AllowOrigins=https://${domainConfig.fullDomain},ExposeHeaders=*,MaxAge=86400"`);
    lambdaUrl = execSync(`aws lambda get-function-url-config --function-name ${LAMBDA_NAME} --query FunctionUrl --output text`, { encoding: 'utf8' }).trim();
}

console.log('📋 Current Lambda URL:', lambdaUrl);

// Set environment variables in Amplify
console.log('⚙️ Setting Amplify environment variables...');
run(`aws amplify update-app --app-id ${APP_ID} --environment-variables LAMBDA_URL=${lambdaUrl}`);

// Build frontend
console.log('📦 Building frontend...');

// Update index.html from template with current Lambda URL
const templatePath = './frontend/index.html.template';
const indexPath = './frontend/index.html';
if (fs.existsSync(templatePath)) {
    console.log('🔧 Updating index.html from template with Lambda URL...');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const updatedContent = templateContent.replace(/{{LAMBDA_URL}}/g, lambdaUrl);
    fs.writeFileSync(indexPath, updatedContent);
    console.log('✅ Updated index.html with Lambda URL');
}

run('cd frontend && npm run build');

// Replace Lambda URL in built index.html
console.log('🔧 Replacing Lambda URL in built index.html...');
const builtIndexPath = './frontend/dist/index.html';
let builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');
builtIndexContent = builtIndexContent.replace('{{LAMBDA_URL}}', lambdaUrl);
fs.writeFileSync(builtIndexPath, builtIndexContent);
console.log('✅ Lambda URL replaced in built index.html');

// Create deployment
console.log('🔧 Creating deployment...');

// Ensure main branch exists
try {
  execSync(`aws amplify get-branch --app-id ${APP_ID} --branch-name ${BRANCH_NAME}`, { encoding: 'utf8', stdio: 'pipe' });
} catch (error) {
  console.log('ℹ️ Info: Branch main not found, it will be created');
  console.log('🌿 Creating main branch...');
  execSync(`aws amplify create-branch --app-id ${APP_ID} --branch-name ${BRANCH_NAME}`, { encoding: 'utf8' });
}

const deploymentResult = JSON.parse(execSync(`aws amplify create-deployment --app-id ${APP_ID} --branch-name ${BRANCH_NAME} --output json`, { encoding: 'utf8' }));

console.log('📋 Job ID:', deploymentResult.jobId);
console.log('📤 Upload URL:', deploymentResult.zipUploadUrl);

// Create zip file
console.log('📦 Creating zip file...');
run('cd frontend/dist && zip -r ../../amplify-deploy.zip .');

// Upload zip file
console.log('☁️ Uploading zip file...');
run(`curl -X PUT "${deploymentResult.zipUploadUrl}" --data-binary @amplify-deploy.zip -H "Content-Type: application/zip"`);

// Start deployment
console.log('🚀 Starting deployment...');
run(`aws amplify start-deployment --app-id ${APP_ID} --branch-name ${BRANCH_NAME} --job-id ${deploymentResult.jobId}`);

// Configure SPA redirect rules only (MVP approach)
console.log('⚙️ Configuring SPA redirect rules...');
const customRules = [
  { source: '/dashboard', target: '/index.html', status: '200' },
  { source: '/<*>', target: '/index.html', status: '404-200' }
];

run(`aws amplify update-app --app-id ${APP_ID} --custom-rules '${JSON.stringify(customRules)}'`);
console.log('✅ SPA redirect rules configured');

// Clean up
run('rm -f amplify-deploy.zip');

console.log('✅ Amplify Deployment Complete!');
console.log(`🌐 URL: https://main.${APP_ID}.amplifyapp.com`);
console.log(`🌐 Custom Domain: https://${domainConfig.fullDomain}`);
