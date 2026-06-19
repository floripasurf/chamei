// Global type augmentations.

declare global {
  interface Window {
    // Google Analytics gtag (loaded via the GA script in layout).
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
