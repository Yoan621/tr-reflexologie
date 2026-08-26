(function () {
  var ROOT = window.TR_ROOT || '';
  var KEY = 'tr-cookie-consent';

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function loadGoogleMaps() {
    document.querySelectorAll('iframe[data-src*="google.com/maps"]').forEach(function (el) {
      if (!el.src) el.src = el.getAttribute('data-src');
    });
  }

  function mapsPlaceholders() {
    document.querySelectorAll('.maps-consent-placeholder').forEach(function (el) {
      el.style.display = 'flex';
    });
  }

  function hideMapsPlaceholders() {
    document.querySelectorAll('.maps-consent-placeholder').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function applyConsent(value) {
    if (value === 'accepted') { loadGoogleMaps(); hideMapsPlaceholders(); }
    else { mapsPlaceholders(); }
  }

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'cookie-banner';
    wrap.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:100;background:#2F3B27;color:#F0EEE3;padding:18px clamp(16px,3vw,32px);display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;box-shadow:0 -4px 18px rgba(0,0,0,.18);font-family:\'Work Sans\',system-ui,sans-serif';
    wrap.innerHTML =
      '<p style="margin:0;font-size:13.5px;line-height:1.6;max-width:640px;color:#EAE4D5">' +
        'Ce site utilise des cookies essentiels au fonctionnement (réservation, espace praticienne) et, si vous l\'acceptez, la carte Google Maps de la section Accès. ' +
        '<a href="' + ROOT + 'confidentialite.html" style="color:#F0EEE3;text-decoration:underline">En savoir plus</a>' +
      '</p>' +
      '<div style="display:flex;gap:10px;flex-shrink:0">' +
        '<button type="button" id="cookie-refuse" style="height:42px;padding:0 18px;border:1px solid rgba(240,238,227,.4);background:transparent;color:#F0EEE3;border-radius:3px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">Refuser</button>' +
        '<button type="button" id="cookie-accept" style="height:42px;padding:0 22px;background:#F6EEE0;color:#2F3B27;border:none;border-radius:3px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">Tout accepter</button>' +
      '</div>';
    document.body.appendChild(wrap);

    document.getElementById('cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      applyConsent('accepted');
      wrap.remove();
    });
    document.getElementById('cookie-refuse').addEventListener('click', function () {
      setConsent('rejected');
      applyConsent('rejected');
      wrap.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var consent = getConsent();
    if (consent) {
      applyConsent(consent);
    } else {
      mapsPlaceholders();
      buildBanner();
    }
  });

  window.TR_openCookieSettings = function () {
    var existing = document.getElementById('cookie-banner');
    if (existing) existing.remove();
    buildBanner();
  };
})();
