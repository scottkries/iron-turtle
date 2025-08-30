#!/bin/bash

# Firebase Storage Configuration
PROJECT_ID="turtle-v2"
STORAGE_BUCKET="turtle-v2.firebasestorage.app"
API_KEY="AIzaSyBDSZ8kMF-CBslIt3YqdkigvEvjB1q7HRA"

echo "🔥 Firebase Storage Configuration Test"
echo "======================================"
echo "Project ID: $PROJECT_ID"
echo "Storage Bucket: $STORAGE_BUCKET"
echo ""

# Test 1: Check if storage bucket is accessible
echo "📋 Test 1: Storage Bucket Accessibility"
echo "---------------------------------------"
echo "Testing bucket URL: https://$STORAGE_BUCKET"

response=$(curl -s -o /dev/null -w "%{http_code}" "https://$STORAGE_BUCKET/")
if [ "$response" -eq 404 ] || [ "$response" -eq 400 ]; then
    echo "✅ Storage bucket endpoint is reachable (HTTP $response - expected for direct access)"
else
    echo "⚠️  Unexpected response: HTTP $response"
fi

# Test 2: Check Firebase project configuration
echo ""
echo "📋 Test 2: Firebase Project Configuration"
echo "-----------------------------------------"
echo "Checking project configuration via Firebase API..."

config_response=$(curl -s "https://firebase.googleapis.com/v1/projects/$PROJECT_ID/webApps/-/config" 2>/dev/null)

if echo "$config_response" | grep -q "storageBucket"; then
    echo "✅ Firebase configuration is accessible"
    echo ""
    echo "Configuration details:"
    echo "$config_response" | grep -E '(projectId|storageBucket|messagingSenderId|appId|authDomain)' | sed 's/^/  /'
else
    echo "⚠️  Could not retrieve Firebase configuration"
fi

# Test 3: Verify Storage Rules (informational)
echo ""
echo "📋 Test 3: Storage Rules Check"
echo "------------------------------"
echo "⚠️  Note: Storage rules can only be checked via Firebase Console"
echo ""
echo "To verify storage rules:"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/storage/rules"
echo "2. Ensure rules allow read/write for testing:"
echo ""
echo "   rules_version = '2';"
echo "   service firebase.storage {"
echo "     match /b/{bucket}/o {"
echo "       match /{allPaths=**} {"
echo "         allow read, write: if true;  // For testing only!"
echo "       }"
echo "     }"
echo "   }"
echo ""

# Test 4: Check if Storage is enabled
echo "📋 Test 4: Storage Service Status"
echo "---------------------------------"
echo "Checking if Storage service is enabled..."

# Try to access storage metadata endpoint
metadata_response=$(curl -s -o /dev/null -w "%{http_code}" "https://firebasestorage.googleapis.com/v0/b/$STORAGE_BUCKET/o?maxResults=1")

if [ "$metadata_response" -eq 401 ] || [ "$metadata_response" -eq 403 ]; then
    echo "✅ Storage service is enabled (authentication required - expected)"
elif [ "$metadata_response" -eq 200 ]; then
    echo "✅ Storage service is enabled and publicly accessible"
elif [ "$metadata_response" -eq 404 ]; then
    echo "❌ Storage service might not be enabled or bucket doesn't exist"
    echo "   Please enable Storage in Firebase Console"
else
    echo "⚠️  Unexpected response: HTTP $metadata_response"
fi

# Summary
echo ""
echo "📊 Configuration Summary"
echo "========================"
echo "✅ Project ID:      $PROJECT_ID"
echo "✅ Storage Bucket:  $STORAGE_BUCKET"
echo "✅ API Key:         ${API_KEY:0:10}..."
echo ""
echo "💡 Next Steps:"
echo "-------------"
echo "1. If tests failed, enable Storage in Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/storage"
echo ""
echo "2. Configure Storage rules for testing (temporary):"
echo "   - Go to Storage > Rules"
echo "   - Set rules to allow read/write: if true;"
echo ""
echo "3. For production, update rules to be more restrictive:"
echo "   - Require authentication"
echo "   - Limit file sizes"
echo "   - Restrict file types"
echo ""
echo "📝 To test file operations, you'll need:"
echo "   - Firebase SDK installed (npm install firebase)"
echo "   - Authentication configured (for production)"
echo "   - Proper storage rules set up"