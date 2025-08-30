const { chromium } = require('playwright');
const path = require('path');

async function testBrightonIssue() {
    console.log('🔍 Testing Brighton Registration Issue\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 // Slow down to see what's happening
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        console.error(`❌ PAGE ERROR: ${error.message}`);
    });
    
    try {
        // Load the application
        const url = `file://${path.join(__dirname, 'index.html')}`;
        console.log(`Loading: ${url}\n`);
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Wait for Firebase
        await page.waitForTimeout(2000);
        
        // Step 1: Try to register as "Brighton"
        console.log('\n📝 STEP 1: Entering "Brighton" in name field...');
        await page.fill('#player-name', 'Brighton');
        await page.waitForTimeout(500);
        
        // Take screenshot
        await page.screenshot({ 
            path: 'test-results/1-brighton-entered.png'
        });
        
        // Step 2: Click register
        console.log('📝 STEP 2: Clicking Register button...');
        await page.click('#register-btn');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Step 3: Check what happened
        const state = await page.evaluate(() => {
            return {
                // Check if still on registration screen
                onRegistrationScreen: document.getElementById('registration-screen')?.style.display !== 'none',
                onDashboard: document.getElementById('dashboard-screen')?.style.display !== 'none',
                // Check app state
                currentUser: window.app?.currentUser,
                currentScreen: window.app?.currentScreen,
                // Check for any error messages
                alertText: document.querySelector('.alert')?.innerText,
                // Check localStorage
                storedUsername: localStorage.getItem('ironTurtle_username')
            };
        });
        
        console.log('\n📊 RESULT:');
        console.log(`- Still on registration screen: ${state.onRegistrationScreen}`);
        console.log(`- On dashboard: ${state.onDashboard}`);
        console.log(`- Current user: ${JSON.stringify(state.currentUser)}`);
        console.log(`- Current screen: ${state.currentScreen}`);
        console.log(`- Alert text: ${state.alertText || 'None'}`);
        console.log(`- Stored username: ${state.storedUsername}`);
        
        // Take final screenshot
        await page.screenshot({ 
            path: 'test-results/2-brighton-result.png',
            fullPage: true
        });
        
        if (state.onRegistrationScreen && !state.onDashboard) {
            console.log('\n❌ ISSUE CONFIRMED: Brighton registration failed!');
            console.log('User remained on registration screen.');
            
            // Try to get more details
            const errorDetails = await page.evaluate(() => {
                // Check console for errors
                const logs = [];
                const originalError = console.error;
                console.error = function(...args) {
                    logs.push(args.join(' '));
                    originalError.apply(console, args);
                };
                
                // Check network status
                return {
                    firebaseAvailable: typeof firebase !== 'undefined',
                    firebaseServiceAvailable: !!window.firebaseService,
                    navigatorOnline: navigator.onLine
                };
            });
            
            console.log('\n🔍 Additional diagnostics:');
            console.log(`- Firebase loaded: ${errorDetails.firebaseAvailable}`);
            console.log(`- Firebase service: ${errorDetails.firebaseServiceAvailable}`);
            console.log(`- Network online: ${errorDetails.navigatorOnline}`);
        } else if (state.onDashboard) {
            console.log('\n✅ Registration successful! User is on dashboard.');
        }
        
        // Step 4: Try again with lowercase
        if (state.onRegistrationScreen) {
            console.log('\n📝 STEP 4: Trying with lowercase "brighton"...');
            await page.fill('#player-name', 'brighton');
            await page.click('#register-btn');
            await page.waitForTimeout(3000);
            
            const state2 = await page.evaluate(() => {
                return {
                    onDashboard: document.getElementById('dashboard-screen')?.style.display !== 'none',
                    currentUser: window.app?.currentUser?.name
                };
            });
            
            console.log(`- Lowercase result: ${state2.onDashboard ? 'SUCCESS' : 'FAILED'}`);
            if (state2.currentUser) {
                console.log(`- Registered as: ${state2.currentUser}`);
            }
            
            await page.screenshot({ 
                path: 'test-results/3-lowercase-result.png',
                fullPage: true
            });
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error);
        await page.screenshot({ 
            path: 'test-results/error-screenshot.png',
            fullPage: true
        });
    } finally {
        console.log('\n📸 Screenshots saved in test-results/');
        await page.waitForTimeout(5000); // Keep browser open to see result
        await browser.close();
    }
}

testBrightonIssue().catch(console.error);