#!/usr/bin/env python3
"""
Simple test to check leaderboard functionality
"""

import asyncio
from playwright.async_api import async_playwright
import os

async def simple_test():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
    page = await browser.new_page()
    
    console_messages = []
    page.on('console', lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
    page.on('pageerror', lambda error: console_messages.append(f"[ERROR] {error}"))
    
    try:
        print("🌐 Navigating to Iron Turtle application...")
        await page.goto('http://localhost:8080/index.html', wait_until='domcontentloaded')
        
        # Wait for page to be ready
        await asyncio.sleep(3)
        
        # Create screenshots directory
        os.makedirs('test_screenshots', exist_ok=True)
        
        # Take initial screenshot
        await page.screenshot(path='test_screenshots/01_initial.png', full_page=True)
        print("📸 Initial screenshot taken")
        
        # Get page content
        title = await page.title()
        print(f"📄 Page title: {title}")
        
        # Check if registration screen is visible
        reg_screen = page.locator('#registration-screen')
        reg_visible = await reg_screen.is_visible()
        print(f"📋 Registration screen visible: {reg_visible}")
        
        # Check if dashboard screen is visible 
        dash_screen = page.locator('#dashboard-screen')
        dash_visible = await dash_screen.is_visible()
        print(f"📊 Dashboard screen visible: {dash_visible}")
        
        # If we're on registration screen, let's register a user
        if reg_visible:
            print("👤 Registering test user...")
            await page.fill('#player-name', 'Test Player')
            await page.click('#registration-form button[type="submit"]')
            await asyncio.sleep(3)
            
            await page.screenshot(path='test_screenshots/02_after_registration.png', full_page=True)
            print("📸 After registration screenshot taken")
            
            # Check if dashboard is now visible
            dash_visible = await dash_screen.is_visible()
            print(f"📊 Dashboard screen visible after registration: {dash_visible}")
        
        # Look for leaderboard elements
        leaderboard = page.locator('#leaderboard')
        leaderboard_visible = await leaderboard.is_visible()
        print(f"🏆 Leaderboard section visible: {leaderboard_visible}")
        
        # Check for leaderboard items
        leaderboard_items = page.locator('.leaderboard-item')
        item_count = await leaderboard_items.count()
        print(f"📋 Found {item_count} leaderboard items")
        
        if item_count > 0:
            print("🔍 Checking leaderboard items...")
            for i in range(min(item_count, 3)):
                item = leaderboard_items.nth(i)
                is_visible = await item.is_visible()
                text = await item.text_content()
                print(f"  Item {i+1}: Visible={is_visible}, Text='{text.strip()[:50]}'")
                
                if is_visible:
                    print(f"  🖱️ Attempting to click item {i+1}...")
                    try:
                        await item.click()
                        await asyncio.sleep(2)
                        
                        # Check for modal
                        modal = page.locator('.modal, [role="dialog"], .stats-modal')
                        modal_visible = await modal.first.is_visible() if await modal.count() > 0 else False
                        
                        print(f"  📱 Modal opened: {modal_visible}")
                        
                        if modal_visible:
                            await page.screenshot(path=f'test_screenshots/03_modal_{i+1}.png', full_page=True)
                            print(f"  📸 Modal screenshot taken for item {i+1}")
                            
                            # Close modal
                            close_btn = modal.locator('.close, [aria-label="close"], button:has-text("×")')
                            if await close_btn.count() > 0:
                                await close_btn.first.click()
                                await asyncio.sleep(1)
                        
                    except Exception as e:
                        print(f"  ❌ Click failed for item {i+1}: {e}")
        
        # Wait a bit more and take final screenshot
        await asyncio.sleep(2)
        await page.screenshot(path='test_screenshots/04_final.png', full_page=True)
        print("📸 Final screenshot taken")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        # Print console messages
        if console_messages:
            print("\n📊 Console messages:")
            for msg in console_messages:
                print(f"  {msg}")
        else:
            print("✅ No console messages")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(simple_test())