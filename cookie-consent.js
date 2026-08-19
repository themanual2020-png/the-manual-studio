// PDPA-style cookie/data notice. Shows once until the visitor makes a
// choice; the choice is remembered in localStorage.
(function () {
  var KEY = 'tms_cookie_ack';
  if (localStorage.getItem(KEY)) return;

  var wrap = document.createElement('div');
  wrap.id = 'tms-cookie-banner';
  wrap.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;z-index:5000;' +
    'background:#15140f;color:#f5f4f1;padding:20px 24px;' +
    'font-family:"Prompt",system-ui,sans-serif;' +
    'box-shadow:0 -8px 30px rgba(0,0,0,.25);';

  var t = window.tmsI18n ? window.tmsI18n.t : function () { return ''; };

  wrap.innerHTML =
    '<div style="max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">' +
      '<div style="flex:1;min-width:240px;font-size:13.5px;line-height:1.6;font-weight:300;color:rgba(245,244,241,.85);">' +
        '<span data-i18n="cookie_notice">' + t('cookie_notice') + '</span> ' +
        '<a href="#" id="tms-cookie-more" data-i18n="cookie_more" style="color:#f5f4f1;text-decoration:underline;">' + t('cookie_more') + '</a>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-shrink:0;">' +
        '<button id="tms-cookie-decline" data-i18n="cookie_decline" style="font-family:\'Archivo\',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;background:transparent;color:rgba(245,244,241,.75);border:1px solid rgba(245,244,241,.3);border-radius:999px;padding:11px 20px;cursor:pointer;white-space:nowrap;">' + t('cookie_decline') + '</button>' +
        '<button id="tms-cookie-accept" data-i18n="cookie_accept" style="font-family:\'Archivo\',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;background:#f5f4f1;color:#15140f;border:none;border-radius:999px;padding:11px 22px;cursor:pointer;white-space:nowrap;">' + t('cookie_accept') + '</button>' +
      '</div>' +
    '</div>' +
    '<div id="tms-cookie-details" style="display:none;max-width:1080px;margin:14px auto 0;font-size:12.5px;line-height:1.7;font-weight:300;color:rgba(245,244,241,.65);border-top:1px solid rgba(245,244,241,.14);padding-top:14px;">' +
      '<b data-i18n="cookie_details_label" style="color:rgba(245,244,241,.85);">' + t('cookie_details_label') + '</b> ' +
      '<span data-i18n="cookie_details_text">' + t('cookie_details_text') + '</span>' +
    '</div>';

  document.body.appendChild(wrap);

  function close() {
    wrap.remove();
  }

  document.getElementById('tms-cookie-more').addEventListener('click', function (e) {
    e.preventDefault();
    var details = document.getElementById('tms-cookie-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('tms-cookie-accept').addEventListener('click', function () {
    localStorage.setItem(KEY, 'accepted');
    close();
    document.dispatchEvent(new CustomEvent('tms-consent-changed', { detail: 'accepted' }));
  });

  document.getElementById('tms-cookie-decline').addEventListener('click', function () {
    localStorage.setItem(KEY, 'declined');
    close();
    document.dispatchEvent(new CustomEvent('tms-consent-changed', { detail: 'declined' }));
  });
})();

function tmsHasAnalyticsConsent() {
  return localStorage.getItem('tms_cookie_ack') !== 'declined';
}
