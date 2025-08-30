#!/bin/bash

# Firebase REST API Test Script
# This script tests Firebase Firestore operations using the REST API

# Configuration
PROJECT_ID="iron-turtle-tracker"
API_KEY="AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8"
BASE_URL="https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to create a timestamp
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Function to generate a random ID
generate_id() {
    echo "test_$(date +%s)_$(( RANDOM % 1000 ))"
}

echo "🚀 Firebase REST API Test Suite"
echo "================================"
echo ""

# Test 1: Create a test user
test_create_user() {
    echo "📝 Test 1: Creating a test user..."
    
    USER_ID=$(generate_id)
    USER_NAME="TestUser_$(date +%s)"
    
    PAYLOAD=$(cat <<EOF
{
    "fields": {
        "name": {"stringValue": "$USER_NAME"},
        "totalScore": {"integerValue": 100},
        "createdAt": {"timestampValue": "$(get_timestamp)"},
        "testUser": {"booleanValue": true}
    }
}
EOF
)
    
    RESPONSE=$(curl -s -X POST \
        "$BASE_URL/users?documentId=$USER_ID&key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    if echo "$RESPONSE" | grep -q "name"; then
        print_status "User created successfully"
        print_info "User ID: $USER_ID"
        print_info "User Name: $USER_NAME"
        echo "$USER_ID" > /tmp/test_user_id.txt
        echo ""
        return 0
    else
        print_error "Failed to create user"
        echo "Response: $RESPONSE"
        echo ""
        return 1
    fi
}

# Test 2: Read all users
test_read_users() {
    echo "👥 Test 2: Reading all users..."
    
    RESPONSE=$(curl -s -X GET \
        "$BASE_URL/users?key=$API_KEY")
    
    if echo "$RESPONSE" | grep -q "documents"; then
        USER_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l)
        print_status "Successfully retrieved users"
        print_info "Found $USER_COUNT users in the database"
        
        # Parse and display first few users
        echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'documents' in data:
    for i, doc in enumerate(data['documents'][:3]):
        if 'fields' in doc:
            name = doc['fields'].get('name', {}).get('stringValue', 'Unknown')
            score = doc['fields'].get('totalScore', {}).get('integerValue', 0)
            print(f'   - {name}: {score} points')
    if len(data['documents']) > 3:
        print(f'   ... and {len(data[\"documents\"]) - 3} more')
" 2>/dev/null || echo "   (Could not parse user details)"
        
        echo ""
        return 0
    else
        print_error "Failed to read users"
        echo "Response: $RESPONSE"
        echo ""
        return 1
    fi
}

# Test 3: Update user score
test_update_user() {
    echo "🔄 Test 3: Updating user score..."
    
    if [ -f /tmp/test_user_id.txt ]; then
        USER_ID=$(cat /tmp/test_user_id.txt)
        NEW_SCORE=250
        
        PAYLOAD=$(cat <<EOF
{
    "fields": {
        "totalScore": {"integerValue": $NEW_SCORE},
        "lastUpdated": {"timestampValue": "$(get_timestamp)"}
    }
}
EOF
)
        
        RESPONSE=$(curl -s -X PATCH \
            "$BASE_URL/users/$USER_ID?updateMask.fieldPaths=totalScore&updateMask.fieldPaths=lastUpdated&key=$API_KEY" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")
        
        if echo "$RESPONSE" | grep -q "name"; then
            print_status "User score updated successfully"
            print_info "New score: $NEW_SCORE"
            echo ""
            return 0
        else
            print_error "Failed to update user"
            echo "Response: $RESPONSE"
            echo ""
            return 1
        fi
    else
        print_warning "No test user found, skipping update test"
        echo ""
        return 1
    fi
}

# Test 4: Add activity
test_add_activity() {
    echo "🏃 Test 4: Adding an activity..."
    
    if [ -f /tmp/test_user_id.txt ]; then
        USER_ID=$(cat /tmp/test_user_id.txt)
        ACTIVITY_ID=$(generate_id)
        
        PAYLOAD=$(cat <<EOF
{
    "fields": {
        "userId": {"stringValue": "$USER_ID"},
        "type": {"stringValue": "Stretching"},
        "duration": {"integerValue": 30},
        "points": {"integerValue": 15},
        "date": {"stringValue": "$(get_timestamp)"},
        "timestamp": {"timestampValue": "$(get_timestamp)"}
    }
}
EOF
)
        
        RESPONSE=$(curl -s -X POST \
            "$BASE_URL/activities?documentId=$ACTIVITY_ID&key=$API_KEY" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")
        
        if echo "$RESPONSE" | grep -q "name"; then
            print_status "Activity added successfully"
            print_info "Activity: Stretching for 30 minutes (15 points)"
            echo "$ACTIVITY_ID" > /tmp/test_activity_id.txt
            echo ""
            return 0
        else
            print_error "Failed to add activity"
            echo "Response: $RESPONSE"
            echo ""
            return 1
        fi
    else
        print_warning "No test user found, skipping activity test"
        echo ""
        return 1
    fi
}

# Test 5: Query user activities
test_query_activities() {
    echo "📊 Test 5: Querying user activities..."
    
    if [ -f /tmp/test_user_id.txt ]; then
        USER_ID=$(cat /tmp/test_user_id.txt)
        
        # Firestore structured query
        QUERY=$(cat <<EOF
{
    "structuredQuery": {
        "from": [{"collectionId": "activities"}],
        "where": {
            "fieldFilter": {
                "field": {"fieldPath": "userId"},
                "op": "EQUAL",
                "value": {"stringValue": "$USER_ID"}
            }
        }
    }
}
EOF
)
        
        RESPONSE=$(curl -s -X POST \
            "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents:runQuery?key=$API_KEY" \
            -H "Content-Type: application/json" \
            -d "$QUERY")
        
        if echo "$RESPONSE" | grep -q "document"; then
            print_status "Activities retrieved successfully"
            
            # Count activities
            ACTIVITY_COUNT=$(echo "$RESPONSE" | grep -o '"document"' | wc -l)
            print_info "Found $ACTIVITY_COUNT activities for user"
            echo ""
            return 0
        else
            print_warning "No activities found or query failed"
            echo ""
            return 1
        fi
    else
        print_warning "No test user found, skipping query test"
        echo ""
        return 1
    fi
}

# Test 6: Get leaderboard (top users by score)
test_leaderboard() {
    echo "🏆 Test 6: Getting leaderboard..."
    
    # Query top 5 users by score
    QUERY=$(cat <<EOF
{
    "structuredQuery": {
        "from": [{"collectionId": "users"}],
        "orderBy": [{
            "field": {"fieldPath": "totalScore"},
            "direction": "DESCENDING"
        }],
        "limit": 5
    }
}
EOF
)
    
    RESPONSE=$(curl -s -X POST \
        "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents:runQuery?key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d "$QUERY")
    
    if echo "$RESPONSE" | grep -q "document"; then
        print_status "Leaderboard retrieved successfully"
        
        echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('   Top 5 Users:')
for i, item in enumerate(data[:5]):
    if 'document' in item and 'fields' in item['document']:
        name = item['document']['fields'].get('name', {}).get('stringValue', 'Unknown')
        score = item['document']['fields'].get('totalScore', {}).get('integerValue', 0)
        print(f'   {i+1}. {name}: {score} points')
" 2>/dev/null || print_info "   (Could not parse leaderboard)"
        
        echo ""
        return 0
    else
        print_error "Failed to get leaderboard"
        echo ""
        return 1
    fi
}

# Test 7: Delete test data
test_cleanup() {
    echo "🧹 Test 7: Cleaning up test data..."
    
    CLEANUP_SUCCESS=true
    
    # Delete test activity
    if [ -f /tmp/test_activity_id.txt ]; then
        ACTIVITY_ID=$(cat /tmp/test_activity_id.txt)
        RESPONSE=$(curl -s -X DELETE \
            "$BASE_URL/activities/$ACTIVITY_ID?key=$API_KEY")
        
        if [ -z "$RESPONSE" ] || echo "$RESPONSE" | grep -q "{}"; then
            print_info "Test activity deleted"
        else
            print_warning "Could not delete test activity"
            CLEANUP_SUCCESS=false
        fi
        rm -f /tmp/test_activity_id.txt
    fi
    
    # Delete test user
    if [ -f /tmp/test_user_id.txt ]; then
        USER_ID=$(cat /tmp/test_user_id.txt)
        RESPONSE=$(curl -s -X DELETE \
            "$BASE_URL/users/$USER_ID?key=$API_KEY")
        
        if [ -z "$RESPONSE" ] || echo "$RESPONSE" | grep -q "{}"; then
            print_info "Test user deleted"
        else
            print_warning "Could not delete test user"
            CLEANUP_SUCCESS=false
        fi
        rm -f /tmp/test_user_id.txt
    fi
    
    if [ "$CLEANUP_SUCCESS" = true ]; then
        print_status "Cleanup completed"
    else
        print_warning "Cleanup partially completed"
    fi
    echo ""
}

# Main execution
echo "Starting tests..."
echo ""

# Run all tests
TESTS_PASSED=0
TESTS_FAILED=0

if test_create_user; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if test_read_users; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if test_update_user; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if test_add_activity; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if test_query_activities; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
if test_leaderboard; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi

# Cleanup option
if [ "$1" = "--cleanup" ] || [ "$1" = "-c" ]; then
    test_cleanup
fi

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
print_status "Tests Passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Tests Failed: $TESTS_FAILED"
else
    print_info "Tests Failed: 0"
fi
echo ""

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --cleanup, -c    Delete test data after running tests"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "This script tests Firebase Firestore operations using the REST API."
    echo "It creates test users and activities, reads data, and optionally cleans up."
fi