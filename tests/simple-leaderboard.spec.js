const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Iron Turtle Leaderboard Click Test', () => {
    test('Debug leaderboard click functionality', async ({ page }) => {
        console.log('🟦 Starting simple leaderboard click test...');
        
        // Enable console and error logging
        page.on('console', msg => {
            console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.error(`PAGE ERROR: ${error.message}`);
        });
        
        // Navigate to the application
        const appPath = `file://${path.join(__dirname, '..', 'index.html')}`;
        console.log(`🟦 Loading application from: ${appPath}`);
        
        await page.goto(appPath);
        await page.waitForTimeout(3000); // Give time for JS to load
        
        // Take initial screenshot
        await page.screenshot({ path: 'test-results/simple-01-loaded.png', fullPage: true });
        
        // Check if we need to register (skip Firebase issues)
        const registrationVisible = await page.locator('#registration-screen:not(.d-none)').isVisible();
        
        if (registrationVisible) {
            console.log('🟦 Registration screen visible, registering test user...');
            
            await page.fill('#player-name', 'TestUser');
            await page.click('button[type="submit"]');
            
            // Wait for dashboard
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-results/simple-02-registered.png', fullPage: true });
        }
        
        // Check if dashboard is visible
        const dashboardVisible = await page.locator('#dashboard-screen:not(.d-none)').isVisible();
        console.log(`🟦 Dashboard visible: ${dashboardVisible}`);
        
        if (!dashboardVisible) {
            console.log('🟥 Dashboard not visible, cannot proceed with test');
            return;
        }
        
        // Create some mock leaderboard data directly in the browser
        console.log('🟦 Creating mock leaderboard data...');
        await page.evaluate(() => {
            // Create mock leaderboard data
            const mockLeaderboard = [
                {
                    id: 'user1',
                    name: 'Player One',
                    sanitizedName: 'player_one',
                    totalScore: 100
                },
                {
                    id: 'user2', 
                    name: 'Player Two',
                    sanitizedName: 'player_two',
                    totalScore: 75
                },
                {
                    id: 'user3',
                    name: 'Player Three', 
                    sanitizedName: 'player_three',
                    totalScore: 50
                }
            ];
            
            // Force update the leaderboard display
            if (window.ironTurtleApp && window.ironTurtleApp.updateLeaderboardDisplay) {
                window.ironTurtleApp.updateLeaderboardDisplay(mockLeaderboard);
            }
        });
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/simple-03-mock-leaderboard.png', fullPage: true });
        
        // Check if leaderboard items exist
        const leaderboardItems = page.locator('.leaderboard-item');
        const itemCount = await leaderboardItems.count();
        console.log(`🟦 Found ${itemCount} leaderboard items`);
        
        if (itemCount === 0) {
            console.log('🟥 No leaderboard items found - checking leaderboard HTML');
            const leaderboardHTML = await page.locator('#leaderboard').innerHTML();
            console.log('Leaderboard HTML:', leaderboardHTML);
            return;
        }
        
        // Test clicking on the first leaderboard item
        const firstItem = leaderboardItems.first();
        
        // Get item attributes
        const userIdentifier = await firstItem.getAttribute('data-user-identifier');
        const userName = await firstItem.getAttribute('data-user-name');
        const itemText = await firstItem.textContent();
        
        console.log('🟦 First leaderboard item details:');
        console.log(`   - Text: ${itemText}`);
        console.log(`   - User Identifier: ${userIdentifier}`);
        console.log(`   - User Name: ${userName}`);
        
        // Check if the modal exists in DOM
        const modalExists = await page.locator('#playerStatsModal').count();
        console.log(`🟦 Player stats modal elements found: ${modalExists}`);
        
        // Check if showPlayerStats function exists
        const functionExists = await page.evaluate(() => {
            return typeof window.ironTurtleApp !== 'undefined' && 
                   typeof window.ironTurtleApp.showPlayerStats === 'function';
        });
        console.log(`🟦 showPlayerStats function exists: ${functionExists}`);
        
        // Test the click functionality
        console.log('🟦 Attempting to click first leaderboard item...');
        
        await page.screenshot({ path: 'test-results/simple-04-before-click.png', fullPage: true });
        
        // Try clicking
        try {
            await firstItem.click();
            console.log('🟦 Click executed');
            
            // Wait for modal to appear
            await page.waitForTimeout(2000);
            
            // Check if modal is visible
            const modalVisible = await page.locator('#playerStatsModal').isVisible();
            console.log(`🟦 Modal visible after click: ${modalVisible}`);
            
            await page.screenshot({ path: 'test-results/simple-05-after-click.png', fullPage: true });
            
            if (modalVisible) {
                console.log('🟢 SUCCESS: Modal opened on click!');
                
                // Check modal content
                const modalTitle = await page.locator('#player-stats-name').textContent();
                console.log(`🟦 Modal shows stats for: ${modalTitle}`);
                
                // Close modal
                await page.click('#playerStatsModal .btn-close');
                await page.waitForTimeout(1000);
                
            } else {
                console.log('🟥 FAILURE: Modal did not open');
                
                // Debug: Try manual function call
                console.log('🟦 Testing direct function call...');
                const directCallResult = await page.evaluate(() => {
                    if (window.ironTurtleApp && window.ironTurtleApp.showPlayerStats) {
                        try {
                            window.ironTurtleApp.showPlayerStats('user1', 'Player One');
                            return 'Function called successfully';
                        } catch (error) {
                            return 'Function call error: ' + error.message;
                        }
                    }
                    return 'Function not available';
                });
                console.log(`🟦 Direct function call result: ${directCallResult}`);
                
                await page.waitForTimeout(2000);
                const modalVisibleAfterDirect = await page.locator('#playerStatsModal').isVisible();
                console.log(`🟦 Modal visible after direct call: ${modalVisibleAfterDirect}`);
                
                if (modalVisibleAfterDirect) {
                    console.log('🟡 ISSUE: Direct function call works, but click handler doesn\'t');
                    await page.screenshot({ path: 'test-results/simple-06-direct-call-works.png', fullPage: true });
                } else {
                    console.log('🟥 ISSUE: Even direct function call doesn\'t work');
                }
            }
            
        } catch (error) {
            console.error('🟥 Error clicking leaderboard item:', error.message);
            await page.screenshot({ path: 'test-results/simple-07-click-error.png', fullPage: true });
        }
        
        // Final diagnostics
        console.log('🟦 Running final diagnostics...');
        
        // Check for JavaScript errors
        const jsErrors = await page.evaluate(() => {
            const errors = [];
            // Capture any stored errors
            if (window.console && window.console._errors) {
                errors.push(...window.console._errors);
            }
            return errors;
        });
        console.log('🟦 JavaScript errors found:', jsErrors.length > 0 ? jsErrors : 'none');
        
        // Check event listeners
        const hasListeners = await firstItem.evaluate((element) => {
            // Check if element has onclick or event listeners
            const hasOnClick = !!element.onclick;
            const hasEventListeners = element._listeners || 
                                    (window.getEventListeners && window.getEventListeners(element).click?.length > 0);
            return {
                hasOnClick,
                hasEventListeners: !!hasEventListeners
            };
        });
        console.log('🟦 Event listener analysis:', hasListeners);
        
        console.log('🟦 Simple test completed!');
    });
});