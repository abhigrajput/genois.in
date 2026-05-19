'use client';

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', eventName, params);
}

export function trackSignup(method = 'email') {
  trackEvent('sign_up', { method });
}

export function trackLogin(method = 'email') {
  trackEvent('login', { method });
}

export function trackPurchase(plan, amount) {
  trackEvent('purchase', {
    currency: 'INR',
    value: amount,
    items: [{ item_id: plan, item_name: `GENOIS ${plan}`, price: amount, quantity: 1 }],
  });
}

export function trackPageView(path) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}
