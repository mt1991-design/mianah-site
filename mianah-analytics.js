/* Mianah — analytics + form/newsletter integration. Loaded on every page.
   Events go straight to Supabase (public insert-only). Forms/newsletter go via the
   serverless functions (which also email you / add to Brevo). No cookies, no PII. */
(function () {
  var SUPA = "https://qygxiiawfmsfkrgmpvmm.supabase.co";
  var AKEY = "sb_publishable_3EyP10oxjPHX4jBevXKBPQ_E15w_mCj";
  var FN   = "https://faas-lon1-917a94a7.doserverless.co/api/v1/web/fn-4c454f73-367d-4894-a1da-59e827df7fbe/api";

  function sess() {
    try {
      var s = localStorage.getItem("m_sess");
      if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("m_sess", s); }
      return s;
    } catch (e) { return "anon"; }
  }
  var CC = null;
  function country(cb) {
    try { var c = sessionStorage.getItem("m_cc"); if (c) { CC = c; return cb(c); } } catch (e) {}
    fetch("https://www.cloudflare.com/cdn-cgi/trace").then(function (r) { return r.text(); }).then(function (t) {
      var m = /loc=([A-Z]{2})/.exec(t); CC = m ? m[1] : null;
      try { if (CC) sessionStorage.setItem("m_cc", CC); } catch (e) {}
      cb(CC);
    }).catch(function () { cb(null); });
  }

  function send(type, extra) {
    var body = { type: type, path: location.pathname + location.search, referrer: document.referrer || null, session: sess(), country: CC };
    if (extra) for (var k in extra) body[k] = extra[k];
    try {
      fetch(SUPA + "/rest/v1/events", {
        method: "POST", keepalive: true,
        headers: { apikey: AKEY, Authorization: "Bearer " + AKEY, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (e) {}
  }
  window.mtrack = send;

  // subscribe + contact helpers used by the site's existing buttons
  window.msubscribe = function (email, source) {
    return fetch(FN + "/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, source: source || "footer", country: CC })
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  };
  window.mcontact = function (data) {
    return fetch(FN + "/contact", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  };

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  country(function () {
    send("pageview");
    if (/[?&]order=success/.test(location.search)) send("purchase");
  });

  ready(function () {
    // product_view on any detail page with ?id=
    var id = new URLSearchParams(location.search).get("id");
    if (id && /mianah-(product|furniture|foam|original)\.html/.test(location.pathname)) {
      var nm = (document.querySelector("h1") || {}).textContent || document.title;
      // wait a tick so JS-populated titles are set
      setTimeout(function () {
        nm = (document.querySelector("h1") || {}).textContent || document.title;
        send("product_view", { product_id: id, product_name: (nm || "").trim().slice(0, 120) });
      }, 350);
    }
    // add_to_cart — delegated, works across prints/furniture/foam
    document.body.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest('.btn-add, [onclick*="addItem"], [onclick*="addToBasket"], [onclick*="addF"], [onclick*="addSet"], [onclick*="addSingle"]');
      if (!b) return;
      var scope = b.closest(".card, .fcard, .od-info, .product") || document;
      var nm = (scope.querySelector("h3, h1") || {}).textContent || "";
      send("add_to_cart", { product_id: id || null, product_name: (nm || "").trim().slice(0, 120) });
    }, true);
    // begin_checkout on the cart page
    var co = document.getElementById("checkoutBtn") || document.querySelector('[onclick*="checkout"], [onclick*="pay"]');
    if (co) co.addEventListener("click", function () { send("begin_checkout"); });
  });
})();
