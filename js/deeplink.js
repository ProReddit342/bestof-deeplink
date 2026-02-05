// =====================================================
// Deeplink redirect script - EXACT BOUNCY.AI COPY
// go.bestonlyfansgirl.com -> opens in Safari WITHOUT dialog
//
// 2026-02-05: Copied from https://allmyspicylinks.com/js/deeplink.js
// Key: Simple x-safari- approach, NO cascade, NO googlechrome://
// =====================================================

// Prevent page from being cached
window.addEventListener('beforeunload', function() {
    // This helps prevent page caching
});

// Global variables for analytics setup tracking
let analyticsSetup = false; // Flag to prevent duplicate setup

// Function to setup analytics with validation
function setupAnalytics(measurementId, metaPixelId) {
    // Prevent duplicate setup
    if (analyticsSetup) {
        return;
    }

    // Add Google Analytics if provided
    if (measurementId) {
        // If measurementId is just numbers, add G- prefix
        if (/^\d+$/.test(measurementId)) {
            measurementId = 'G-' + measurementId;
        }

        // Validate GA ID format
        if (!/^G-[A-Z0-9]+$/.test(measurementId) && !/^UA-\d+-\d+$/.test(measurementId)) {
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', measurementId);

        // Make gtag available globally for debugging
        window.gtag = gtag;
    }

    // Add Meta Pixel if provided
    if (metaPixelId) {
        // Validate Meta Pixel ID (should be numbers only)
        if (!/^\d+$/.test(metaPixelId)) {
            return;
        }

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

        const noscript = document.createElement('noscript');
        const img = document.createElement('img');
        img.height = "1";
        img.width = "1";
        img.style.display = "none";
        img.src = `https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`;
        noscript.appendChild(img);
        document.head.appendChild(noscript);

        // Make fbq available globally for debugging
        window.fbq = fbq;
    }

    // Mark analytics as setup to prevent duplicates
    analyticsSetup = true;
}

// Function to handle the redirect logic
function handleRedirectLogic() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("destination") || "https://bestonlyfansgirl.com";
    const deeplinkId = urlParams.get("id");
    const measurementId = urlParams.get("ga");
    const metaPixelId = urlParams.get("pixel");
    const backUrl = urlParams.get("backUrl");

    // Setup analytics immediately
    setupAnalytics(measurementId, metaPixelId);

    const detectDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) return "android";
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
        return "desktop";
    };

    const intentRedirect = (url) => {
        try {
            const targetUrl = new URL(url);
            const intentUrl = `intent://${targetUrl.host}${targetUrl.pathname}${targetUrl.search}#Intent;scheme=${targetUrl.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
            window.location.href = intentUrl;
        } catch (error) {
            window.location = url;
        }
    };

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
            // EXACT Bouncy approach - simple, no cascade
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
window.addEventListener("pagehide", function() {
    // Mark page as should not be cached
});

// Force no cache with meta tag approach
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
