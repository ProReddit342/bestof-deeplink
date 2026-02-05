// =====================================================
// Deeplink redirect script v3.0
// go.bestonlyfansgirl.com -> opens destination in Safari
//
// Flow: Cloud Function 302 → deeplink.html?destination=URL
//       → JS reads destination → x-safari-URL (iOS)
// =====================================================

(function() {
    // Guard against double execution
    if (window.__deeplinkExecuted) return;
    window.__deeplinkExecuted = true;

    var urlParams = new URLSearchParams(window.location.search);
    var destination = urlParams.get("destination");

    // If no destination, nothing to do
    if (!destination) {
        window.location.href = "https://bestonlyfansgirl.com";
        return;
    }

    // Ensure https://
    if (!destination.startsWith("http")) {
        destination = "https://" + destination;
    }

    // Detect device
    var userAgent = navigator.userAgent || "";
    var isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isAndroid = /android/i.test(userAgent);

    if (isIOS) {
        // iOS: x-safari- scheme opens URL in Safari
        setTimeout(function() {
            window.location = "x-safari-" + destination;
        }, 100);
    } else if (isAndroid) {
        // Android: Chrome Intent URL
        try {
            var targetUrl = new URL(destination);
            var intentUrl = "intent://" + targetUrl.host + targetUrl.pathname + targetUrl.search +
                "#Intent;scheme=" + targetUrl.protocol.replace(":", "") +
                ";package=com.android.chrome" +
                ";S.browser_fallback_url=" + encodeURIComponent(destination) + ";end";
            setTimeout(function() {
                window.location.href = intentUrl;
            }, 100);
        } catch (e) {
            window.location.href = destination;
        }
    } else {
        // Desktop: direct redirect
        window.location.href = destination;
    }
})();
