const { chromium } = require('playwright');
const path = require('path');

async function testBrightonRegistration() {
    console.log('🚀 Starting Brighton Registration Test...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push({ type: msg.type(), text });
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
    });
    
    // Capture page errors
    page.on('pageerror', error => {
        console.error(`❌ PAGE ERROR: ${error.message}`);
        console.error(error.stack);
    });
    
    // Capture response errors
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
        }
    });
    
    try {
        // Test 1: Load the main application
        console.log('\n📋 Test 1: Loading main application...');
        const mainUrl = `file://${path.join(__dirname, 'index.html')}`;
        await page.goto(mainUrl, { waitUntil: 'networkidle' });
        console.log('✅ Page loaded successfully');
        
        // Wait for Firebase to initialize
        console.log('\n⏳ Waiting for Firebase initialization...');
        await page.waitForTimeout(3000);
        
        // Check Firebase status
        const firebaseStatus = await page.evaluate(() => {
            return {
                firebaseLoaded: typeof firebase !== 'undefined',
                firebaseInitialized: window.FIREBASE_ENABLED || false,
                firebaseService: window.firebaseService ? 'Available' : 'Not Available'
            };
        });
        console.log('🔥 Firebase Status:', firebaseStatus);
        
        // Test 2: Try to register as "Brighton"
        console.log('\n📋 Test 2: Attempting registration as "Brighton"...');
        
        // Check if registration form is visible
        const registrationVisible = await page.isVisible('#registration-screen');
        console.log(`Registration screen visible: ${registrationVisible}`);
        
        if (!registrationVisible) {
            // Try to logout first if already logged in
            const logoutBtn = await page.$('#logout-btn');
            if (logoutBtn) {
                console.log('Found logout button, clicking...');
                await logoutBtn.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Fill in the name field
        console.log('Filling in name field with "Brighton"...');
        await page.fill('#player-name', 'Brighton');
        
        // Take screenshot before submission
        await page.screenshot({ 
            path: 'test-results/brighton-before-submit.png',
            fullPage: true 
        });
        
        // Click register button
        console.log('Clicking register button...');
        await page.click('#register-btn');
        
        // Wait for either success or error
        await page.waitForTimeout(3000);
        
        // Check current state
        const afterRegistration = await page.evaluate(() => {
            const app = window.app;
            return {
                currentUser: app?.currentUser ? {
                    name: app.currentUser.name,
                    uid: app.currentUser.uid,
                    sanitizedName: app.currentUser.sanitizedName
                } : null,
                currentScreen: app?.currentScreen || 'unknown',
                dashboardVisible: document.getElementById('dashboard-screen')?.style.display !== 'none',
                registrationVisible: document.getElementById('registration-screen')?.style.display !== 'none',
                localStorage: localStorage.getItem('ironTurtle_username')
            };
        });
        
        console.log('\n📊 After Registration State:');
        console.log(JSON.stringify(afterRegistration, null, 2));
        
        // Take screenshot after submission
        await page.screenshot({ 
            path: 'test-results/brighton-after-submit.png',
            fullPage: true 
        });
        
        // Test 3: Check Firestore directly
        console.log('\n📋 Test 3: Checking Firestore directly...');
        const firestoreCheck = await page.evaluate(async () => {
            if (!window.firebaseService) {
                return { error: 'Firebase service not available' };
            }
            
            try {
                const sanitizedName = 'brighton'; // This is what "Brighton" becomes
                const userDoc = await window.firebaseService.db
                    .collection('users')
                    .doc(sanitizedName)
                    .get();
                
                if (userDoc.exists) {
                    return {
                        exists: true,
                        data: userDoc.data()
                    };
                } else {
                    return {
                        exists: false,
                        message: 'User document does not exist'
                    };
                }
            } catch (error) {
                return {
                    error: error.message,
                    code: error.code
                };
            }
        });
        
        console.log('Firestore Check Result:');
        console.log(JSON.stringify(firestoreCheck, null, 2));
        
        // Test 4: Try the diagnostic page
        console.log('\n📋 Test 4: Testing diagnostic page...');
        const diagUrl = `file://${path.join(__dirname, 'test-brighton-registration.html')}`;
        await page.goto(diagUrl, { waitUntil: 'networkidle' });
        
        // Wait for Firebase to initialize on diagnostic page
        await page.waitForTimeout(2000);
        
        // Click the Brighton registration test button
        await page.click('button[onclick="testRegistration(\'Brighton\')"]');
        
        // Wait for test to complete
        await page.waitForTimeout(5000);
        
        // Get the log content
        const logContent = await page.evaluate(() => {
            return document.getElementById('log').innerText;
        });
        
        console.log('\n📝 Diagnostic Page Log:');
        console.log(logContent);
        
        // Take final screenshot
        await page.screenshot({ 
            path: 'test-results/brighton-diagnostic.png',
            fullPage: true 
        });
        
        // Analyze console logs for errors
        console.log('\n📊 Console Log Analysis:');
        const errors = consoleLogs.filter(log => log.type === 'error');
        const warnings = consoleLogs.filter(log => log.type === 'warning');
        
        if (errors.length > 0) {
            console.log(`\n❌ Found ${errors.length} errors:`);
            errors.forEach(err => console.log(`  - ${err.text}`));
        }
        
        if (warnings.length > 0) {
            console.log(`\n⚠️ Found ${warnings.length} warnings:`);
            warnings.forEach(warn => console.log(`  - ${warn.text}`));
        }
        
        console.log('\n✅ Test completed. Check test-results folder for screenshots.');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error(error);
        
        // Take error screenshot
        await page.screenshot({ 
            path: 'test-results/brighton-error.png',
            fullPage: true 
        });
    } finally {
        await browser.close();
    }
}

// Run the test
testBrightonRegistration().catch(console.error);