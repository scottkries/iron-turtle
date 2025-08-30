// Fallback initialization script
// This ensures the app works even if Firebase fails to load

(function() {
    'use strict';
    
    // Wait for DOM and all scripts to load
    let initAttempts = 0;
    const maxAttempts = 10;
    
    function tryInitialize() {
        initAttempts++;
        
        // Check if the app is already initialized
        if (window.ironTurtleApp) {
            console.log('App already initialized');
            return;
        }
        
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            if (initAttempts < maxAttempts) {
                setTimeout(tryInitialize, 500);
            }
            return;
        }
        
        // Check if critical dependencies are loaded
        const dependenciesLoaded = 
            typeof IronTurtleApp !== 'undefined' &&
            typeof window.ACTIVITIES !== 'undefined' &&
            typeof window.MULTIPLIERS !== 'undefined';
        
        if (!dependenciesLoaded) {
            console.warn(`Waiting for dependencies... (attempt ${initAttempts}/${maxAttempts})`);
            if (initAttempts < maxAttempts) {
                setTimeout(tryInitialize, 500);
            } else {
                console.error('Failed to load dependencies after maximum attempts');
                showErrorMessage();
            }
            return;
        }
        
        // Initialize the app
        try {
            console.log('Initializing Iron Turtle App with fallback...');
            window.ironTurtleApp = new IronTurtleApp();
            console.log('App initialized successfully via fallback');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            showErrorMessage();
        }
    }
    
    function showErrorMessage() {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger m-4">
                    <h4 class="alert-heading">Loading Error</h4>
                    <p>The application failed to load properly. Please try:</p>
                    <ul>
                        <li>Refreshing the page (Ctrl+F5 or Cmd+Shift+R)</li>
                        <li>Clearing your browser cache</li>
                        <li>Checking your internet connection</li>
                        <li>Trying a different browser</li>
                    </ul>
                    <hr>
                    <button class="btn btn-primary" onclick="location.reload(true)">Reload Page</button>
                </div>
            `;
        }
    }
    
    // Start initialization attempts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitialize);
    } else {
        // DOM already loaded
        setTimeout(tryInitialize, 100);
    }
    
    // Also try on window load as a backup
    window.addEventListener('load', function() {
        setTimeout(tryInitialize, 1000);
    });
})();