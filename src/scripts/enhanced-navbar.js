/**
 * Enhanced Navbar Interactive Functionality
 * Handles mobile menu toggle, search functionality, and animations
 */

class EnhancedNavbar {
  constructor() {
    this.mobileMenuButton = document.getElementById('mobile-menu-button');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.searchToggle = document.getElementById('search-toggle');
    this.mobileSearchToggle = document.getElementById('mobile-search-toggle');
    this.navbar = document.querySelector('.navbar-enhanced');
    this.isMenuOpen = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupScrollHandler();
    this.setupKeyboardNavigation();
  }

  bindEvents() {
    // Mobile menu toggle
    if (this.mobileMenuButton && this.mobileMenu) {
      this.mobileMenuButton.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Search functionality
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', () => this.handleSearch());
    }

    if (this.mobileSearchToggle) {
      this.mobileSearchToggle.addEventListener('click', () => this.handleSearch());
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => this.handleOutsideClick(e));

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu when route changes
    window.addEventListener('popstate', () => {
      if (this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.isMenuOpen = true;
    this.mobileMenuButton.classList.add('active');
    this.mobileMenuButton.setAttribute('aria-expanded', 'true');
    
    // Show mobile menu
    this.mobileMenu.classList.remove('-translate-y-full', 'opacity-0', 'invisible');
    this.mobileMenu.classList.add('translate-y-0', 'opacity-100', 'visible');
    this.mobileMenu.setAttribute('aria-hidden', 'false');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';

    // Focus first menu item for accessibility
    const firstMenuItem = this.mobileMenu.querySelector('.mobile-nav-link');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 300);
    }
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.mobileMenuButton.classList.remove('active');
    this.mobileMenuButton.setAttribute('aria-expanded', 'false');
    
    // Hide mobile menu
    this.mobileMenu.classList.add('-translate-y-full', 'opacity-0', 'invisible');
    this.mobileMenu.classList.remove('translate-y-0', 'opacity-100', 'visible');
    this.mobileMenu.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  handleOutsideClick(e) {
    if (this.isMenuOpen && 
        !this.mobileMenu.contains(e.target) && 
        !this.mobileMenuButton.contains(e.target)) {
      this.closeMobileMenu();
    }
  }

  handleSearch() {
    // Open the search modal
    if (window.searchModal) {
      window.searchModal.open();
    } else {
      // Fallback: wait for search modal to be initialized
      setTimeout(() => {
        if (window.searchModal) {
          window.searchModal.open();
        }
      }, 100);
    }
  }

  setupScrollHandler() {
    let ticking = false;

    const updateNavbar = () => {
      if (!this.navbar) return;

      const currentScrollY = window.scrollY;
      
      // Add scrolled class for styling changes
      if (currentScrollY > 50) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Handle resize events
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation for mobile menu
    if (this.mobileMenu) {
      this.mobileMenu.addEventListener('keydown', (e) => {
        if (!this.isMenuOpen) return;
        
        const focusableElements = this.mobileMenu.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      });
      
      // Close menu when clicking on navigation links
      const navLinks = this.mobileMenu.querySelectorAll('.mobile-nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (this.isMenuOpen) {
            this.closeMobileMenu();
          }
        });
      });
    }
  }
}

// Initialize enhanced navbar
function initEnhancedNavbar() {
  if (document.querySelector('.navbar-enhanced')) {
    new EnhancedNavbar();
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancedNavbar);
} else {
  initEnhancedNavbar();
}

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedNavbar;
}
