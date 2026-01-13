// =====================================================
// ТЕСТОВАЯ ВЕРСИЯ - для проверки Firebase + прямые ссылки
// go.bestonlyfansgirl.com/slug -> открытие в Safari
// =====================================================

// Prevent page from being cached
window.addEventListener('beforeunload', function() {});

// Global variables
let analyticsSetup = false;
const API_BASE = 'https://bestonlyfansgirl.com/api/v1';

// Function to setup analytics
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

// Get slug from pathname
function getSlugFromPath() {
    const path = window.location.pathname;
    // Remove leading slash and get first segment
    const slug = path.replace(/^\//, '').split('/')[0];
    // Skip if it's a known file
    if (!slug || slug === 'deeplink.html' || slug.includes('.')) {
        return null;
    }
    return slug;
}

// Check if path is a subreddit deeplink (/r/subreddit-slug)
function isSubredditPath() {
    const path = window.location.pathname;
    // Match /r/something or /r/r-something
    return /^\/r\//.test(path);
}

// Get subreddit slug from path (/r/subreddit-slug -> subreddit-slug)
function getSubredditSlugFromPath() {
    const path = window.location.pathname;
    const match = path.match(/^\/r\/(.+)$/);
    return match ? match[1] : null;
}

// Fetch model data from API
async function fetchModelData(slug) {
    try {
        const response = await fetch(`${API_BASE}/models/${slug}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error('Failed to fetch model:', error);
        return null;
    }
}

// Main redirect logic
async function handleRedirectLogic() {
    const urlParams = new URLSearchParams(window.location.search);
    let redirectUrl = urlParams.get("destination");
    let deeplinkId = urlParams.get("id");
    const measurementId = urlParams.get("ga");
    const metaPixelId = urlParams.get("pixel");

    // SUBREDDIT PATH: /r/subreddit-slug -> redirect to backend for UTM handling
    if (!redirectUrl && isSubredditPath()) {
        const subredditSlug = getSubredditSlugFromPath();
        if (subredditSlug) {
            // Redirect to backend subreddit route which will add UTM params
            // and redirect back to Firebase with proper destination
            redirectUrl = `https://bestonlyfansgirl.com/go/r/${subredditSlug}`;
            deeplinkId = `bestonlyfansgirl.com__r_${subredditSlug}`;
        }
    }

    // If no destination in query params, try to get from slug (model)
    if (!redirectUrl) {
        const slug = getSlugFromPath();
        if (slug) {
            const model = await fetchModelData(slug);
            if (model && model.ofUrl) {
                redirectUrl = model.ofUrl;
                deeplinkId = `bestonlyfansgirl.com__${slug}`;
            }
        }
    }

    // Fallback to homepage
    if (!redirectUrl) {
        redirectUrl = "https://bestonlyfansgirl.com";
    }

    // Setup analytics
    setupAnalytics(measurementId, metaPixelId);

    // Device detection
    const detectDevice = () => {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(ua)) return "android";
        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
        return "desktop";
    };

    const isSafari = () => {
        const ua = navigator.userAgent;
        return /safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    };

    const isWebView = () => {
        const ua = navigator.userAgent;
        return (
            (window.hasOwnProperty('webkit') && window.webkit.hasOwnProperty('messageHandlers')) ||
            /Instagram|Twitter|LinkedIn|Pinterest|Snapchat|WhatsApp|Messenger|TikTok|Reddit|Discord|Telegram|FBAN|FBAV/i.test(ua)
        );
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

    // Do the redirect
    const redirect = () => {
        const device = detectDevice();
        const formattedUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;

        if (device === "desktop") {
            window.location.href = formattedUrl;
            return;
        }

        const isInWebView = isWebView();

        if (device === "android") {
            setTimeout(() => intentRedirect(formattedUrl), isInWebView ? 100 : 500);
            return;
        }

        // iOS - external URLs
        if (device === "ios") {
            if (isInWebView) {
                // Aggressive timing for webviews (Reddit, Instagram, etc)
                setTimeout(() => {
                    window.location = `googlechrome://${formattedUrl.replace(/^https?:\/\//, '')}`;
                }, 100);

                setTimeout(() => {
                    window.location = `x-safari-${formattedUrl}`;
                }, 200);

                setTimeout(() => {
                    window.location = formattedUrl;
                }, 400);
            } else {
                // Normal browser
                setTimeout(() => {
                    window.location = `x-safari-${formattedUrl}`;
                }, 300);

                setTimeout(() => {
                    if (!isSafari()) {
                        window.location = `googlechrome://${formattedUrl.replace(/^https?:\/\//, '')}`;
                    }
                }, 600);

                setTimeout(() => {
                    window.location = formattedUrl;
                }, 900);
            }
        }
    };

    redirect();
}

// Run on page load
document.addEventListener("DOMContentLoaded", handleRedirectLogic);
window.addEventListener("pageshow", handleRedirectLogic);

// Cache prevention
if (document.head) {
    const meta1 = document.createElement('meta');
    meta1.httpEquiv = 'Cache-Control';
    meta1.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta1);

    const meta2 = document.createElement('meta');
    meta2.httpEquiv = 'Pragma';
    meta2.content = 'no-cache';
    document.head.appendChild(meta2);
}
