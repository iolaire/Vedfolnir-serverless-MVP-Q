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
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const deleteDomain = args.includes('--delete-domain');

// Load configuration
const configPath = path.join(__dirname, 'domain-config.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ domain-config.json not found');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { projectName, fullDomain, region } = config;
const lambdaFunctionName = `${projectName}-lambda`;

// Dynamically detect Amplify app ID
let amplifyAppId;
try {
    const amplifyApps = JSON.parse(execSync('aws amplify list-apps --output json', { encoding: 'utf8' }));
    const matchingApp = amplifyApps.apps.find(app => 
        app.name.includes('alt-text') || app.name.includes(projectName)
    );
    if (matchingApp) {
        amplifyAppId = matchingApp.appId;
        console.log(`🔍 Auto-detected Amplify app: ${matchingApp.name} (${matchingApp.appId})`);
    }
} catch (error) {
    console.log('⚠️ Could not auto-detect Amplify app');
}

// Dynamically detect hosted zone ID
let hostedZoneId;
try {
    const hostedZones = JSON.parse(execSync('aws route53 list-hosted-zones --output json', { encoding: 'utf8' }));
    const matchingZone = hostedZones.HostedZones.find(zone => 
        zone.Name.includes(config.domain)
    );
    if (matchingZone) {
        hostedZoneId = matchingZone.Id.replace('/hostedzone/', '');
        console.log(`🔍 Auto-detected hosted zone: ${matchingZone.Name} (${hostedZoneId})`);
    }
} catch (error) {
    console.log('⚠️ Could not auto-detect hosted zone');
}

console.log(`🗑️  Destroying AWS resources for project: ${projectName}`);
console.log(`📍 Region: ${region}`);
console.log(`🌐 Domain: ${fullDomain}`);

function runCommand(command, description) {
    try {
        console.log(`\n⏳ ${description}...`);
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} completed`);
        return result;
    } catch (error) {
        console.log(`⚠️  ${description} failed (may not exist): ${error.message.split('\n')[0]}`);
        return null;
    }
}

// 1. Delete Lambda function
runCommand(
    `aws lambda delete-function --function-name ${lambdaFunctionName} --region ${region}`,
    'Deleting Lambda function'
);

// 2. Delete Amplify app and unlink domain
if (amplifyAppId) {
    // First, unlink the domain to prevent conflicts on redeploy
    try {
        console.log('\n⏳ Unlinking custom domain...');
        execSync(`aws amplify delete-domain-association --app-id ${amplifyAppId} --domain-name ${fullDomain}`, { encoding: 'utf8' });
        console.log('✅ Domain unlinked from Amplify app');
    } catch (error) {
        console.log('ℹ️ No domain association to unlink');
    }
    
    runCommand(
        `aws amplify delete-app --app-id ${amplifyAppId} --region ${region}`,
        'Deleting Amplify app'
    );
}

// 3. Delete S3 bucket (empty first, then delete)
const bucketName = `${projectName}-frontend`;
runCommand(
    `aws s3 rm s3://${bucketName} --recursive --region ${region}`,
    'Emptying S3 bucket'
);
runCommand(
    `aws s3 rb s3://${bucketName} --region ${region}`,
    'Deleting S3 bucket'
);

// 4. Find and delete CloudFront distribution
try {
    console.log('\n⏳ Finding CloudFront distribution...');
    const distributions = execSync(
        `aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, '${fullDomain}')].{Id:Id,DomainName:DomainName}" --output json --region ${region}`,
        { encoding: 'utf8' }
    );
    
    const distList = JSON.parse(distributions);
    if (distList && distList.length > 0) {
        const distId = distList[0].Id;
        
        // Get distribution config
        const configResult = execSync(
            `aws cloudfront get-distribution-config --id ${distId} --region ${region}`,
            { encoding: 'utf8' }
        );
        const distConfig = JSON.parse(configResult);
        
        // Disable distribution first
        distConfig.DistributionConfig.Enabled = false;
        fs.writeFileSync('/tmp/dist-config.json', JSON.stringify(distConfig.DistributionConfig));
        
        runCommand(
            `aws cloudfront update-distribution --id ${distId} --distribution-config file:///tmp/dist-config.json --if-match ${distConfig.ETag} --region ${region}`,
            'Disabling CloudFront distribution'
        );
        
        console.log('⏳ Waiting for distribution to be disabled (this may take 10-15 minutes)...');
        runCommand(
            `aws cloudfront wait distribution-deployed --id ${distId} --region ${region}`,
            'Waiting for distribution deployment'
        );
        
        runCommand(
            `aws cloudfront delete-distribution --id ${distId} --if-match ${distConfig.ETag} --region ${region}`,
            'Deleting CloudFront distribution'
        );
    } else {
        console.log('⚠️  No CloudFront distribution found for domain');
    }
} catch (error) {
    console.log(`⚠️  CloudFront cleanup failed: ${error.message.split('\n')[0]}`);
}

// 5. Delete Route 53 records (if --delete-domain flag is used)
if (deleteDomain) {
    try {
        console.log('\n⏳ Deleting Route 53 records...');
        
        // Get existing records
        const records = execSync(
            `aws route53 list-resource-record-sets --hosted-zone-id ${hostedZoneId} --query "ResourceRecordSets[?Name=='${fullDomain}.']" --output json --region ${region}`,
            { encoding: 'utf8' }
        );
        
        const recordList = JSON.parse(records);
        for (const record of recordList) {
            if (record.Type === 'A' || record.Type === 'AAAA') {
                const changeSet = {
                    Changes: [{
                        Action: 'DELETE',
                        ResourceRecordSet: record
                    }]
                };
                
                fs.writeFileSync('/tmp/route53-changes.json', JSON.stringify(changeSet));
                runCommand(
                    `aws route53 change-resource-record-sets --hosted-zone-id ${hostedZoneId} --change-batch file:///tmp/route53-changes.json --region ${region}`,
                    `Deleting ${record.Type} record for ${fullDomain}`
                );
            }
        }
    } catch (error) {
        console.log(`⚠️  Route 53 cleanup failed: ${error.message.split('\n')[0]}`);
    }
} else {
    console.log(`\n📌 Subdomain ${fullDomain} DNS records were left intact (use --delete-domain to remove)`);
}

// 6. Delete monitoring resources
console.log('\n🔍 Cleaning up monitoring resources...');

// Delete CloudWatch alarms
try {
    const alarms = execSync(
        `aws cloudwatch describe-alarms --alarm-name-prefix "${projectName}-" --query "MetricAlarms[].AlarmName" --output text --region ${region}`,
        { encoding: 'utf8' }
    );
    
    if (alarms.trim()) {
        const alarmNames = alarms.trim().split('\t');
        for (const alarmName of alarmNames) {
            runCommand(
                `aws cloudwatch delete-alarms --alarm-names "${alarmName}" --region ${region}`,
                `Deleting CloudWatch alarm: ${alarmName}`
            );
        }
    }
} catch (error) {
    console.log(`⚠️  CloudWatch alarms cleanup failed: ${error.message.split('\n')[0]}`);
}

// Delete DynamoDB rate limiting table
runCommand(
    `aws dynamodb delete-table --table-name "${projectName}-rate-limits" --region ${region}`,
    'Deleting DynamoDB rate limiting table'
);

// Delete SNS topic and subscriptions
try {
    const topics = execSync(
        `aws sns list-topics --query "Topics[?contains(TopicArn, '${projectName}-alerts')].TopicArn" --output text --region ${region}`,
        { encoding: 'utf8' }
    );
    
    if (topics.trim()) {
        runCommand(
            `aws sns delete-topic --topic-arn "${topics.trim()}" --region ${region}`,
            'Deleting SNS alerts topic'
        );
    }
} catch (error) {
    console.log(`⚠️  SNS topic cleanup failed: ${error.message.split('\n')[0]}`);
}

// Delete CloudWatch dashboard
runCommand(
    `aws cloudwatch delete-dashboards --dashboard-names "${projectName}-Dashboard" --region ${region}`,
    'Deleting CloudWatch dashboard'
);

// 7. Delete ACM certificate (if --delete-domain flag is used)
if (deleteDomain) {
    try {
        console.log('\n⏳ Finding ACM certificate...');
        const certs = execSync(
            `aws acm list-certificates --query "CertificateSummaryList[?DomainName=='${fullDomain}'].CertificateArn" --output text --region us-east-1`,
            { encoding: 'utf8' }
        );
        
        if (certs.trim()) {
            runCommand(
                `aws acm delete-certificate --certificate-arn ${certs.trim()} --region us-east-1`,
                'Deleting ACM certificate'
            );
        }
    } catch (error) {
        console.log(`⚠️  ACM certificate cleanup failed: ${error.message.split('\n')[0]}`);
    }
}

// Cleanup temp files
try {
    fs.unlinkSync('/tmp/dist-config.json');
    fs.unlinkSync('/tmp/route53-changes.json');
} catch (error) {
    // Ignore cleanup errors
}

console.log('\n🎉 Destruction completed!');
console.log('\n📋 Summary:');
console.log(`   • Lambda function: ${lambdaFunctionName}`);
console.log(`   • Amplify app: ${amplifyAppId || 'N/A'}`);
console.log(`   • S3 bucket: ${bucketName}`);
console.log(`   • CloudFront distribution for: ${fullDomain}`);
console.log(`   • CloudWatch alarms: ${projectName}-*`);
console.log(`   • DynamoDB table: ${projectName}-rate-limits`);
console.log(`   • SNS topic: ${projectName}-alerts`);
console.log(`   • CloudWatch dashboard: ${projectName}-Dashboard`);
if (deleteDomain) {
    console.log(`   • Route 53 records: ${fullDomain}`);
    console.log(`   • ACM certificate: ${fullDomain}`);
} else {
    console.log(`   • DNS records preserved: ${fullDomain} (use --delete-domain to remove)`);
}
