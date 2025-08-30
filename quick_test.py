#!/usr/bin/env python3
"""
Quick visual inspection of Iron Turtle application
"""

import asyncio
from playwright.async_api import async_playwright

async def quick_inspect():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=2000)
    page = await browser.new_page()
    
    # Navigate to the app
    print("Navigating to Iron Turtle...")
    await page.goto('http://localhost:8080/index.html')
    await page.wait_for_load_state('networkidle')
    
    # Take screenshot of initial state
    await page.screenshot(path='initial_state.png', full_page=True)
    print("Screenshot saved: initial_state.png")
    
    # Get page title
    title = await page.title()
    print(f"Page title: {title}")
    
    # Check what's visible on the page
    body_text = await page.locator('body').text_content()
    print(f"Body text length: {len(body_text)}")
    print("Body text preview:", body_text[:500])
    
    # Look for leaderboard elements
    leaderboard_items = page.locator('.leaderboard-item')
    count = await leaderboard_items.count()
    print(f"Found {count} leaderboard items")
    
    if count > 0:
        for i in range(count):
            item = leaderboard_items.nth(i)
            is_visible = await item.is_visible()
            text = await item.text_content()
            print(f"  Item {i+1}: Visible={is_visible}, Text='{text.strip()}'")
    
    # Check console messages
    messages = []
    page.on('console', lambda msg: messages.append(f"[{msg.type}] {msg.text}"))
    
    # Wait a bit for any async loading
    await asyncio.sleep(5)
    
    # Take another screenshot after waiting
    await page.screenshot(path='after_wait.png', full_page=True)
    print("Screenshot saved: after_wait.png")
    
    if messages:
        print("Console messages:")
        for msg in messages:
            print(f"  {msg}")
    
    # Check if modal exists in DOM
    modal = page.locator('.modal, [role="dialog"], .stats-modal')
    modal_count = await modal.count()
    print(f"Found {modal_count} modal elements")
    
    # Let's try clicking on the first leaderboard item manually
    if count > 0:
        print("Attempting to click first leaderboard item...")
        try:
            # Scroll to element first
            await leaderboard_items.first.scroll_into_view_if_needed()
            await asyncio.sleep(1)
            
            # Check if it's visible after scrolling
            is_visible = await leaderboard_items.first.is_visible()
            print(f"First item visible after scroll: {is_visible}")
            
            if is_visible:
                await leaderboard_items.first.click()
                await asyncio.sleep(3)
                
                # Check if modal appeared
                modal_visible = await modal.first.is_visible() if modal_count > 0 else False
                print(f"Modal visible after click: {modal_visible}")
                
                # Take screenshot after click
                await page.screenshot(path='after_click.png', full_page=True)
                print("Screenshot saved: after_click.png")
        except Exception as e:
            print(f"Click attempt failed: {e}")
    
    await browser.close()
    print("Inspection complete")

asyncio.run(quick_inspect())