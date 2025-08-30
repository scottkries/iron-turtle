// Theme management for Iron Turtle Challenge
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('ironTurtle_theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);
        
        // Create theme toggle button if it doesn't exist
        this.createThemeToggle();
    }

    createThemeToggle() {
        // Simpler DOM ready check
        if (document.readyState !== 'loading') {
            this.addThemeButtons();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.addThemeButtons());
        }
    }
    
    addThemeButtons() {

        // Add theme toggle to both registration and dashboard screens
        const navbars = document.querySelectorAll('.navbar');
        navbars.forEach(navbar => {
            if (!navbar.querySelector('.theme-toggle')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'btn btn-outline-light btn-sm theme-toggle me-2';
                toggleBtn.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
                toggleBtn.title = 'Toggle Dark Mode';
                toggleBtn.onclick = () => this.toggleTheme();
                
                // Insert before the first button in navbar
                const navButtons = navbar.querySelector('.navbar-nav');
                if (navButtons) {
                    navButtons.insertBefore(toggleBtn, navButtons.firstChild);
                }
            }
        });
        
        // Also add to registration screen which doesn't have a navbar
        const regScreen = document.getElementById('registration-screen');
        if (regScreen && !regScreen.querySelector('.theme-toggle')) {
            const regHeader = regScreen.querySelector('.card-header');
            if (regHeader) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'btn btn-outline-light btn-sm theme-toggle float-end';
                toggleBtn.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
                toggleBtn.title = 'Toggle Dark Mode';
                toggleBtn.onclick = () => this.toggleTheme();
                toggleBtn.style.position = 'absolute';
                toggleBtn.style.right = '15px';
                toggleBtn.style.top = '10px';
                regHeader.style.position = 'relative';
                regHeader.appendChild(toggleBtn);
            }
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.setAttribute('data-bs-theme', 'dark');
            document.body.classList.add('dark-theme');
            
            // Apply dark theme CSS variables
            root.style.setProperty('--bs-body-bg', '#1a1a1a');
            root.style.setProperty('--bs-body-color', '#e0e0e0');
            root.style.setProperty('--bs-card-bg', '#2a2a2a');
            root.style.setProperty('--bs-modal-bg', '#2a2a2a');
            root.style.setProperty('--bs-border-color', '#404040');
            root.style.setProperty('--bs-secondary-bg', '#333333');
            
            // Update Bootstrap component colors
            this.updateBootstrapComponents('dark');
        } else {
            root.removeAttribute('data-bs-theme');
            document.body.classList.remove('dark-theme');
            
            // Reset to light theme
            root.style.removeProperty('--bs-body-bg');
            root.style.removeProperty('--bs-body-color');
            root.style.removeProperty('--bs-card-bg');
            root.style.removeProperty('--bs-modal-bg');
            root.style.removeProperty('--bs-border-color');
            root.style.removeProperty('--bs-secondary-bg');
            
            // Update Bootstrap component colors
            this.updateBootstrapComponents('light');
        }
        
        // Update toggle button icons
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        });
    }

    updateBootstrapComponents(theme) {
        // Update card classes
        document.querySelectorAll('.card').forEach(card => {
            if (theme === 'dark') {
                card.classList.add('text-light', 'bg-dark');
                card.classList.remove('bg-white');
            } else {
                card.classList.remove('text-light', 'bg-dark');
                card.classList.add('bg-white');
            }
        });

        // Update modal classes
        document.querySelectorAll('.modal-content').forEach(modal => {
            if (theme === 'dark') {
                modal.classList.add('bg-dark', 'text-light');
            } else {
                modal.classList.remove('bg-dark', 'text-light');
            }
        });

        // Update form controls
        document.querySelectorAll('.form-control, .form-select').forEach(input => {
            if (theme === 'dark') {
                input.classList.add('bg-dark', 'text-light', 'border-secondary');
            } else {
                input.classList.remove('bg-dark', 'text-light', 'border-secondary');
            }
        });

        // Update list groups
        document.querySelectorAll('.list-group-item').forEach(item => {
            if (theme === 'dark') {
                item.classList.add('bg-dark', 'text-light', 'border-secondary');
            } else {
                item.classList.remove('bg-dark', 'text-light', 'border-secondary');
            }
        });

        // Update tables
        document.querySelectorAll('table').forEach(table => {
            if (theme === 'dark') {
                table.classList.add('table-dark');
            } else {
                table.classList.remove('table-dark');
            }
        });

        // Update dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
            if (theme === 'dark') {
                dropdown.classList.add('dropdown-menu-dark');
            } else {
                dropdown.classList.remove('dropdown-menu-dark');
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('ironTurtle_theme', this.currentTheme);
        this.applyTheme(this.currentTheme);
        
        // Trigger custom event for other components to react
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: this.currentTheme }));
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
window.themeManager = new ThemeManager();

// Listen for dynamically added content and apply theme
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            // Reapply theme to new elements
            if (window.themeManager) {
                window.themeManager.updateBootstrapComponents(window.themeManager.getTheme());
            }
        }
    });
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
} else {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}