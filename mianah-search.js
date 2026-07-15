/* Mianah — site-wide product search. Wires the header search button to a live overlay
   that searches prints, furniture, foam and originals (from products.js globals). */
(function () {
  function buildIndex() {
    var idx = [];
    (window.MIANAH_PRODUCTS || []).forEach(function (p) {
      idx.push({ name: p.name, sub: (p.cat || 'Print') + ' · print', img: p.img,
        url: 'mianah-product.html?id=' + p.id, kw: (p.name + ' ' + (p.cat || '') + ' print art').toLowerCase() });
    });
    (window.MIANAH_FURNITURE || []).forEach(function (p) {
      idx.push({ name: p.name + ' — ' + p.finish, sub: (p.type || 'Furniture'), img: p.img,
        url: 'mianah-furniture.html?id=' + p.id, kw: (p.name + ' ' + p.finish + ' ' + (p.type || '') + ' furniture sofa armchair kids').toLowerCase() });
    });
    (window.MIANAH_FOAM || []).forEach(function (p) {
      var img = (p.colours && p.colours[0] && p.colours[0].img) || p.img;
      idx.push({ name: (p.setName || p.name), sub: 'Foam set', img: img,
        url: 'mianah-foam.html?id=' + p.id, kw: ((p.setName || p.name) + ' foam block play set nursery').toLowerCase() });
    });
    (window.MIANAH_ORIGINALS || []).forEach(function (p) {
      idx.push({ name: p.name, sub: 'Original painting', img: p.img,
        url: 'mianah-original.html?id=' + p.id, kw: (p.name + ' original painting one of a kind').toLowerCase() });
    });
    return idx;
  }
  var INDEX = null;
  function esc(s){return String(s==null?'':s).replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});}

  var ov = document.createElement('div');
  ov.id = 'mSearch';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(30,15,40,.5);display:none;z-index:9999;align-items:flex-start;justify-content:center;padding:12vh 16px 20px';
  ov.innerHTML =
    '<div style="background:#fff;border-radius:18px;max-width:600px;width:100%;box-shadow:0 30px 80px -20px rgba(60,30,80,.55);overflow:hidden;font-family:inherit">' +
      '<div style="display:flex;align-items:center;gap:10px;padding:15px 18px;border-bottom:1px solid #efe7f2">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F5379A" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input id="mSearchIn" type="text" placeholder="Search prints, furniture, originals…" autocomplete="off" style="flex:1;border:none;outline:none;font:inherit;font-size:1.05rem;background:none;color:#2C2233">' +
        '<button id="mSearchX" aria-label="Close" style="border:none;background:none;font-size:1.5rem;line-height:1;cursor:pointer;color:#9a8fa6">&times;</button>' +
      '</div>' +
      '<div id="mSearchRes" style="max-height:62vh;overflow:auto;padding:6px 8px"></div>' +
    '</div>';
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  ready(function () {
    document.body.appendChild(ov);
    var input = document.getElementById('mSearchIn');
    var res = document.getElementById('mSearchRes');

    function open() {
      if (!INDEX) INDEX = buildIndex();
      ov.style.display = 'flex';
      input.value = ''; render('');
      setTimeout(function(){ input.focus(); }, 30);
      document.body.style.overflow = 'hidden';
    }
    function close() { ov.style.display = 'none'; document.body.style.overflow = ''; }

    function render(q) {
      q = q.trim().toLowerCase();
      var rowStyle = 'display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;text-decoration:none;color:#2C2233';
      if (!q) {
        res.innerHTML = '<p style="color:#9a8fa6;padding:14px;margin:0;font-size:.92rem">Type to search ' + (INDEX ? INDEX.length : '') + ' products — by name, colour or category.</p>';
        return;
      }
      var terms = q.split(/\s+/);
      var hits = INDEX.filter(function (it) { return terms.every(function(t){ return it.kw.indexOf(t) !== -1; }); }).slice(0, 20);
      if (!hits.length) { res.innerHTML = '<p style="color:#9a8fa6;padding:14px;margin:0">No matches for “' + esc(q) + '”.</p>'; return; }
      res.innerHTML = hits.map(function (it) {
        return '<a href="' + it.url + '" style="' + rowStyle + '" onmouseover="this.style.background=\'#faf4fb\'" onmouseout="this.style.background=\'\'">' +
          '<img src="' + esc(it.img) + '" loading="lazy" style="width:46px;height:46px;object-fit:cover;border-radius:9px;background:#f3eef8;flex:none">' +
          '<span style="min-width:0"><b style="display:block;font-size:.98rem">' + esc(it.name) + '</b>' +
          '<span style="color:#9a8fa6;font-size:.8rem">' + esc(it.sub) + '</span></span></a>';
      }).join('');
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = res.querySelector('a'); if (a) location.href = a.getAttribute('href'); }
    });
    document.getElementById('mSearchX').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'flex') close(); });

    // wire every header search button (they only have aria-label="Search")
    document.querySelectorAll('[aria-label="Search"]').forEach(function (b) {
      b.style.cursor = 'pointer';
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  });
})();
