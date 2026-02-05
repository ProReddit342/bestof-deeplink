// =====================================================
// Deeplink redirect script for iOS/Android
// go.bestonlyfansgirl.com -> opens in Safari WITHOUT dialog
//
// Based on Bouncy.ai implementation with ORIGINAL TIMINGS
// CRITICAL: Do NOT change timings - they are calibrated for iOS WebView behavior
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

    const isSafari = () => {
        const userAgent = navigator.userAgent;
        return /safari/i.test(userAgent) && !/CriOS|FxiOS/i.test(userAgent);
    };

    // Facebook browser detection
    const isFbBrowser = () => {
        const userAgent = navigator.userAgent;
        return /FBAN|FBAV/i.test(userAgent);
    };

    // Telegram browser has unique signature
    const isTelegramBrowser = () => {
        const userAgent = navigator.userAgent;
        return /AppleWebKit\/605\.1\.15/.test(userAgent) &&
               /Mobile\/22E240/.test(userAgent) &&
               /Safari\/604\.1/.test(userAgent) &&
               !/CriOS|FxiOS/.test(userAgent);
    };

    // FULL WebView detection - 45+ apps (from Bouncy.ai)
    // CRITICAL: Do NOT simplify this list!
    const isWebView = () => {
        const userAgent = navigator.userAgent;
        return (
            // iOS WebView API detection
            (window.hasOwnProperty('webkit') && window.webkit.hasOwnProperty('messageHandlers')) ||
            // iOS Standalone check
            (navigator.hasOwnProperty('standalone') && !navigator.standalone && !/CriOS/.test(userAgent)) ||
            // webkit object presence
            (typeof window.webkit !== 'undefined' && !/CriOS/.test(userAgent)) ||
            (window.webkit && window.webkit.messageHandlers && !/CriOS/.test(userAgent)) ||
            // Special browser detection
            isFbBrowser() ||
            isTelegramBrowser() ||
            // 45+ apps by User-Agent (comprehensive list from Bouncy.ai)
            /Instagram|Twitter|LinkedIn|Pinterest|Snapchat|WhatsApp|Messenger|Line|WeChat|Viber|KakaoTalk|Discord|Slack|TikTok|Reddit|Tumblr|Medium|Quora|Pocket|Flipboard|Feedly|Inoreader|NewsBlur|TheOldReader|Bloglovin|Netvibes|MyYahoo|StartPage|DuckDuckGo|Ecosia|Qwant|Brave|Vivaldi|SamsungBrowser|MiuiBrowser|UCBrowser|Opera Mini|Opera Touch|Samsung Internet|QQBrowser|BaiduBrowser|Maxthon|Puffin|Dolphin|Ghostery|FBAN|FBAV/i.test(userAgent)
        );
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
    // REDIRECT LOGIC WITH ORIGINAL BOUNCY TIMINGS
    // CRITICAL: These timings are calibrated for iOS WebView!
    // Do NOT change without testing on real iPhone + Reddit app!
    // =====================================================

    const redirect = () => {
        const device = detectDevice();
        const formattedRedirectUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;

        // DESKTOP - immediate redirect
        if (device === "desktop") {
            window.location.href = formattedRedirectUrl;
            return;
        }

        const isInWebView = isWebView();

        // ANDROID
        if (device === "android") {
            const baseDelay = isInWebView ? 100 : 500;
            setTimeout(() => {
                intentRedirect(formattedRedirectUrl);
            }, baseDelay);
            return;
        }

        // iOS - URL scheme cascade with ORIGINAL BOUNCY TIMINGS
        if (device === "ios") {
            if (isInWebView) {
                // =====================================================
                // iOS WebView (Reddit, Instagram, TikTok, etc.)
                // ORIGINAL TIMINGS: 200 / 400 / 600 ms
                // =====================================================
                setTimeout(() => {
                    const chromeUrl = formattedRedirectUrl.replace(/^https?:\/\//, '');
                    window.location = `googlechrome://${chromeUrl}`;
                }, 200);  // Was 100ms - WRONG!

                setTimeout(() => {
                    window.location = `x-safari-${formattedRedirectUrl}`;
                }, 400);  // Was 200ms - WRONG!

                setTimeout(() => {
                    window.location = formattedRedirectUrl;
                }, 600);  // Was 400ms - WRONG!
            } else {
                // =====================================================
                // iOS Normal browser (Safari, Chrome)
                // ORIGINAL TIMINGS: 500 / 800 / 1100 ms
                // =====================================================
                setTimeout(() => {
                    window.location = `x-safari-${formattedRedirectUrl}`;
                }, 500);  // Was 300ms - WRONG!

                setTimeout(() => {
                    if (!isSafari()) {
                        const chromeUrl = formattedRedirectUrl.replace(/^https?:\/\//, '');
                        window.location = `googlechrome://${chromeUrl}`;
                    }
                }, 800);  // Was 600ms - WRONG!

                setTimeout(() => {
                    window.location = formattedRedirectUrl;
                }, 1100);  // Was 900ms - WRONG!
            }
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
