/**
 * HTML Leaflet embarqué (CDN) — communication via postMessage / injectJavaScript.
 * Tuiles OpenStreetMap. Pas de clé API.
 * Callout talent ancré dans le DivIcon du pin sélectionné (centré + suit pan/zoom).
 * Affiché seulement après flyTo (tooltip fourni par RN une fois focusComplete).
 */
export const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; background:#e8e2da; }
    .tt-marker { background: transparent !important; border: none !important; }
    .tt-anchor {
      position: absolute;
      left: 0; top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      pointer-events: none;
    }
    .tt-callout {
      width: 292px;
      max-width: 78vw;
      margin-bottom: 8px;
      pointer-events: auto;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .tt-card {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 14px;
      border: 1px solid var(--tt-border, #8C8578);
      background: var(--tt-surface, #FCFBFA);
      box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
    }
    .tt-thumb {
      width: 64px; height: 64px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--tt-surface-strong, #E8E2DA);
      display: flex; align-items: center; justify-content: center;
    }
    .tt-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .tt-thumb svg { width: 22px; height: 22px; fill: var(--tt-muted, #696969); }
    .tt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .tt-title {
      font: 600 13px/17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--tt-ink, #141413);
      letter-spacing: -0.2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tt-row {
      display: flex; align-items: center; gap: 4px;
      font: 500 11px/14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--tt-muted, #696969);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tt-row .tt-ink { color: var(--tt-ink, #141413); }
    .tt-row .tt-orbit { color: var(--tt-orbit, #0B3D91); font-weight: 600; }
    .tt-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 12px; height: 12px; flex-shrink: 0;
    }
    .tt-badge svg { width: 12px; height: 12px; }
    .tt-foot {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      margin-top: 2px;
    }
    .tt-price {
      font: 600 12px/15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--tt-ink, #141413);
      flex-shrink: 0;
    }
    .tt-chevron {
      width: 26px; height: 26px; border-radius: 13px; flex-shrink: 0;
      background: var(--tt-surface-strong, #E8E2DA);
      display: flex; align-items: center; justify-content: center;
      color: var(--tt-ink, #141413);
      font: 700 16px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .tt-caret {
      width: 0; height: 0;
      margin: 0 auto;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 9px solid var(--tt-surface, #FCFBFA);
      filter: drop-shadow(0 1px 0 var(--tt-border, #8C8578));
    }
    .tt-pin {
      width: 40px; height: 48px;
      display: flex; flex-direction: column; align-items: center;
      pointer-events: auto;
    }
    .tt-pin .bubble {
      width: 36px; height: 36px; border-radius: 18px;
      background: #0B3D91; border: 2px solid #FCFBFA;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
      position: relative;
    }
    .tt-pin.selected .bubble {
      width: 42px; height: 42px; border-radius: 21px;
      border-width: 3px;
      /* fill + halo set inline from categoryColor */
    }
    .tt-pin .tip {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 10px solid #0B3D91;
      margin-top: -2px;
    }
    .tt-pin .premium {
      position: absolute; top: -3px; right: -3px;
      width: 14px; height: 14px; border-radius: 7px;
      background: #E11D48; border: 1.5px solid #F3F0EE;
    }
    .tt-pin svg { width: 18px; height: 18px; fill: #fff; }
    .tt-pin.selected svg { width: 20px; height: 20px; }
    .tt-user {
      width: 16px; height: 16px; border-radius: 8px;
      background: #06B6D4; border: 2px solid #fff;
      box-shadow: 0 0 0 4px rgba(6,182,212,.25);
      transform: translate(-50%, -50%);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const ICONS = {
      code: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
      desktop: '<path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/>',
      palette: '<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
      scissors: '<path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-6.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z"/>',
      camera: '<path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-9c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/><circle cx="12" cy="12" r="3.2"/>',
      video: '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>',
      wrench: '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>',
      megaphone: '<path d="M3 11v2h2l6 4V7L5 11H3zm13.5 1c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
      translate: '<path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>',
      pencil: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
      book: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>',
      hammer: '<path d="M2 19.63l1.41 1.41 5.66-5.66L7.25 13.97 2 19.63zM14.5 5.5c-.83-.83-2.17-.83-3 0l-1.41 1.41 3 3 1.41-1.41c.83-.83.83-2.17 0-3zM5.5 9.5L4.09 10.91 7.5 14.32 8.91 12.91 5.5 9.5zM19.5 2.5l-2 2 3 3 2-2c.83-.83.83-2.17 0-3s-2.17-.83-3 0z"/>',
      beauty: '<path d="M12 2C8 2 5 5.5 5 10c0 3 1.5 5 3.5 7.5L12 22l3.5-4.5C17.5 15 19 13 19 10c0-4.5-3-8-7-8zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>',
      food: '<path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>',
      event: '<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>',
      transport: '<path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
      agriculture: '<path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.71c.1.05.2.08.34.08 2.21 0 4-1.79 4-4 0-.34-.05-.67-.13-.98C16.27 14.57 19 12.47 19 10c0-1.1-.9-2-2-2zm-5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.5 6c1.38 0 2.5-1.12 2.5-2.5S16.88 1 15.5 1 13 2.12 13 3.5 14.12 6 15.5 6z"/>',
    };

    function resolveIcon(key) {
      if (!key) return ICONS.code;
      const k = String(key).toLowerCase();
      if (ICONS[k]) return ICONS[k];
      const aliases = {
        developpement: 'code', informatique: 'desktop', design: 'palette',
        marketing: 'megaphone', redaction: 'pencil', 'photo-video': 'video',
        photographie: 'camera', evenementiel: 'event', bricolage: 'hammer',
        cuisine: 'food', beaute: 'beauty', coiffure: 'beauty',
        formation: 'book', couture: 'scissors', reparation: 'wrench',
        traduction: 'translate', artisanat: 'hammer',
      };
      return ICONS[aliases[k] || 'code'];
    }

    function post(msg) {
      const data = JSON.stringify(msg);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(data);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    }

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function safeUrl(u) {
      if (!u || typeof u !== 'string') return '';
      if (u.indexOf('https://') === 0 || u.indexOf('http://') === 0) return u;
      return '';
    }

    function isCalloutTarget(el) {
      if (!el) return false;
      if (el.getAttribute && el.getAttribute('data-tt-callout') === '1') return true;
      if (el.closest) return !!el.closest('[data-tt-callout="1"]');
      return false;
    }

    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([12.1348, 15.0557], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OSM',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    let markerById = {};
    let userMarker = null;
    let orbitColor = '#0B3D91';
    let theme = {
      surface: '#FCFBFA',
      surfaceStrong: '#E8E2DA',
      ink: '#141413',
      muted: '#696969',
      border: '#8C8578',
      orbit: '#0B3D91',
      rating: '#F5C400',
      info: '#3860BE',
    };
    let viewPadding = { top: 0, right: 0, bottom: 0, left: 0 };
    /** Monotonic token so superseded flyTo animations never emit focusComplete. */
    let focusGen = 0;

    function applyTheme(t) {
      if (!t) return;
      theme = {
        surface: t.surface || theme.surface,
        surfaceStrong: t.surfaceStrong || theme.surfaceStrong,
        ink: t.ink || theme.ink,
        muted: t.muted || theme.muted,
        border: t.border || theme.border,
        orbit: t.orbit || orbitColor || theme.orbit,
        rating: t.rating || theme.rating,
        info: t.info || theme.info,
      };
      if (t.orbit) orbitColor = t.orbit;
      var root = document.documentElement;
      root.style.setProperty('--tt-surface', theme.surface);
      root.style.setProperty('--tt-surface-strong', theme.surfaceStrong);
      root.style.setProperty('--tt-ink', theme.ink);
      root.style.setProperty('--tt-muted', theme.muted);
      root.style.setProperty('--tt-border', theme.border);
      root.style.setProperty('--tt-orbit', theme.orbit);
    }

    function hexToRgba(hex, alpha) {
      var h = String(hex || '').replace('#', '');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length !== 6) return 'rgba(11,61,145,' + alpha + ')';
      var r = parseInt(h.slice(0, 2), 16);
      var g = parseInt(h.slice(2, 4), 16);
      var b = parseInt(h.slice(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function makeCallout(m) {
      var tip = m.tooltip;
      if (!tip) return '';
      var photo = safeUrl(tip.photoUrl);
      var thumb = photo
        ? '<img src="' + esc(photo) + '" alt="" />'
        : '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' + resolveIcon(m.categoryIcon) + '</svg>';
      var verified = tip.isVerified
        ? '<span class="tt-badge" title="Vérifié"><svg viewBox="0 0 24 24" fill="' + esc(theme.info) + '"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></span>'
        : '';
      var rating = tip.ratingLabel
        ? '<span class="tt-ink">★ ' + esc(tip.ratingLabel) + '</span>'
        : '';
      var provider = tip.providerName ? esc(tip.providerName) : '';
      var metaBits = [];
      if (provider) metaBits.push('<span>' + provider + '</span>');
      if (verified) metaBits.push(verified);
      var meta = metaBits.length
        ? '<div class="tt-row">' + metaBits.join(' ') + '</div>'
        : '';
      var footLeft = rating
        ? '<div class="tt-row">' + rating + (tip.categoryLabel ? ' · ' + esc(tip.categoryLabel) : '') + '</div>'
        : (tip.categoryLabel ? '<div class="tt-row">' + esc(tip.categoryLabel) + '</div>' : '<div></div>');
      var price = tip.priceLabel
        ? '<div class="tt-price">' + esc(tip.priceLabel) + '</div>'
        : '';
      return (
        '<div class="tt-callout" role="button" data-tt-callout="1">' +
          '<div class="tt-card">' +
            '<div class="tt-thumb">' + thumb + '</div>' +
            '<div class="tt-body">' +
              '<div class="tt-title">' + esc(tip.title || '') + '</div>' +
              meta +
              '<div class="tt-foot">' + footLeft + price + '</div>' +
            '</div>' +
            '<div class="tt-chevron">›</div>' +
          '</div>' +
          '<div class="tt-caret"></div>' +
        '</div>'
      );
    }

    function makeIcon(m) {
      const selected = !!m.selected;
      const svgPath = resolveIcon(m.categoryIcon);
      const pinColor = m.categoryColor || orbitColor || '#0B3D91';
      const premium = m.isPremium ? '<div class="premium"></div>' : '';
      const halo = selected
        ? 'box-shadow:0 0 0 8px ' + hexToRgba(pinColor, 0.2) + ',0 3px 8px rgba(0,0,0,.28);'
        : '';
      // Callout only when RN passes tooltip (after fly completes).
      const callout = selected && m.tooltip ? makeCallout(m) : '';
      const html =
        '<div class="tt-anchor">' +
          callout +
          '<div class="tt-pin' + (selected ? ' selected' : '') + '">' +
            '<div class="bubble" style="background:' + pinColor + ';' + halo + '">' +
              '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' + svgPath + '</svg>' +
              premium +
            '</div>' +
            '<div class="tip" style="border-top-color:' + pinColor + '"></div>' +
          '</div>' +
        '</div>';
      return L.divIcon({
        className: 'tt-marker',
        html: html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    }

    function flyToPadded(lat, lng, zoom, focusId) {
      var z = zoom == null ? map.getZoom() : zoom;
      var size = map.getSize();
      var pad = viewPadding;
      var usableW = Math.max(40, size.x - (pad.left || 0) - (pad.right || 0));
      var usableH = Math.max(40, size.y - (pad.top || 0) - (pad.bottom || 0));
      // True visual center of the usable map (above sheet, below search/chips).
      var desiredX = (pad.left || 0) + usableW / 2;
      var desiredY = (pad.top || 0) + usableH / 2;
      var target = L.latLng(lat, lng);
      var projected = map.project(target, z);
      var centerPoint = L.point(
        projected.x - (desiredX - size.x / 2),
        projected.y - (desiredY - size.y / 2)
      );
      var center = map.unproject(centerPoint, z);
      var gen = ++focusGen;
      var duration = 0.55;
      try { map.stop(); } catch (e) {}
      map.flyTo(center, z, { duration: duration });
      var settled = false;
      function finish() {
        if (settled || gen !== focusGen) return;
        settled = true;
        map.off('moveend', onMoveEnd);
        post({ type: 'focusComplete', id: focusId || null, gen: gen });
      }
      function onMoveEnd() { finish(); }
      map.once('moveend', onMoveEnd);
      // Fallback if already at target (Leaflet may skip animation / moveend).
      setTimeout(finish, Math.round(duration * 1000) + 120);
    }

    /** Fit map to a ~km radius bbox around center (GPS-off overview). */
    function fitRadiusKm(lat, lng, km) {
      var radius = km > 0 ? km : 100;
      var dLat = radius / 111.32;
      var cosLat = Math.cos(lat * Math.PI / 180);
      var dLng = radius / (111.32 * Math.max(0.2, Math.abs(cosLat)));
      var bounds = L.latLngBounds(
        [lat - dLat, lng - dLng],
        [lat + dLat, lng + dLng]
      );
      var pad = viewPadding;
      try { map.stop(); } catch (e) {}
      map.fitBounds(bounds, {
        paddingTopLeft: L.point(pad.left || 0, pad.top || 0),
        paddingBottomRight: L.point(pad.right || 0, pad.bottom || 0),
        maxZoom: 12,
        animate: false,
      });
    }

    function setMarkers(list) {
      markersLayer.clearLayers();
      markerById = {};
      (list || []).forEach(function (m) {
        if (m.lat == null || m.lng == null) return;
        const marker = L.marker([m.lat, m.lng], {
          icon: makeIcon(m),
          zIndexOffset: m.selected ? 2000 : 0,
        });
        marker.on('click', function (e) {
          var orig = e && e.originalEvent;
          var target = orig && (orig.target || orig.srcElement);
          if (isCalloutTarget(target)) {
            if (orig && orig.stopPropagation) orig.stopPropagation();
            post({ type: 'tooltipPress', id: m.id });
            return;
          }
          post({ type: 'markerPress', id: m.id });
        });
        marker.addTo(markersLayer);
        markerById[m.id] = marker;
      });
    }

    function setUserLocation(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
        return;
      }
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: '<div class="tt-user"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map);
    }

    function handleMessage(raw) {
      let msg;
      try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
      if (!msg || !msg.type) return;
      if (msg.orbitColor) orbitColor = msg.orbitColor;
      if (msg.theme) applyTheme(msg.theme);
      switch (msg.type) {
        case 'init':
          if (msg.orbitColor) orbitColor = msg.orbitColor;
          if (msg.theme) applyTheme(msg.theme);
          if (msg.padding) {
            viewPadding = {
              top: msg.padding.top || 0,
              right: msg.padding.right || 0,
              bottom: msg.padding.bottom || 0,
              left: msg.padding.left || 0,
            };
          }
          if (msg.center && msg.fitRadiusKm) {
            fitRadiusKm(msg.center.lat, msg.center.lng, msg.fitRadiusKm);
          } else if (msg.center) {
            map.setView([msg.center.lat, msg.center.lng], msg.zoom || 12);
          }
          if (msg.markers) setMarkers(msg.markers);
          if (msg.user) setUserLocation(msg.user.lat, msg.user.lng);
          break;
        case 'setMarkers':
          setMarkers(msg.markers || []);
          break;
        case 'flyTo':
          flyToPadded(msg.lat, msg.lng, msg.zoom != null ? msg.zoom : 17, msg.focusId);
          break;
        case 'setView':
          map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom());
          break;
        case 'fitRadiusKm':
          if (msg.lat != null && msg.lng != null) {
            fitRadiusKm(msg.lat, msg.lng, msg.km);
          }
          break;
        case 'setUserLocation':
          setUserLocation(msg.lat, msg.lng);
          break;
        case 'setPadding':
          viewPadding = {
            top: msg.top || 0,
            right: msg.right || 0,
            bottom: msg.bottom || 0,
            left: msg.left || 0,
          };
          break;
        case 'setTheme':
          applyTheme(msg.theme);
          break;
      }
    }

    // Direct inject path (preferred) + MessageEvent for Android/iOS WebView quirks
    window.__TT_HANDLE__ = handleMessage;
    document.addEventListener('message', function (e) { handleMessage(e.data); });
    window.addEventListener('message', function (e) { handleMessage(e.data); });

    function postCamera() {
      try {
        var c = map.getCenter();
        post({
          type: 'camera',
          lat: c.lat,
          lng: c.lng,
          zoom: map.getZoom(),
        });
      } catch (e) {}
    }

    map.on('moveend', postCamera);
    map.on('zoomend', postCamera);

    map.whenReady(function () {
      post({ type: 'ready' });
      postCamera();
    });
  </script>
</body>
</html>
`;
