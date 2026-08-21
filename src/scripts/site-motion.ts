/**
 * Site motion orchestration (reveal animations, parallax, route direction, hero typography).
 * Loaded as a non-blocking deferred script by the layout so it never competes with the
 * hero LCP image for the main thread.
 */

type MotionState = {
  revealObserver: IntersectionObserver | null;
  parallaxFrame: number;
  parallaxHandler: (() => void) | null;
};

declare global {
  interface Window {
    __portfolioMotionState?: MotionState;
  }
}

const getMotionState = (): MotionState => {
  if (!window.__portfolioMotionState) {
    window.__portfolioMotionState = {
      revealObserver: null,
      parallaxFrame: 0,
      parallaxHandler: null,
    };
  }
  return window.__portfolioMotionState;
};

const normalizePath = (value: string): string => {
  if (!value) return '/';
  const clean = value.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
};

const ROUTE_ORDER: Record<string, number> = {
  '/': 0,
  '/projects': 10,
  '/blog': 20,
  '/resume': 30,
  '/services': 40,
  '/react-developer': 50,
  '/uses': 60,
  '/videos': 70,
  '/about': 80,
  '/contact-me': 90,
};

const getRouteWeight = (pathname: string): number => {
  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const topLevel = segments.length ? `/${segments[0]}` : '/';
  return ROUTE_ORDER[topLevel] ?? 50;
};

const initRouteDirection = (): void => {
  document.addEventListener('astro:before-preparation', (event) => {
    // astro:before-preparation events expose `from` and `to` as URL
    // instances directly on the event (not on `.detail`). Treat as a
    // structural type so we don't need to import the internal event class.
    const navEvent = event as unknown as {
      from?: { pathname: string };
      to?: { pathname: string };
    };
    const from = navEvent.from;
    const to = navEvent.to;
    if (!from || !to) return;

    const fromDepth = normalizePath(from.pathname).split('/').filter(Boolean).length;
    const toDepth = normalizePath(to.pathname).split('/').filter(Boolean).length;
    const fromWeight = getRouteWeight(from.pathname);
    const toWeight = getRouteWeight(to.pathname);

    const direction =
      toDepth < fromDepth || (toDepth === fromDepth && toWeight < fromWeight)
        ? 'backward'
        : 'forward';

    document.documentElement.setAttribute('data-route-direction', direction);
  });
};

const initReveal = (reducedMotion: boolean, state: MotionState): void => {
  state.revealObserver?.disconnect();
  const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  // Track scroll velocity so fast scrolling skips animation delays.
  let fastScroll = false;
  let fastScrollTimer = 0;
  let lastScrollY = window.scrollY;
  const onScrollVelocity = (): void => {
    const delta = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    if (delta > 60) {
      fastScroll = true;
      clearTimeout(fastScrollTimer);
      fastScrollTimer = window.setTimeout(() => {
        fastScroll = false;
      }, 200);
    }
  };
  window.addEventListener('scroll', onScrollVelocity, { passive: true });

  state.revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (fastScroll) {
          (entry.target as HTMLElement).style.setProperty('--reveal-delay', '0ms');
        }
        entry.target.classList.add('is-visible');
        state.revealObserver?.unobserve(entry.target);
      }
    },
    { threshold: 0.05, rootMargin: '0px 0px 0px 0px' },
  );

  revealElements.forEach((element, index) => {
    const hasCustomDelay = element.hasAttribute('data-reveal-delay');
    const customDelay = Number(element.getAttribute('data-reveal-delay') || '0');
    const staggerDelay = Number(element.getAttribute('data-reveal-stagger') || '');
    const delay =
      hasCustomDelay && Number.isFinite(customDelay) && customDelay >= 0 ? customDelay : index * 20;
    element.style.setProperty('--reveal-delay', `${Math.min(delay + staggerDelay, 120)}ms`);
    state.revealObserver?.observe(element);
  });
};

const initParallax = (reducedMotion: boolean, state: MotionState): void => {
  if (state.parallaxHandler) {
    window.removeEventListener('scroll', state.parallaxHandler);
    window.removeEventListener('resize', state.parallaxHandler);
    cancelAnimationFrame(state.parallaxFrame);
  }

  const parallaxElements = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (reducedMotion || parallaxElements.length === 0) {
    parallaxElements.forEach((element) => {
      element.style.removeProperty('--parallax-offset');
    });
    return;
  }

  const updateParallax = (): void => {
    const viewportHeight = window.innerHeight;
    for (const element of parallaxElements) {
      const rect = element.getBoundingClientRect();
      const speed = Number(element.getAttribute('data-parallax-speed') || '0.12');
      const progress = (viewportHeight * 0.5 - (rect.top + rect.height * 0.5)) * speed;
      element.style.setProperty('--parallax-offset', `${progress.toFixed(2)}px`);
    }
    state.parallaxFrame = 0;
  };

  const onScroll = (): void => {
    if (state.parallaxFrame) return;
    state.parallaxFrame = requestAnimationFrame(updateParallax);
  };

  state.parallaxHandler = onScroll;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
};

const initHeroTypography = (reducedMotion: boolean): void => {
  const titles = document.querySelectorAll<HTMLElement>('[data-hero-title]');
  titles.forEach((el) => {
    if (el.getAttribute('data-hero-split') === 'done') return;
    el.setAttribute('data-hero-split', 'done');

    const text = (el.textContent || '').trim();
    if (reducedMotion) return;

    const startDelay = 60;
    const perChar = 28;

    const charsHtml = text
      .split('')
      .map((char, i) => {
        const delay = startDelay + i * perChar;
        const escaped = char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<span class="tw-char" style="animation-delay:${delay}ms">${escaped}</span>`;
      })
      .join('');

    const totalDuration = startDelay + text.length * perChar;
    el.innerHTML = charsHtml + `<span class="tw-cursor"></span>`;

    const cursor = el.querySelector<HTMLElement>('.tw-cursor');
    if (cursor) {
      setTimeout(() => cursor.classList.add('is-done'), totalDuration + 900);
    }
  });
};

export const initSiteMotion = (): void => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = getMotionState();
  initRouteDirection();
  initHeroTypography(reducedMotion);
  initReveal(reducedMotion, state);
  initParallax(reducedMotion, state);
};
