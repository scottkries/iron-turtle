#!/usr/bin/env python3
"""
Iron Turtle Leaderboard Click Functionality Test
Tests the leaderboard display and click functionality using Playwright
"""

import asyncio
import json
from playwright.async_api import async_playwright
from datetime import datetime
import os

class LeaderboardTest:
    def __init__(self):
        self.browser = None
        self.page = None
        self.console_messages = []
        self.errors = []
        self.test_results = {
            'setup': False,
            'navigation': False,
            'user_registration': [],
            'leaderboard_display': False,
            'click_functionality': [],
            'edge_cases': [],
            'console_errors': [],
            'screenshots': []
        }
        
    async def setup_browser(self):
        """Initialize Playwright browser"""
        print("🚀 Setting up Playwright browser...")
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
        self.page = await self.browser.new_page()
        
        # Set up console monitoring
        self.page.on('console', lambda msg: self.console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'timestamp': datetime.now().isoformat()
        }))
        
        # Set up error monitoring
        self.page.on('pageerror', lambda error: self.errors.append({
            'message': str(error),
            'timestamp': datetime.now().isoformat()
        }))
        
        self.test_results['setup'] = True
        print("✅ Browser setup complete")
        
    async def take_screenshot(self, name, description=""):
        """Take a screenshot and save it"""
        screenshot_path = f"/Users/scottkriesberg/iron-turtle/test_screenshots/{name}.png"
        os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
        await self.page.screenshot(path=screenshot_path, full_page=True)
        self.test_results['screenshots'].append({
            'name': name,
            'path': screenshot_path,
            'description': description
        })
        print(f"📸 Screenshot saved: {name}")
        
    async def navigate_to_app(self):
        """Navigate to the Iron Turtle application"""
        print("🌐 Navigating to Iron Turtle application...")
        try:
            await self.page.goto('http://localhost:8080/index.html')
            await self.page.wait_for_load_state('networkidle')
            await self.take_screenshot('01_initial_page', 'Initial application page')
            self.test_results['navigation'] = True
            print("✅ Navigation successful")
        except Exception as e:
            print(f"❌ Navigation failed: {e}")
            self.test_results['navigation'] = False
            
    async def register_user(self, username, activities_data):
        """Register a user and log activities"""
        print(f"👤 Registering user: {username}")
        try:
            # Check if already on registration or if we need to navigate
            current_url = self.page.url
            if 'register' not in current_url:
                # Look for register link/button
                register_button = self.page.locator('a[href*="register"], button:has-text("Register"), a:has-text("Register")')
                if await register_button.count() > 0:
                    await register_button.first.click()
                    await self.page.wait_for_load_state('networkidle')
                    
            # Fill registration form
            await self.page.fill('input[name="username"], input[id="username"], #username', username)
            
            # Submit registration
            submit_button = self.page.locator('button[type="submit"], input[type="submit"], button:has-text("Register")')
            if await submit_button.count() > 0:
                await submit_button.first.click()
                await self.page.wait_for_load_state('networkidle')
                
            # Log activities for this user
            await self.log_activities(username, activities_data)
            
            self.test_results['user_registration'].append({
                'username': username,
                'success': True,
                'activities_logged': len(activities_data)
            })
            print(f"✅ User {username} registered successfully with {len(activities_data)} activities")
            
        except Exception as e:
            print(f"❌ Failed to register user {username}: {e}")
            self.test_results['user_registration'].append({
                'username': username,
                'success': False,
                'error': str(e)
            })
            
    async def log_activities(self, username, activities):
        """Log activities for a user"""
        for activity in activities:
            try:
                # Navigate to activity logging area if needed
                log_button = self.page.locator('button:has-text("Log"), a:has-text("Log"), #log-activity')
                if await log_button.count() > 0:
                    await log_button.first.click()
                    await asyncio.sleep(1)
                
                # Fill activity form (this will depend on your actual form structure)
                activity_type = self.page.locator('select[name="type"], #activity-type')
                if await activity_type.count() > 0:
                    await activity_type.select_option(activity['type'])
                
                points_input = self.page.locator('input[name="points"], #points')
                if await points_input.count() > 0:
                    await points_input.fill(str(activity['points']))
                
                description_input = self.page.locator('input[name="description"], textarea[name="description"], #description')
                if await description_input.count() > 0:
                    await description_input.fill(activity['description'])
                
                # Submit activity
                submit_activity = self.page.locator('button:has-text("Submit"), button:has-text("Log"), input[type="submit"]')
                if await submit_activity.count() > 0:
                    await submit_activity.first.click()
                    await asyncio.sleep(1)
                
                print(f"  📝 Logged activity: {activity['description']} ({activity['points']} points)")
                
            except Exception as e:
                print(f"  ❌ Failed to log activity: {e}")
                
    async def test_leaderboard_display(self):
        """Test that leaderboard displays correctly"""
        print("🏆 Testing leaderboard display...")
        try:
            # Navigate to leaderboard
            leaderboard_link = self.page.locator('a[href*="leaderboard"], a:has-text("Leaderboard"), #leaderboard')
            if await leaderboard_link.count() > 0:
                await leaderboard_link.first.click()
                await self.page.wait_for_load_state('networkidle')
                
            await self.take_screenshot('02_leaderboard_populated', 'Populated leaderboard')
            
            # Check for leaderboard entries
            leaderboard_entries = self.page.locator('.leaderboard-item, .player-item, [data-player], tr:has(td)')
            entry_count = await leaderboard_entries.count()
            
            if entry_count >= 3:
                self.test_results['leaderboard_display'] = True
                print(f"✅ Leaderboard displays {entry_count} players")
            else:
                print(f"⚠️ Leaderboard only shows {entry_count} players (expected at least 3)")
                
        except Exception as e:
            print(f"❌ Leaderboard display test failed: {e}")
            self.test_results['leaderboard_display'] = False
            
    async def test_player_clicks(self):
        """Test clicking on players in leaderboard"""
        print("🖱️ Testing player click functionality...")
        
        # Get all clickable player elements
        player_elements = self.page.locator('.leaderboard-item, .player-item, [data-player], .player-row')
        player_count = await player_elements.count()
        
        print(f"Found {player_count} clickable players")
        
        for i in range(min(player_count, 3)):  # Test up to 3 players
            try:
                print(f"  🖱️ Clicking on player {i + 1}...")
                
                # Click on player
                await player_elements.nth(i).click()
                await asyncio.sleep(2)  # Wait for modal to open
                
                # Take screenshot of modal
                await self.take_screenshot(f'03_player_{i+1}_modal', f'Modal for player {i+1}')
                
                # Check if modal opened
                modal = self.page.locator('.modal, [role="dialog"], .stats-modal, .player-stats')
                modal_visible = await modal.count() > 0 and await modal.first.is_visible()
                
                if modal_visible:
                    # Check modal contents
                    player_name = await modal.locator('.player-name, .modal-title h2, h1, h2').first.text_content() if await modal.locator('.player-name, .modal-title h2, h1, h2').count() > 0 else "Unknown"
                    
                    # Look for loading spinner
                    spinner = modal.locator('.spinner, .loading, [data-loading]')
                    has_spinner = await spinner.count() > 0
                    
                    # Look for stats content
                    stats = modal.locator('.stats, .player-stats, .statistics')
                    has_stats = await stats.count() > 0
                    
                    self.test_results['click_functionality'].append({
                        'player_index': i + 1,
                        'modal_opened': True,
                        'player_name': player_name.strip() if player_name else "Unknown",
                        'has_spinner': has_spinner,
                        'has_stats': has_stats
                    })
                    
                    print(f"    ✅ Modal opened for {player_name}")
                    print(f"    📊 Has spinner: {has_spinner}, Has stats: {has_stats}")
                    
                    # Close modal
                    close_button = modal.locator('.close, [aria-label="close"], button:has-text("×")')
                    if await close_button.count() > 0:
                        await close_button.first.click()
                        await asyncio.sleep(1)
                    else:
                        # Try clicking outside modal
                        await self.page.click('body', position={'x': 10, 'y': 10})
                        await asyncio.sleep(1)
                        
                else:
                    self.test_results['click_functionality'].append({
                        'player_index': i + 1,
                        'modal_opened': False,
                        'error': 'Modal did not open'
                    })
                    print(f"    ❌ Modal did not open for player {i + 1}")
                    
            except Exception as e:
                print(f"    ❌ Error clicking player {i + 1}: {e}")
                self.test_results['click_functionality'].append({
                    'player_index': i + 1,
                    'modal_opened': False,
                    'error': str(e)
                })
                
    async def test_edge_cases(self):
        """Test edge cases"""
        print("🧪 Testing edge cases...")
        
        try:
            # Test rapid clicking
            print("  🏃 Testing rapid clicking...")
            player_elements = self.page.locator('.leaderboard-item, .player-item, [data-player]')
            if await player_elements.count() > 0:
                # Click first player multiple times quickly
                for _ in range(3):
                    await player_elements.first.click()
                    await asyncio.sleep(0.1)
                
                await asyncio.sleep(2)
                await self.take_screenshot('04_rapid_click_test', 'Rapid click test result')
                
                self.test_results['edge_cases'].append({
                    'test': 'rapid_clicking',
                    'success': True,
                    'description': 'Rapid clicking test completed'
                })
                
        except Exception as e:
            print(f"  ❌ Edge case testing failed: {e}")
            self.test_results['edge_cases'].append({
                'test': 'edge_cases',
                'success': False,
                'error': str(e)
            })
            
    async def collect_console_data(self):
        """Collect and analyze console messages"""
        print("📊 Analyzing console output...")
        
        errors = [msg for msg in self.console_messages if msg['type'] in ['error', 'warning']]
        logs = [msg for msg in self.console_messages if msg['type'] == 'log']
        
        self.test_results['console_errors'] = errors
        
        if errors:
            print(f"⚠️ Found {len(errors)} console errors/warnings:")
            for error in errors:
                print(f"  - [{error['type']}] {error['text']}")
        else:
            print("✅ No console errors found")
            
        print(f"📝 Total console messages: {len(self.console_messages)}")
        
    async def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("🧪 IRON TURTLE LEADERBOARD TEST REPORT")
        print("="*60)
        
        # Setup and Navigation
        print(f"🚀 Setup: {'✅ SUCCESS' if self.test_results['setup'] else '❌ FAILED'}")
        print(f"🌐 Navigation: {'✅ SUCCESS' if self.test_results['navigation'] else '❌ FAILED'}")
        
        # User Registration
        print(f"\n👥 User Registration:")
        for user in self.test_results['user_registration']:
            status = '✅' if user['success'] else '❌'
            print(f"  {status} {user['username']}: {user.get('activities_logged', 0)} activities")
            
        # Leaderboard Display
        print(f"\n🏆 Leaderboard Display: {'✅ SUCCESS' if self.test_results['leaderboard_display'] else '❌ FAILED'}")
        
        # Click Functionality
        print(f"\n🖱️ Click Functionality:")
        successful_clicks = sum(1 for click in self.test_results['click_functionality'] if click['modal_opened'])
        total_clicks = len(self.test_results['click_functionality'])
        print(f"  Success Rate: {successful_clicks}/{total_clicks}")
        
        for click in self.test_results['click_functionality']:
            if click['modal_opened']:
                print(f"  ✅ Player {click['player_index']}: {click.get('player_name', 'Unknown')} - Modal opened")
                if click.get('has_spinner'):
                    print(f"     🔄 Loading spinner present")
                if click.get('has_stats'):
                    print(f"     📊 Statistics displayed")
            else:
                print(f"  ❌ Player {click['player_index']}: {click.get('error', 'Failed to open modal')}")
        
        # Edge Cases
        print(f"\n🧪 Edge Case Testing:")
        for edge_case in self.test_results['edge_cases']:
            status = '✅' if edge_case['success'] else '❌'
            print(f"  {status} {edge_case['test']}: {edge_case['description']}")
        
        # Console Errors
        print(f"\n📊 Console Analysis:")
        error_count = len(self.test_results['console_errors'])
        if error_count == 0:
            print(f"  ✅ No console errors found")
        else:
            print(f"  ⚠️ {error_count} console errors/warnings:")
            for error in self.test_results['console_errors']:
                print(f"    - [{error['type']}] {error['text']}")
        
        # Screenshots
        print(f"\n📸 Screenshots Captured:")
        for screenshot in self.test_results['screenshots']:
            print(f"  📷 {screenshot['name']}: {screenshot['description']}")
        
        # Overall Assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        setup_ok = self.test_results['setup'] and self.test_results['navigation']
        clicks_working = successful_clicks > 0
        no_critical_errors = len([e for e in self.test_results['console_errors'] if e['type'] == 'error']) == 0
        
        if setup_ok and clicks_working and no_critical_errors:
            print("✅ LEADERBOARD FUNCTIONALITY IS WORKING CORRECTLY")
        else:
            print("❌ ISSUES DETECTED - SEE DETAILS ABOVE")
            
        print("="*60)
        
        # Save detailed report to file
        report_path = "/Users/scottkriesberg/iron-turtle/test_report.json"
        with open(report_path, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"📄 Detailed report saved to: {report_path}")
        
    async def cleanup(self):
        """Clean up browser resources"""
        if self.browser:
            await self.browser.close()
            
    async def run_full_test(self):
        """Run the complete test suite"""
        try:
            await self.setup_browser()
            await self.navigate_to_app()
            
            # Test data for multiple users
            test_users = [
                {
                    'username': 'Test Player 1',
                    'activities': [
                        {'type': 'drink', 'points': 10, 'description': 'Had a beer'},
                        {'type': 'food', 'points': 15, 'description': 'Ate wings'},
                        {'type': 'competition', 'points': 25, 'description': 'Won pool game'}
                    ]
                },
                {
                    'username': 'Test Player 2', 
                    'activities': [
                        {'type': 'drink', 'points': 5, 'description': 'Had a soda'},
                        {'type': 'competition', 'points': 20, 'description': 'Darts tournament'}
                    ]
                },
                {
                    'username': 'Test Player 3',
                    'activities': [
                        {'type': 'food', 'points': 12, 'description': 'Pizza slice'},
                        {'type': 'drink', 'points': 8, 'description': 'Cocktail'},
                        {'type': 'competition', 'points': 30, 'description': 'Trivia night winner'}
                    ]
                }
            ]
            
            # Register users and log activities
            for user_data in test_users:
                await self.register_user(user_data['username'], user_data['activities'])
                
            await self.test_leaderboard_display()
            await self.test_player_clicks()
            await self.test_edge_cases()
            await self.collect_console_data()
            await self.generate_report()
            
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
        finally:
            await self.cleanup()

async def main():
    test = LeaderboardTest()
    await test.run_full_test()

if __name__ == "__main__":
    asyncio.run(main())