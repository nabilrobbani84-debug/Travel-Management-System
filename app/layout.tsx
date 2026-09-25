import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Travel Management System',
  description: 'Enterprise-grade Travel Management System featuring customer booking portal, quota concurrency management, payment gateway integration, staff & admin operations dashboard, and interactive OpenAPI documentation.',
  openGraph: {
    title: 'Travel Management System',
    description: 'Enterprise-grade Travel Management System featuring customer booking portal, quota concurrency management, payment gateway integration, staff & admin operations dashboard, and interactive OpenAPI documentation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Management System',
    description: 'Enterprise-grade Travel Management System featuring customer booking portal, quota concurrency management, payment gateway integration, staff & admin operations dashboard, and interactive OpenAPI documentation.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        {/* Protection against browser extensions (e.g. Urban VPN) attempting read-only fetch reassignment */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origFetch = window.fetch;
                  var activeFetch = origFetch;
                  try {
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return activeFetch; },
                      set: function(fn) { activeFetch = fn; },
                      configurable: true,
                      enumerable: true
                    });
                  } catch (e) {
                    try {
                      if (window.Window && window.Window.prototype) {
                        Object.defineProperty(window.Window.prototype, 'fetch', {
                          get: function() { return activeFetch; },
                          set: function(fn) { activeFetch = fn; },
                          configurable: true,
                          enumerable: true
                        });
                      }
                    } catch (e2) {}
                  }
                } catch (err) {}

                // Intercept unhandled errors originating from Chrome extensions
                window.addEventListener('error', function(event) {
                  var filename = (event && event.filename) || '';
                  var message = (event && event.message) || '';
                  if (
                    filename.indexOf('chrome-extension://') !== -1 ||
                    filename.indexOf('moz-extension://') !== -1 ||
                    message.indexOf('Cannot set property fetch of') !== -1 ||
                    message.indexOf('which has only a getter') !== -1
                  ) {
                    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                    if (event.stopPropagation) event.stopPropagation();
                    if (event.preventDefault) event.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event && event.reason;
                  var str = (reason && (reason.stack || reason.message || '')) + '';
                  if (
                    str.indexOf('chrome-extension://') !== -1 ||
                    str.indexOf('Cannot set property fetch of') !== -1
                  ) {
                    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                    if (event.stopPropagation) event.stopPropagation();
                    if (event.preventDefault) event.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
