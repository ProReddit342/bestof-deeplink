// =====================================================
// Deeplink redirect script for iOS/Android
// go.bestonlyfansgirl.com -> opens in Safari WITHOUT dialog
//
// 2026-02-05: RESTORED original Bouncy.ai cascade approach
// The simplified version (single x-safari-) was showing dialogs
// because Cloud Function was too slow (4.4s API calls).
// Now Cloud Function is instant, we can use proper cascade.
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

    const isMobileBrowser = () => {
        const userAgent = navigator.userAgent;
        return /CriOS|FxiOS|chrome.*mobile|firefox.*mobile|opera.*mobile/i.test(userAgent) && !/safari/i.test(userAgent);
    };

    const isFbBrowser = () => {
        const userAgent = navigator.userAgent;
        return /FBAN|FBAV/i.test(userAgent);
    };

    const isTelegramBrowser = () => {
        const userAgent = navigator.userAgent;
        return /AppleWebKit\/605\.1\.15/.test(userAgent) &&
               /Mobile\/22E240/.test(userAgent) &&
               /Safari\/604\.1/.test(userAgent) &&
               !/CriOS|FxiOS/.test(userAgent);
    };

    // WebView detection - 45+ apps
    const isWebView = () => {
        const userAgent = navigator.userAgent;
        return (
            (window.hasOwnProperty('webkit') && window.webkit.hasOwnProperty('messageHandlers')) ||
            (navigator.hasOwnProperty('standalone') && !navigator.standalone && !/CriOS/.test(userAgent)) ||
            (typeof window.webkit !== 'undefined' && !/CriOS/.test(userAgent)) ||
            (window.webkit && window.webkit.messageHandlers && !/CriOS/.test(userAgent)) ||
            isFbBrowser() ||
            isTelegramBrowser() ||
            /Instagram|Twitter|LinkedIn|Pinterest|Snapchat|WhatsApp|Messenger|Line|WeChat|Viber|KakaoTalk|Discord|Slack|TikTok|Reddit|Tumblr|Medium|Quora|Pocket|Flipboard|Feedly|Inoreader|NewsBlur|TheOldReader|Bloglovin|Netvibes|MyYahoo|StartPage|DuckDuckGo|Ecosia|Qwant|Brave|Vivaldi|SamsungBrowser|MiuiBrowser|UCBrowser|Opera Mini|Opera Touch|Samsung Internet|QQBrowser|BaiduBrowser|Maxthon|Puffin|Dolphin|Ghostery/i.test(userAgent)
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
    // REDIRECT LOGIC - ORIGINAL BOUNCY.AI CASCADE APPROACH
    //
    // iOS WebView (Reddit, Instagram, TikTok):
    //   200ms → googlechrome://
    //   400ms → x-safari-
    //   600ms → https:// (fallback)
    //
    // iOS Normal (Safari, Chrome):
    //   500ms → x-safari-
    //   800ms → googlechrome://
    //   1100ms → https:// (fallback)
    //
    // Android:
    //   100ms/500ms → intent://
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
        const baseDelay = isInWebView ? 100 : 500;

        // ANDROID
        if (device === "android") {
            setTimeout(() => {
                intentRedirect(formattedRedirectUrl);
            }, baseDelay);
            return;
        }

        // iOS - CASCADE APPROACH
        if (device === "ios") {
            if (isInWebView) {
                // AGGRESSIVE TIMINGS for WebView (Reddit, Instagram, etc.)
                setTimeout(() => {
                    const chromeUrl = formattedRedirectUrl.replace(/^https?:\/\//, '');
                    window.location = `googlechrome://${chromeUrl}`;
                }, 200);

                setTimeout(() => {
                    window.location = `x-safari-${formattedRedirectUrl}`;
                }, 400);

                setTimeout(() => {
                    window.location = formattedRedirectUrl;
                }, 600);
            } else {
                // STANDARD TIMINGS for normal browsers
                setTimeout(() => {
                    window.location = `x-safari-${formattedRedirectUrl}`;
                }, 500);

                setTimeout(() => {
                    if (!isSafari()) {
                        const chromeUrl = formattedRedirectUrl.replace(/^https?:\/\//, '');
                        window.location = `googlechrome://${chromeUrl}`;
                    }
                }, 800);

                setTimeout(() => {
                    window.location = formattedRedirectUrl;
                }, 1100);
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
