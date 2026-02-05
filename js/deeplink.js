// =====================================================
// Deeplink redirect script - EXACT COPY OF BOUNCY.AI
// go.bestonlyfansgirl.com -> opens in Safari WITHOUT dialog
//
// 2026-02-05: EXACT BOUNCY COPY - simple approach works!
// NO cascade, NO googlechrome://, NO isWebView detection
// Just single x-safari- with 100ms delay
// =====================================================

// Prevent page from being cached
window.addEventListener('beforeunload', function() {});

// Global variables for analytics setup tracking
let analyticsSetup = false;

// Function to setup analytics with validation
function setupAnalytics(measurementId, metaPixelId) {
    if (analyticsSetup) return;

    if (measurementId) {
        if (/^\d+$/.test(measurementId)) measurementId = 'G-' + measurementId;
        if (!/^G-[A-Z0-9]+$/.test(measurementId) && !/^UA-\d+-\d+$/.test(measurementId)) return;

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', measurementId);
        window.gtag = gtag;
    }

    if (metaPixelId) {
        if (!/^\d+$/.test(metaPixelId)) return;

        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', metaPixelId);
        fbq('track', 'PageView');
        window.fbq = fbq;
    }

    analyticsSetup = true;
}

// Main redirect logic
function handleRedirectLogic() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("destination") || "https://bestonlyfansgirl.com";
    const deeplinkId = urlParams.get("id");
    const measurementId = urlParams.get("ga");
    const metaPixelId = urlParams.get("pixel");
    const backUrl = urlParams.get("backUrl");

    // Setup analytics immediately
    setupAnalytics(measurementId, metaPixelId);

    // Device detection
    const detectDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) return "android";
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
        return "desktop";
    };

    // Android Intent URL
    const intentRedirect = (url) => {
        try {
            const targetUrl = new URL(url);
            const intentUrl = `intent://${targetUrl.host}${targetUrl.pathname}${targetUrl.search}#Intent;scheme=${targetUrl.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
            window.location.href = intentUrl;
        } catch (error) {
            window.location = url;
        }
    };

    // =====================================================
    // REDIRECT - EXACT BOUNCY.AI APPROACH
    // Simple, no cascade, no googlechrome://
    // =====================================================
    const redirect = () => {
        const device = detectDevice();
        const formattedRedirectUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;

        if (device === "desktop") {
            // Desktop: Direct redirect
            window.location.href = formattedRedirectUrl;
        } else if (device === "android") {
            // Android: Open in Chrome using Intent URL
            setTimeout(() => {
                intentRedirect(formattedRedirectUrl);
            }, 100);
        } else if (device === "ios") {
            // iOS: Open in Safari using x-safari- prefix
            setTimeout(() => {
                window.location = `x-safari-${formattedRedirectUrl}`;
            }, 100);
        }
    };

    // Start the redirect process immediately
    redirect();
}

// Run the redirect logic on both DOMContentLoaded and pageshow (for cached pages)
document.addEventListener("DOMContentLoaded", handleRedirectLogic);

// CRITICAL: This catches when page is loaded from browser cache (back button)
window.addEventListener("pageshow", function(event) {
    handleRedirectLogic();
});

// Additional cache prevention
window.addEventListener("pagehide", function() {});

// Force no cache with meta tags
if (document.head) {
    const metaNoCache = document.createElement('meta');
    metaNoCache.httpEquiv = 'Cache-Control';
    metaNoCache.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(metaNoCache);

    const metaPragma = document.createElement('meta');
    metaPragma.httpEquiv = 'Pragma';
    metaPragma.content = 'no-cache';
    document.head.appendChild(metaPragma);

    const metaExpires = document.createElement('meta');
    metaExpires.httpEquiv = 'Expires';
    metaExpires.content = '0';
    document.head.appendChild(metaExpires);
}
