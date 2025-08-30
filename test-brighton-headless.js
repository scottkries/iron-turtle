const { chromium } = require('playwright');
const path = require('path');

async function quickBrightonTest() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    page.on('pageerror', error => {
        errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    try {
        // Load app
        await page.goto(`file://${path.join(__dirname, 'index.html')}`, { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // Wait for Firebase
        await page.waitForTimeout(2000);
        
        // Try to register as Brighton
        await page.fill('#player-name', 'Brighton');
        await page.click('#register-btn');
        await page.waitForTimeout(3000);
        
        // Check result
        const result = await page.evaluate(() => {
            return {
                registrationVisible: document.getElementById('registration-screen')?.style.display !== 'none',
                dashboardVisible: document.getElementById('dashboard-screen')?.style.display !== 'none',
                currentUser: window.app?.currentUser?.name,
                currentScreen: window.app?.currentScreen
            };
        });
        
        console.log('Test Results:');
        console.log('-------------');
        console.log(`Registration Screen Visible: ${result.registrationVisible}`);
        console.log(`Dashboard Visible: ${result.dashboardVisible}`);
        console.log(`Current User: ${result.currentUser || 'None'}`);
        console.log(`Current Screen: ${result.currentScreen}`);
        
        if (errors.length > 0) {
            console.log('\nErrors Found:');
            errors.forEach(err => console.log(`- ${err}`));
        }
        
        if (result.registrationVisible && !result.dashboardVisible) {
            console.log('\n❌ ISSUE CONFIRMED: Registration failed - user still on registration screen');
            
            // Check for specific Firebase errors
            const firebaseCheck = await page.evaluate(async () => {
                if (!window.firebaseService) return 'No Firebase service';
                
                try {
                    // Try to manually register
                    const user = await window.firebaseService.signInAnonymously('Brighton');
                    return `Manual registration succeeded: ${user.displayName}`;
                } catch (error) {
                    return `Firebase error: ${error.message} (${error.code})`;
                }
            });
            
            console.log(`Firebase check: ${firebaseCheck}`);
        } else if (result.dashboardVisible) {
            console.log('\n✅ Registration succeeded!');
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        await browser.close();
    }
}

quickBrightonTest();