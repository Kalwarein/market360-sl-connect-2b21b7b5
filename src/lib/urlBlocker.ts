// Block specific domains and URL patterns
const BLOCKED_PATTERNS = [
  'lovable.dev/projects/',
  'utm_source=lovable-badge'
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => url.includes(pattern));
}

export function initializeUrlBlocker() {
  // Block clicks on links
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link?.href && isBlockedUrl(link.href)) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Blocked navigation to:', link.href);
      return false;
    }
  }, true);

  // Block window.open
  const originalOpen = window.open;
  window.open = function(url?: string | URL, ...args: any[]) {
    if (url && isBlockedUrl(url.toString())) {
      console.log('Blocked window.open to:', url);
      return null;
    }
    return originalOpen.call(window, url, ...args);
  };

  // Block window.location changes
  const originalLocationAssign = window.location.assign;
  window.location.assign = function(url: string | URL) {
    if (isBlockedUrl(url.toString())) {
      console.log('Blocked location.assign to:', url);
      return;
    }
    return originalLocationAssign.call(window.location, url);
  };
}
