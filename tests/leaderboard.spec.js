const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Iron Turtle Leaderboard Click Functionality', () => {
    let browser;
    let context;
    let page;

    test.beforeAll(async () => {
        // Launch browser with debugging options
        browser = await chromium.launch({
            headless: false, // Set to false for debugging
            slowMo: 1000, // Slow down actions for easier debugging
            devtools: false
        });
        
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            // Enable console logging
            recordVideo: {
                dir: 'test-results/',
                size: { width: 1280, height: 720 }
            }
        });
        
        page = await context.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
        });
        
        // Listen for errors
        page.on('pageerror', error => {
            console.error(`PAGE ERROR: ${error.message}`);
        });
        
        // Listen for dialog events
        page.on('dialog', dialog => {
            console.log(`DIALOG: ${dialog.type()} - ${dialog.message()}`);
            dialog.accept();
        });
    });

    test.afterAll(async () => {
        await browser.close();
    });

    test('Setup and test leaderboard click functionality', async () => {
        console.log('🟦 Starting Iron Turtle leaderboard test...');
        
        // Navigate to the application
        const appPath = `file://${path.join(__dirname, '..', 'index.html')}`;
        console.log(`🟦 Navigating to: ${appPath}`);
        await page.goto(appPath);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Take initial screenshot
        await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });
        
        console.log('🟦 Page loaded, checking for registration form...');
        
        // Check if we're on registration screen
        const registrationScreen = page.locator('#registration-screen');
        await expect(registrationScreen).toBeVisible();
        
        // Register multiple test users to populate leaderboard
        const testUsers = [
            { name: 'TestUser1', activities: 3 },
            { name: 'TestUser2', activities: 2 },
            { name: 'TestUser3', activities: 1 }
        ];
        
        for (let i = 0; i < testUsers.length; i++) {
            const user = testUsers[i];
            console.log(`🟦 Registering user: ${user.name}`);
            
            // Clear and fill name input
            await page.fill('#player-name', '');
            await page.fill('#player-name', user.name);
            
            // Submit registration
            await page.click('button[type="submit"]');
            
            // Wait for dashboard to appear
            await page.waitForSelector('#dashboard-screen:not(.d-none)', { timeout: 5000 });
            await expect(page.locator('#dashboard-screen')).toBeVisible();
            
            console.log(`🟦 ${user.name} registered successfully, logging activities...`);
            
            // Log some activities for this user
            for (let j = 0; j < user.activities; j++) {
                await page.click('#log-activity-btn');
                
                // Wait for modal to open
                await page.waitForSelector('#activityModal .modal-body', { timeout: 5000 });
                
                // Search for "beer" activity
                await page.fill('#activity-search', 'beer');
                await page.waitForTimeout(500);
                
                // Click first search result
                const searchResults = page.locator('#search-results .list-group-item-action').first();
                await expect(searchResults).toBeVisible();
                await searchResults.click();
                
                // Wait for activity selection
                await page.waitForSelector('#selected-activity:not(.d-none)', { timeout: 3000 });
                
                // Submit the activity
                await page.click('#log-activity-submit');
                
                // Wait for modal to close
                await page.waitForSelector('#activityModal', { state: 'hidden', timeout: 5000 });
                
                console.log(`🟦 Logged activity ${j + 1} for ${user.name}`);
                
                // Small delay between activities
                await page.waitForTimeout(1000);
            }
            
            // Take screenshot after logging activities
            await page.screenshot({ 
                path: `test-results/02-${user.name}-activities-logged.png`, 
                fullPage: true 
            });
            
            // Logout if not the last user
            if (i < testUsers.length - 1) {
                await page.click('#logout-btn');
                
                // Confirm logout
                await page.waitForTimeout(500);
                
                // Wait for registration screen
                await page.waitForSelector('#registration-screen:not(.d-none)', { timeout: 5000 });
                console.log(`🟦 ${user.name} logged out successfully`);
            }
        }
        
        console.log('🟦 All users registered and activities logged. Testing leaderboard...');
        
        // Take screenshot of leaderboard
        await page.screenshot({ path: 'test-results/03-leaderboard-populated.png', fullPage: true });
        
        // Verify leaderboard is visible and populated
        const leaderboard = page.locator('#leaderboard');
        await expect(leaderboard).toBeVisible();
        
        // Check if leaderboard has entries
        const leaderboardItems = page.locator('.leaderboard-item');
        const itemCount = await leaderboardItems.count();
        console.log(`🟦 Found ${itemCount} leaderboard items`);
        
        if (itemCount === 0) {
            console.error('🟥 ERROR: No leaderboard items found!');
            await page.screenshot({ path: 'test-results/04-ERROR-no-leaderboard-items.png', fullPage: true });
            
            // Check console for errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            console.log('🟥 Console errors:', consoleErrors);
            return;
        }
        
        // Test clicking on each leaderboard item
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
            const item = leaderboardItems.nth(i);
            
            // Get item details before clicking
            const userIdentifier = await item.getAttribute('data-user-identifier');
            const userName = await item.getAttribute('data-user-name');
            const itemText = await item.textContent();
            
            console.log(`🟦 Testing click on leaderboard item ${i + 1}:`);
            console.log(`   - Text: ${itemText}`);
            console.log(`   - User Identifier: ${userIdentifier}`);
            console.log(`   - User Name: ${userName}`);
            
            // Check if item has cursor pointer style
            const itemStyle = await item.evaluate(el => window.getComputedStyle(el).cursor);
            console.log(`   - Cursor style: ${itemStyle}`);
            
            // Check if click event listeners are attached
            const hasClickListener = await item.evaluate(el => {
                const listeners = getEventListeners ? getEventListeners(el) : null;
                return listeners && listeners.click ? listeners.click.length > 0 : 'unknown';
            });
            console.log(`   - Has click listeners: ${hasClickListener}`);
            
            // Take screenshot before clicking
            await page.screenshot({ 
                path: `test-results/05-before-click-item-${i + 1}.png`, 
                fullPage: true 
            });
            
            // Attempt to click the leaderboard item
            console.log(`🟦 Attempting to click leaderboard item ${i + 1}...`);
            
            try {
                // Try different click approaches
                
                // Method 1: Direct click
                console.log('   - Trying direct click...');
                await item.click({ timeout: 3000 });
                await page.waitForTimeout(2000);
                
                // Check if stats modal opened
                const statsModal = page.locator('#playerStatsModal');
                const isModalVisible = await statsModal.isVisible();
                
                console.log(`   - Stats modal visible after click: ${isModalVisible}`);
                
                if (isModalVisible) {
                    console.log('🟢 SUCCESS: Stats modal opened!');
                    await page.screenshot({ 
                        path: `test-results/06-SUCCESS-modal-opened-${i + 1}.png`, 
                        fullPage: true 
                    });
                    
                    // Close the modal
                    await page.click('#playerStatsModal .btn-close');
                    await page.waitForSelector('#playerStatsModal', { state: 'hidden', timeout: 5000 });
                    
                } else {
                    console.log('🟡 ISSUE: Stats modal did not open with direct click');
                    
                    // Method 2: Force click
                    console.log('   - Trying force click...');
                    await item.click({ force: true });
                    await page.waitForTimeout(2000);
                    
                    const isModalVisibleForce = await statsModal.isVisible();
                    console.log(`   - Stats modal visible after force click: ${isModalVisibleForce}`);
                    
                    if (!isModalVisibleForce) {
                        console.log('🟡 ISSUE: Force click also failed');
                        
                        // Method 3: JavaScript click
                        console.log('   - Trying JavaScript click...');
                        await item.evaluate(el => el.click());
                        await page.waitForTimeout(2000);
                        
                        const isModalVisibleJS = await statsModal.isVisible();
                        console.log(`   - Stats modal visible after JS click: ${isModalVisibleJS}`);
                        
                        if (!isModalVisibleJS) {
                            console.log('🟥 FAILURE: All click methods failed for this item');
                            await page.screenshot({ 
                                path: `test-results/07-FAILED-click-item-${i + 1}.png`, 
                                fullPage: true 
                            });
                        } else {
                            console.log('🟢 SUCCESS: JavaScript click worked!');
                            await page.screenshot({ 
                                path: `test-results/06-SUCCESS-js-click-${i + 1}.png`, 
                                fullPage: true 
                            });
                            // Close modal
                            await page.click('#playerStatsModal .btn-close');
                            await page.waitForSelector('#playerStatsModal', { state: 'hidden', timeout: 5000 });
                        }
                    } else {
                        console.log('🟢 SUCCESS: Force click worked!');
                        await page.screenshot({ 
                            path: `test-results/06-SUCCESS-force-click-${i + 1}.png`, 
                            fullPage: true 
                        });
                        // Close modal
                        await page.click('#playerStatsModal .btn-close');
                        await page.waitForSelector('#playerStatsModal', { state: 'hidden', timeout: 5000 });
                    }
                }
            } catch (error) {
                console.error(`🟥 ERROR clicking item ${i + 1}:`, error.message);
                await page.screenshot({ 
                    path: `test-results/08-ERROR-click-item-${i + 1}.png`, 
                    fullPage: true 
                });
            }
            
            // Wait between items
            await page.waitForTimeout(1000);
        }
        
        // Final diagnostic information
        console.log('🟦 Running final diagnostics...');
        
        // Check DOM structure
        const leaderboardHTML = await page.locator('#leaderboard').innerHTML();
        console.log('🟦 Leaderboard HTML structure:');
        console.log(leaderboardHTML);
        
        // Check for JavaScript errors in console
        const jsErrors = await page.evaluate(() => {
            return window.console.errors || [];
        });
        console.log('🟦 JavaScript errors:', jsErrors);
        
        // Check if showPlayerStats function exists
        const showPlayerStatsExists = await page.evaluate(() => {
            return typeof window.ironTurtleApp !== 'undefined' && 
                   typeof window.ironTurtleApp.showPlayerStats === 'function';
        });
        console.log('🟦 showPlayerStats function exists:', showPlayerStatsExists);
        
        // Check if modal element exists
        const modalExists = await page.locator('#playerStatsModal').count();
        console.log('🟦 Player stats modal element count:', modalExists);
        
        // Take final screenshot
        await page.screenshot({ path: 'test-results/09-final-state.png', fullPage: true });
        
        console.log('🟦 Test completed! Check test-results folder for screenshots and details.');
    });
});