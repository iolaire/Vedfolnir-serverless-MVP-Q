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
const domainConfig = JSON.parse(fs.readFileSync('./domain-config.json', 'utf8'));

const DOMAIN = domainConfig.fullDomain;

// Dynamically detect hosted zone ID
let HOSTED_ZONE_ID;
try {
    const hostedZones = JSON.parse(execSync('aws route53 list-hosted-zones --query "HostedZones" --output json', { encoding: 'utf8' }));
    const zone = hostedZones.find(z => 
        z.Name === domainConfig.domain + '.' || 
        z.Name === domainConfig.domain
    );
    if (zone) {
        HOSTED_ZONE_ID = `/hostedzone/${zone.Id.split('/').pop()}`;
        console.log(`🔍 Found Hosted Zone: ${zone.Name} (${HOSTED_ZONE_ID})`);
    } else {
        throw new Error(`No hosted zone found for domain: ${domainConfig.domain}`);
    }
} catch (error) {
    console.error(`❌ Could not find hosted zone for domain: ${domainConfig.domain}`);
    process.exit(1);
}

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
        throw new Error(`No Amplify app found for project: ${domainConfig.projectName}`);
    }
} catch (error) {
    console.error(`❌ Could not find Amplify app for project: ${domainConfig.projectName}`);
    process.exit(1);
}

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

console.log('🌐 Updating custom domain to point to Amplify app...');

// Check for existing domain associations in ANY Amplify app and update DNS instead of removing
console.log('🔍 Checking for existing domain associations...');
try {
    const allApps = JSON.parse(execSync('aws amplify list-apps --query "apps" --output json', { encoding: 'utf8' }));
    
    for (const app of allApps) {
        try {
            const domainAssociations = JSON.parse(execSync(`aws amplify list-domain-associations --app-id ${app.appId} --output json`, { encoding: 'utf8' }));
            
            for (const association of domainAssociations.domainAssociations) {
                if (association.domainName === DOMAIN) {
                    console.log(`🔗 Found existing domain association in app ${app.name} (${app.appId})`);
                    
                    // If it's the same app, just update DNS record
                    if (app.appId === APP_ID) {
                        console.log('🔄 Same app - updating DNS record only...');
                        const domainInfo = JSON.parse(execSync(`aws amplify get-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --output json`, { encoding: 'utf8' }));
                        const subDomain = domainInfo.domainAssociation.subDomains[0];
                        
                        if (subDomain && subDomain.dnsRecord) {
                            const cloudfrontDomain = subDomain.dnsRecord.trim().replace('CNAME ', '');
                            updateDNSRecord(cloudfrontDomain);
                        }
                        return; // Exit early - no need to recreate
                    } else {
                        // Different app - remove and recreate
                        console.log('🗑️ Removing existing domain association...');
                        execSync(`aws amplify delete-domain-association --app-id ${app.appId} --domain-name ${DOMAIN}`, { encoding: 'utf8' });
                        console.log('✅ Existing domain association removed');
                        
                        // Wait for cleanup
                        console.log('⏳ Waiting for DNS cleanup...');
                        execSync('sleep 10');
                    }
                }
            }
        } catch (error) {
            // App might not have domain associations, continue
        }
    }
} catch (error) {
    console.log('ℹ️ No existing domain associations found');
}

function updateDNSRecord(cloudfrontDomain) {
    console.log(`🔍 CloudFront domain: ${cloudfrontDomain}`);
    console.log('🔄 Updating DNS record...');
    
    const changeSet = {
        Changes: [{
            Action: 'UPSERT',
            ResourceRecordSet: {
                Name: DOMAIN,
                Type: 'CNAME',
                TTL: 300,
                ResourceRecords: [{ Value: cloudfrontDomain }]
            }
        }]
    };
    
    fs.writeFileSync('/tmp/route53-update.json', JSON.stringify(changeSet));
    const changeResult = run(`aws route53 change-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID.replace('/hostedzone/', '')} --change-batch file:///tmp/route53-update.json`);
    
    if (changeResult) {
        console.log('✅ DNS record updated successfully');
        console.log(`🌐 Domain ${DOMAIN} now points to ${cloudfrontDomain}`);
    } else {
        console.log('❌ Failed to update DNS record');
    }
}

// Check for existing ACM certificate in us-east-1 (required for Amplify)
console.log('🔍 Checking for existing SSL certificate...');
let customCertificateArn = null;
try {
    const certificates = JSON.parse(execSync('aws acm list-certificates --certificate-statuses ISSUED --region us-east-1 --output json', { encoding: 'utf8' }));
    const existingCert = certificates.CertificateSummaryList.find(cert => 
        cert.DomainName === DOMAIN || 
        cert.SubjectAlternativeNameSummary?.includes(DOMAIN)
    );
    if (existingCert) {
        customCertificateArn = existingCert.CertificateArn;
        console.log(`🔍 Found existing SSL certificate: ${customCertificateArn}`);
    }
} catch (error) {
    console.log('ℹ️ No existing SSL certificate found');
}

// Get or create the domain association
console.log('📋 Getting Amplify domain details...');
let domainInfo = run(`aws amplify get-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --output json`);

if (!domainInfo) {
  console.log('🔗 Domain association not found, creating one...');
  
  // Create domain association with existing certificate if available
  let createCommand = `aws amplify create-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --sub-domain-settings prefix=,branchName=main`;
  
  if (customCertificateArn) {
    createCommand += ` --certificate-settings type=CUSTOM,customCertificateArn=${customCertificateArn}`;
    console.log('🔄 Reusing existing SSL certificate...');
  } else {
    createCommand += ` --certificate-settings type=AMPLIFY_MANAGED`;
    console.log('🆕 Creating new Amplify-managed SSL certificate...');
  }
  
  createCommand += ' --output json';
  
  const createResult = run(createCommand);
  if (!createResult) {
    console.log('❌ Could not create domain association');
    process.exit(1);
  }
  console.log('✅ Domain association created successfully');
  console.log('ℹ️ Domain association is being set up. This may take several minutes.');
  console.log('ℹ️ You can check the status in the AWS Amplify console.');
  
  // Wait a moment for the association to initialize and get CloudFront domain
  console.log('⏳ Waiting for domain association to initialize...');
  setTimeout(() => {
    const newDomainInfo = run(`aws amplify get-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --output json`);
    if (newDomainInfo) {
      const domainData = JSON.parse(newDomainInfo);
      const subDomain = domainData.domainAssociation.subDomains[0];
      
      if (subDomain && subDomain.dnsRecord) {
        const cloudfrontDomain = subDomain.dnsRecord.trim().replace('CNAME ', '');
        console.log(`🔍 New CloudFront domain: ${cloudfrontDomain}`);
        
        // Update DNS record to point to new CloudFront distribution
        console.log('🔄 Updating DNS record...');
        const changeSet = {
          Changes: [{
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: DOMAIN,
              Type: 'CNAME',
              TTL: 300,
              ResourceRecords: [{ Value: cloudfrontDomain }]
            }
          }]
        };
        
        fs.writeFileSync('/tmp/route53-update.json', JSON.stringify(changeSet));
        const changeResult = run(`aws route53 change-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID.replace('/hostedzone/', '')} --change-batch file:///tmp/route53-update.json`);
        
        if (changeResult) {
          console.log('✅ DNS record updated successfully');
          console.log(`🌐 Domain ${DOMAIN} now points to ${cloudfrontDomain}`);
        } else {
          console.log('❌ Failed to update DNS record');
        }
      }
    }
    
    processDomainAssociation(newDomainInfo || domainInfo);
  }, 10000); // Increased wait time for CloudFront domain to be available
  return;
}

processDomainAssociation(domainInfo);

function processDomainAssociation(domainInfo) {
  const domainData = JSON.parse(domainInfo);
  
  // Check if domain association failed due to DNS conflict
  if (domainData.domainAssociation.domainStatus === 'FAILED') {
    console.log('⚠️ Domain association failed, checking for DNS conflicts...');
    console.log(`📋 Failure reason: ${domainData.domainAssociation.statusReason}`);
    
    if (domainData.domainAssociation.statusReason.includes('incorrectly configured DNS record')) {
      console.log('🔧 Detected DNS conflict, fixing automatically...');
      
      const expectedCloudFront = domainData.domainAssociation.subDomains[0].dnsRecord.trim().replace('CNAME ', '');
      console.log(`📋 Expected CloudFront domain: ${expectedCloudFront}`);
      
      // First delete the failed domain association
      console.log('🗑️ Removing failed domain association...');
      run(`aws amplify delete-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN}`);
      
      // Update DNS record to correct CloudFront distribution
      console.log('🔄 Updating DNS record to point to correct CloudFront distribution...');
      const changeSet = {
        "Changes": [{
          "Action": "UPSERT",
          "ResourceRecordSet": {
            "Name": DOMAIN,
            "Type": "CNAME",
            "TTL": 300,
            "ResourceRecords": [{"Value": expectedCloudFront}]
          }
        }]
      };
      
      const changeSetJson = JSON.stringify(changeSet);
      fs.writeFileSync('/tmp/route53-update.json', changeSetJson);
      
      const changeResult = run(`aws route53 change-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID.replace('/hostedzone/', '')} --change-batch file:///tmp/route53-update.json`);
      
      if (changeResult) {
        console.log('✅ DNS record updated successfully');
        console.log(`🌐 Domain ${DOMAIN} now points to ${expectedCloudFront}`);
        
        // Wait for DNS propagation then recreate domain association
        console.log('⏳ Waiting for DNS propagation...');
        execSync('sleep 30');
        
        // Recreate domain association
        console.log('🔄 Recreating domain association...');
        let createCommand = `aws amplify create-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --sub-domain-settings prefix=,branchName=main`;
        
        if (customCertificateArn) {
          createCommand += ` --certificate-settings type=CUSTOM,customCertificateArn=${customCertificateArn}`;
        } else {
          createCommand += ` --certificate-settings type=AMPLIFY_MANAGED`;
        }
        
        const recreateResult = run(createCommand);
        if (recreateResult) {
          console.log('✅ Domain association recreated successfully');
        } else {
          console.log('❌ Failed to recreate domain association');
        }
      } else {
        console.log('❌ Failed to update DNS record');
      }
      const changeId = run(`aws route53 change-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID} --change-batch '${changeSetJson}' --query 'ChangeInfo.Id' --output text`);
      
      if (changeId) {
        console.log(`✅ DNS record updated to fix conflict. Change ID: ${changeId}`);
        console.log('⏳ Waiting for DNS propagation (30 seconds)...');
        
        // Wait for DNS propagation
        setTimeout(() => {
          console.log('🔄 Creating new domain association...');
          const retryResult = run(`aws amplify create-domain-association --app-id ${APP_ID} --domain-name ${DOMAIN} --sub-domain-settings prefix=,branchName=main --output json`);
          if (retryResult) {
            console.log('✅ Domain association created successfully');
            console.log('ℹ️ Domain setup is now in progress. This may take 10-15 minutes.');
            console.log('ℹ️ Check AWS Amplify console for status updates.');
            console.log(`🌐 Your app will be available at: https://${DOMAIN}`);
          } else {
            console.log('❌ Failed to recreate domain association');
            console.log('💡 Try running this script again in a few minutes');
          }
        }, 30000);
        
        return;
      } else {
        console.log('❌ Failed to update DNS record');
        process.exit(1);
      }
    } else {
      console.log('❌ Domain association failed for unknown reason');
      console.log('💡 Check AWS Amplify console for more details');
      process.exit(1);
    }
  }
  
  if (domainData.domainAssociation.domainStatus === 'PENDING_VERIFICATION' || 
      domainData.domainAssociation.domainStatus === 'PENDING_DEPLOYMENT') {
    console.log('⏳ Domain association is in progress...');
    console.log(`📊 Status: ${domainData.domainAssociation.domainStatus}`);
    console.log('ℹ️ This may take several minutes. Check AWS Amplify console for updates.');
    process.exit(0);
  }
  
  if (domainData.domainAssociation.domainStatus !== 'AVAILABLE') {
    console.log(`⚠️ Domain status: ${domainData.domainAssociation.domainStatus}`);
    console.log('ℹ️ Check AWS Amplify console for more details.');
    process.exit(0);
  }

  const cloudFrontDomain = domainData.domainAssociation.subDomains[0].dnsRecord.trim().replace('CNAME ', '');
  console.log(`✅ Found CloudFront domain: ${cloudFrontDomain}`);

  // Check current DNS record and prepare change set
  console.log('🔍 Checking current DNS record...');
  const currentRecord = run(`aws route53 list-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID} --query "ResourceRecordSets[?Name=='${DOMAIN}.']" --output json`);

  let changeSet = { "Changes": [] };

  if (currentRecord) {
    const records = JSON.parse(currentRecord);
    if (records.length > 0) {
      const existingRecord = records[0];
      console.log(`📝 Current record: ${existingRecord.Type} -> ${existingRecord.ResourceRecords?.[0]?.Value || existingRecord.AliasTarget?.DNSName || 'N/A'}`);
      
      // Delete existing record first if it's not already a CNAME to our target
      if (existingRecord.Type !== 'CNAME' || existingRecord.ResourceRecords?.[0]?.Value !== cloudFrontDomain) {
        console.log('🗑️ Removing existing record...');
        changeSet.Changes.push({
          "Action": "DELETE",
          "ResourceRecordSet": existingRecord
        });
        
        // Add the new CNAME record
        changeSet.Changes.push({
          "Action": "CREATE",
          "ResourceRecordSet": {
            "Name": DOMAIN,
            "Type": "CNAME", 
            "TTL": 300,
            "ResourceRecords": [{"Value": cloudFrontDomain}]
          }
        });
      } else {
        console.log('✅ DNS record is already correctly configured!');
        console.log(`🌐 Your app is available at: https://${DOMAIN}`);
        process.exit(0);
      }
    }
  } else {
    // No existing record, create new one
    changeSet.Changes.push({
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": DOMAIN,
        "Type": "CNAME", 
        "TTL": 300,
        "ResourceRecords": [{"Value": cloudFrontDomain}]
      }
    });
  }

  const changeSetJson = JSON.stringify(changeSet);
  const changeId = run(`aws route53 change-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID} --change-batch '${changeSetJson}' --query 'ChangeInfo.Id' --output text`);

  if (changeId) {
    console.log(`✅ DNS record updated. Change ID: ${changeId}`);
    console.log('⏳ DNS propagation may take a few minutes...');
    
    // Check change status
    const status = run(`aws route53 get-change --id ${changeId} --query 'ChangeInfo.Status' --output text`);
    console.log(`📊 Change Status: ${status}`);
    
    console.log(`\n🎉 Domain setup complete!`);
    console.log(`🌐 Your app should be available at: https://${DOMAIN}`);
    console.log(`📋 You can test it with: curl -I https://${DOMAIN}`);
  } else {
    console.log('❌ Failed to update DNS record');
    process.exit(1);
  }
}
