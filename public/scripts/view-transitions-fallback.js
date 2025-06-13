// This script provides a fallback for browsers that don't support the View Transitions API
document.addEventListener('astro:page-load', () => {
  // Check if the browser supports View Transitions
  const supportsViewTransitions = 'startViewTransition' in document;
  
  // Add an attribute to the HTML element to use in CSS
  document.documentElement.setAttribute(
    'data-supports-transitions', 
    supportsViewTransitions ? 'true' : 'false'
  );
  
  // If View Transitions API isn't supported, add a simple fade effect
  if (!supportsViewTransitions) {
    // Add a class to the body for the initial state
    document.body.classList.add('no-vt-transition-active');
    
    // Listen for navigation events
    document.addEventListener('astro:before-preparation', () => {
      // Start our manual transition
      document.body.classList.add('no-vt-transition-out');
    });
    
    // After content swap
    document.addEventListener('astro:after-swap', () => {
      // Complete the transition
      document.body.classList.remove('no-vt-transition-out');
      document.body.classList.add('no-vt-transition-in');
      
      // Clean up
      setTimeout(() => {
        document.body.classList.remove('no-vt-transition-in');
      }, 300);
    });
  }
});
