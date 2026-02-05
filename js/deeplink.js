// =====================================================
// Deeplink redirect script for iOS/Android
// go.bestonlyfansgirl.com -> opens in Safari WITHOUT dialog
//
// 2026-02-05: Updated to match Bouncy.ai NEW simplified approach
// Bouncy removed cascade and now uses ONLY x-safari- for iOS
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

// Main redirect logic - MUST be synchronous for proper timing!
function handleRedirectLogic() {
    const urlParams = new URLSearchParams(window.location.search);
    // destination is passed by Cloud Function (index.js) - no need for API calls here
    const redirectUrl = urlParams.get("destination") || "https://bestonlyfansgirl.com";
    const deeplinkId = urlParams.get("id");
    const measurementId = urlParams.get("ga");
    const metaPixelId = urlParams.get("pixel");

    // Setup analytics
    setupAnalytics(measurementId, metaPixelId);

    // =====================================================
    // Device detection functions
    // =====================================================

    const detectDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) return "android";
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
        return "desktop";
    };

    // Android Intent URL for Chrome
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
    // REDIRECT LOGIC - BOUNCY.AI SIMPLIFIED APPROACH (Feb 2026)
    //
    // Bouncy changed their code! Old cascade (googlechrome + x-safari + fallback)
    // was removed. Now they use ONLY x-safari- for iOS.
    //
    // OLD (Dec 2025): 3 setTimeout cascade for iOS WebView/Normal
    // NEW (Feb 2026): Single x-safari- with 100ms delay
    //
    // If this doesn't work, we can rollback to cascade approach.
    // =====================================================

    const redirect = () => {
        const device = detectDevice();
        const formattedRedirectUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;

        // DESKTOP - immediate redirect (unchanged)
        if (device === "desktop") {
            window.location.href = formattedRedirectUrl;
            return;
        }

        // ANDROID - Intent URL (unchanged from Bouncy)
        if (device === "android") {
            setTimeout(() => {
                intentRedirect(formattedRedirectUrl);
            }, 100);
            return;
        }

        // iOS - SIMPLIFIED APPROACH (matching Bouncy Feb 2026)
        // Only x-safari- prefix, no googlechrome://, no cascade
        // Works for ALL iOS: WebView (Reddit, Instagram) AND normal Safari
        if (device === "ios") {
            setTimeout(() => {
                window.location = `x-safari-${formattedRedirectUrl}`;
            }, 100);
        }
    };

    // Start redirect immediately
    redirect();
}

// Run on DOMContentLoaded
document.addEventListener("DOMContentLoaded", handleRedirectLogic);

// CRITICAL: Also run on pageshow for cached pages (back button)
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
