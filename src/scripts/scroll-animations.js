// Universal Scroll Animation System
class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.elements = [];
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.disableAnimations();
      return;
    }

    this.setupObserver();
    this.findElements();
    this.observeElements();
  }

  setupObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '-50px 0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
        }
      });
    }, options);
  }

  findElements() {
    const selectors = [
      '.fade-in',
      '.slide-up',
      '.slide-down',
      '.slide-left',
      '.slide-right',
      '.scale-up',
      '.stagger-children',
      '.text-reveal',
      '.scroll-animate-section',
      '.scroll-animate-item'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      this.elements.push(...elements);
    });
  }

  observeElements() {
    this.elements.forEach(element => {
      // Add will-change for performance
      element.classList.add('will-animate');
      this.observer.observe(element);
    });
  }

  animateElement(element) {
    const delay = parseFloat(element.getAttribute('data-delay') || 0);
    const duration = parseFloat(element.getAttribute('data-duration') || 600);

    // Set custom duration if specified
    if (element.hasAttribute('data-duration')) {
      element.style.transitionDuration = `${duration}ms`;
    }

    setTimeout(() => {
      element.classList.add('animate');
      
      // Remove will-change after animation completes
      setTimeout(() => {
        element.classList.remove('will-animate');
        element.classList.add('will-animate-complete');
      }, duration);
    }, delay * 1000);

    // Stop observing this element
    this.observer.unobserve(element);
  }

  disableAnimations() {
    // Add reduced motion class to body
    document.body.classList.add('reduced-motion');
    
    // Immediately show all elements
    const elements = document.querySelectorAll('[class*="slide-"], [class*="fade-"], [class*="scale-"]');
    elements.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.transition = 'none';
    });
  }

  // Method to manually trigger animations
  triggerAnimation(element) {
    if (element && !element.classList.contains('animate')) {
      this.animateElement(element);
    }
  }

  // Method to add new elements after page load
  addElement(element) {
    if (this.observer && element) {
      element.classList.add('will-animate');
      this.observer.observe(element);
    }
  }

  // Cleanup method
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements = [];
  }
}

// Enhanced button interactions
class ButtonAnimations {
  constructor() {
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    const buttons = document.querySelectorAll('.btn-animate, .btn-enhanced');
    buttons.forEach(button => {
      this.setupButtonInteractions(button);
    });
  }

  setupButtonInteractions(button) {
    let isPressed = false;

    button.addEventListener('mouseenter', () => {
      if (!isPressed) {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 8px 20px rgba(var(--color-accent-rgb), 0.2)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!isPressed) {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '';
      }
    });

    button.addEventListener('mousedown', () => {
      isPressed = true;
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(var(--color-accent-rgb), 0.3)';
    });

    button.addEventListener('mouseup', () => {
      isPressed = false;
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 20px rgba(var(--color-accent-rgb), 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      isPressed = false;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '';
    });
  }
}

// Parallax scroll effects
class ParallaxEffects {
  constructor() {
    this.elements = [];
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.findElements();
    this.bindEvents();
  }

  findElements() {
    const slowElements = document.querySelectorAll('.parallax-slow');
    const fastElements = document.querySelectorAll('.parallax-fast');

    slowElements.forEach(element => {
      this.elements.push({ element, speed: 0.3 });
    });

    fastElements.forEach(element => {
      this.elements.push({ element, speed: 0.6 });
    });
  }

  bindEvents() {
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const _rate = scrolled * -0.5;

      this.elements.forEach(({ element, speed }) => {
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
  }
}

// Text reveal animations
class TextReveal {
  constructor() {
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    const textElements = document.querySelectorAll('.text-reveal');
    textElements.forEach(element => {
      this.prepareTextReveal(element);
    });
  }

  prepareTextReveal(element) {
    const text = element.textContent;
    const words = text.split(' ');

    element.innerHTML = words.map((word, index) => 
      `<span style="transition-delay: ${index * 0.1}s">${word}</span>`
    ).join(' ');
  }
}

// Initialize all animation systems
document.addEventListener('DOMContentLoaded', () => {
  // Initialize systems
  const scrollAnimations = new ScrollAnimations();
  const buttonAnimations = new ButtonAnimations();
  const _parallaxEffects = new ParallaxEffects();
  const _textReveal = new TextReveal();

  // Make scroll animations globally accessible
  window.scrollAnimations = scrollAnimations;

  // Handle dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Re-initialize animations for new elements
            const animateElements = node.querySelectorAll('[class*="slide-"], [class*="fade-"], [class*="scale-"]');
            animateElements.forEach(element => {
              scrollAnimations.addElement(element);
            });

            // Re-initialize button animations
            const buttons = node.querySelectorAll('.btn-animate, .btn-enhanced');
            buttons.forEach(button => {
              buttonAnimations.setupButtonInteractions(button);
            });
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollAnimations, ButtonAnimations, ParallaxEffects, TextReveal };
}