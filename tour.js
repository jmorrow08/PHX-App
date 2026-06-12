/* ================================================================
   PHX APP — tour.js
   Guided Walkthrough Tour Engine
   One file covers all 4 pages: index, app, partner, admin
   ================================================================ */
(function () {
  'use strict';

  var page = window.location.pathname.split('/').pop() || 'index.html';

  /* ── Tour step definitions ───────────────────────────────────── */
  var TOURS = {

    /* ─── PHX LANDING PAGE ─────────────────────────────────────── */
    'index.html': [
      { sel: '#hero',             pos: 'bottom', title: '🏙️ Welcome to PHX App',                desc: 'Phoenix\'s first city culture platform — music, eats, events, fashion, podcasts, barbershops, art, and sports. All of Phoenix, one app. Built on Murkemz\'s network.' },
      { sel: '.ticker-track',     pos: 'bottom', title: '📡 Live City Stats Ticker',             desc: 'This scrolling ticker shows real platform activity — active members, streams today, partner perks redeemed, and events this week. It runs 24/7.' },
      { sel: '#concept',          pos: 'bottom', title: '💡 The PHX Concept',                   desc: 'Phoenix has culture — the problem is it\'s scattered. PHX App is the single OS that connects the city\'s creators, businesses, and residents in one place.' },
      { sel: '#verticals',        pos: 'top',    title: '8️⃣ Eight City Verticals',              desc: 'Music, Eats, Events, Fashion/Drops, Podcasts, Barbershops, Art, and Sports — each is a full category with partner listings, perks, and content.' },
      { sel: '#pass',             pos: 'top',    title: '🎟️ PHX Pass Membership',               desc: 'Explorer ($7/mo), Native ($15/mo), Insider ($29/mo) — city membership tiers that unlock perks at every partner business and creator. Pay once, benefit everywhere.' },
      { sel: '#partner-preview',  pos: 'top',    title: '🏪 Partner Profile Previews',          desc: 'Toggle between Creator, Business, and Event Promoter to see exactly what each partner type sees in their dashboard — real mockup data, not wireframes.' },
      { sel: '#founding-counter', pos: 'top',    title: '🏅 Founding Partner Program',          desc: '50 spots. Free for 90 days in exchange for 3 social posts about PHX App. Keeps the Founding Partner badge permanently after converting to paid. These spots close fast.' },
      { sel: '#approach',         pos: 'top',    title: '🤝 The Partner Pitch',                 desc: 'Five-step approach that Murkemz and team use to sign business partners. Authentic, direct, built on existing relationships in the PHX culture scene.' },
      { sel: '#founder',          pos: 'top',    title: '👤 Murkemz — The Founder',             desc: 'Murkemz brings the credibility. PHX pass holders are his fans and the city\'s culture community. That existing audience is the head start no other platform has.' },
      { sel: '#install',          pos: 'top',    title: '📲 Install as a Native App',           desc: 'PHX App is a PWA — add to home screen on iOS or Android without the App Store. Full push notifications, offline mode, and native feel. Zero install friction.' },
    ],

    /* ─── MEMBER DASHBOARD ─────────────────────────────────────── */
    'app.html': [
      { sel: '.sidebar',         pos: 'right',  title: '🏙️ PHX App Navigation',                desc: 'Ten sections: Home, Discover, Events, Eats, Music, Podcasts, Drops, Cuts, My Pass, and Profile. Everything Phoenix in one sidebar.' },
      { sel: '.pass-chip',       pos: 'right',  title: '🎟️ Your PHX Pass',                    desc: 'Your active membership chip — shows your tier (Explorer/Native/Insider), your member name, and renewal date. This chip is your city key.' },
      { sel: '.topbar',          pos: 'bottom', title: '📍 View Header',                        desc: 'Shows your current section and quick-access buttons. The PHX pulse is always visible at the top of every screen.' },
      { sel: '#v-home',          view: 'home',      pos: 'right', title: '🏠 City Feed — Home',           desc: 'Four activity cards (streams, events, perks redeemed, current streak) plus a live city feed of posts from creators and businesses, and upcoming events.' },
      { sel: '#v-discover',      view: 'discover',  pos: 'right', title: '🔍 Discover',                    desc: 'Eight category tiles — tap any vertical to browse its content. Trending hashtags, featured creators, and new businesses in your area.' },
      { sel: '#v-events',        view: 'events',    pos: 'right', title: '📅 Phoenix Events',              desc: 'All events across the city: venue, date, genre tags, and ticket links. Pass holders get early access windows on select shows — no Ticketmaster needed.' },
      { sel: '#v-eats',          view: 'eats',      pos: 'right', title: '🍽️ Eats + Active Perks',        desc: 'Restaurants on the platform with their current PHX Pass perks. Explorer gets 10% off, Native gets free apps, Insider gets VIP treatment. Show your pass, redeem instantly.' },
      { sel: '#v-music',         view: 'music',     pos: 'right', title: '🎵 PHX Music Player',            desc: 'Full-screen player streaming the PHX music catalog: Murkemz, local artists, exclusive drops. Tracks gated by tier — Insider unlocks everything.' },
      { sel: '.mini-player',     pos: 'top',         title: '🎧 Persistent Player',              desc: 'Music keeps playing as you navigate. The mini player stays pinned to the bottom — artwork, track name, play/pause, and progress bar always visible.' },
      { sel: '#v-podcasts',      view: 'podcasts',  pos: 'right', title: '🎙️ Phoenix Podcasts',           desc: 'Six local podcasts: Murk Report, 602 Sports Talk, Desert Table, Shop Talk, RoRo Sessions, PHX Hustle. All local voices, all in one place.' },
      { sel: '#v-drops',         view: 'drops',     pos: 'right', title: '👗 Fashion Drops',               desc: 'Limited drops from Phoenix fashion brands with live countdown timers. Native+ members get first-access notifications before the public.' },
      { sel: '#v-cuts',          view: 'cuts',      pos: 'right', title: '💈 Book a Barber',               desc: 'Browse partner barbershops, see available time slots, and book with a deposit — all in-app. Confirmation goes to both you and the shop. No ghosting, no no-shows.' },
      { sel: '#v-mypass',        view: 'mypass',    pos: 'right', title: '🪪 My PHX Pass Card',            desc: 'Your digital membership card. Add to Apple Wallet or Google Wallet. Show at partner locations to unlock your tier perks instantly.' },
      { sel: '#v-profile',       view: 'profile',   pos: 'right', title: '👤 Your City Profile',           desc: 'Your member profile with activity bar chart. See which months you were most active, which verticals you engage with most, and track your streak.' },
    ],

    /* ─── PARTNER DASHBOARD ────────────────────────────────────── */
    'partner.html': [
      { sel: '.type-toggle',     pos: 'bottom', title: '🔀 Business / Creator Toggle',          desc: 'The partner dashboard has two modes. Flip this toggle to switch between the Business Partner view (restaurants, shops, barbers) and Creator Partner view (artists, coaches, podcasters).' },
      { sel: '#biz-chip',        pos: 'right',  title: '🏪 Business Partner Identity',          desc: 'Your business chip shows your partner name, tier, and active status. Founding partners get a gold badge that stays permanently even after the free period ends.' },
      { sel: '#v-b-overview',    view: 'b-overview',  pos: 'right', title: '📊 Business Overview — ROI First',  desc: 'The first screen you see: new member visits, perks redeemed, estimated revenue generated, and cost (usually $0 during founding). ROI is shown front and center.' },
      { sel: '#v-b-perks',       view: 'b-perks',     pos: 'right', title: '🎁 Manage Your Perks',             desc: 'Add, edit, or remove perks for each PHX Pass tier. Set exactly what Explorer, Native, and Insider members get when they walk through your door.' },
      { sel: '#v-b-shop',        view: 'b-shop',      pos: 'right', title: '🛍️ Partner Commerce — Sell In-App', desc: 'The full commerce layer. Fashion partners list products. Barbers set their service menu and deposit amounts. Restaurants build their pickup menu. Fitness coaches sell sessions and packages — all managed right here.' },
      { sel: '.shop-type-pills', pos: 'bottom',       title: '🏷️ Vendor Type Switcher',         desc: 'Toggle between Fashion, Barber/Beauty, Restaurant, and Fitness to see how the commerce interface adapts for each business type. Each has a customized order and booking workflow.' },
      { sel: '.shop-tab-bar',    pos: 'bottom',       title: '📋 Products / Orders / Bookings',  desc: 'Three tabs per vendor type: manage your listings, see incoming orders with fulfillment status, and view your booking calendar. A complete mini commerce OS.' },
      { sel: '#v-b-events',      view: 'b-events',    pos: 'right', title: '📅 Events + Co-Promotion',         desc: 'List events at your venue or sponsor events by other creators. Premier and Anchor partners can co-host events with featured placement in the Events feed.' },
      { sel: '#v-b-analytics',   view: 'b-analytics', pos: 'right', title: '📈 Traffic + Demographics',        desc: 'A 30-day traffic line chart and a demographics doughnut showing your customers by PHX Pass tier. Know exactly which member type drives your revenue.' },
      { sel: '#v-b-messages',    view: 'b-messages',  pos: 'right', title: '💬 Member Messages',               desc: 'Receive direct messages from PHX App members — reservation requests, questions, feedback. Respond from the dashboard without giving out personal numbers.' },
      { sel: '#v-b-billing',     view: 'b-billing',   pos: 'right', title: '💳 Billing + Plan Management',     desc: 'See your current plan, billing cycle, and upgrade options. Founding partners see their 90-day free period countdown and conversion date here.' },
      { sel: '#v-c-overview',    view: 'c-overview',  pos: 'right', title: '🎵 Creator Revenue Overview',       desc: 'Switch to Creator mode: fan pass breakdown by tier, total MRR, platform fee deduction, and net revenue. One number matters — what goes into your pocket.' },
      { sel: '#v-c-analytics',   view: 'c-analytics', pos: 'right', title: '📈 Creator Analytics',              desc: 'Stream counts, fan growth, geographic reach, and a 6-month revenue trend chart. Know your best-performing content and where your fans are coming from.' },
      { sel: '#v-c-billing',     view: 'c-billing',   pos: 'right', title: '💳 Creator Plan + Revenue',         desc: 'Creator tier options: free vs Creator Pro. Upgrade to unlock merch integration, fan DMs, event ticketing, and advanced analytics.' },
    ],

    /* ─── CITY ADMIN DASHBOARD ─────────────────────────────────── */
    'admin.html': [
      { sel: '.sidebar',          pos: 'right',  title: '⚙️ PHX City Operations Center',       desc: 'The admin dashboard for Murkemz and Bryce. Full control over every member, partner, event, piece of content, and revenue stream on the platform.' },
      { sel: '.sb-admin-chip',    pos: 'right',  title: '👑 Admins — Murkemz + Bryce',         desc: 'Both founders are listed as co-admins. Every action taken here affects the entire PHX App ecosystem — member management, partner approvals, and revenue reporting.' },
      { sel: '#v-command',        view: 'command',   pos: 'right', title: '🖥️ Command Center — Live Platform',  desc: 'Six live KPIs updating every 3.8 seconds: online members, total streams, platform revenue, active partners, events today, and perks redeemed. The full heartbeat.' },
      { sel: '#v-revenue',        view: 'revenue',   pos: 'right', title: '💰 Revenue OS — 10 Streams',         desc: 'Full P&L table for every revenue stream: PHX Pass tiers, partner subscriptions, ticketing, commerce transactions, and featured placements. Each row shows gross, fee, and net.' },
      { sel: '#v-members',        view: 'members',   pos: 'right', title: '👥 Member Intelligence',              desc: 'Total subscribers by tier, monthly churn rate, new sign-ups, and top geographic markets. The data that shows whether growth is healthy or which tier needs attention.' },
      { sel: '#v-partners',       view: 'partners',  pos: 'right', title: '🤝 Partner Management',               desc: 'Pending applications queue (approve/reject businesses), active partner roster, and Founding Partner compliance tracker — who has posted their 3 social posts.' },
      { sel: '#v-events',         view: 'events',    pos: 'right', title: '📅 Platform Events',                  desc: 'All events across all partner types. Monitor ticket sales, flag capacity issues, feature events on the landing page, and send event-specific push blasts.' },
      { sel: '#v-feed',           view: 'feed',      pos: 'right', title: '📰 City Content Feed',                desc: 'Moderate community posts, pin featured content, remove rule-violating posts. You control what rises to the top of every member\'s feed.' },
      { sel: '#v-social',         view: 'social',    pos: 'right', title: '📡 Social + Promotion',               desc: 'Track Founding Partner social posts for compliance, schedule platform-wide social content, and connect the PHX App\'s own social accounts.' },
      { sel: '#v-push',           view: 'push',      pos: 'right', title: '🔔 Push Notification Center',         desc: 'Send targeted notifications to all members or by tier. 84% average open rate. Use for new partner announcements, drop alerts, and exclusive access windows.' },
      { sel: '#v-verticals',      view: 'verticals', pos: 'right', title: '📊 Vertical Health Scores',           desc: 'A live health bar for all 8 verticals. Music leads at 87%, eats at 74%, events at 68%. Use this to decide where to focus the next partner recruitment push.' },
      { sel: '#v-reports',        view: 'reports',   pos: 'right', title: '📋 P&L + 12-Month Projections',       desc: 'Monthly P&L summary and a Chart.js projection graph showing conservative vs optimistic revenue paths. Conservative hits $250K MRR by Q4\'27.' },
    ],
  };

  /* ── Tour engine ─────────────────────────────────────────────── */
  var steps = TOURS[page] || [];
  if (!steps.length) return;

  var current = 0;
  var canvas, ctx, tooltip, active = false;

  /* Inject CSS */
  var style = document.createElement('style');
  style.textContent = [
    '#tour-canvas{position:fixed;inset:0;z-index:99970;pointer-events:none;display:none}',
    '#tour-tooltip{position:fixed;z-index:99975;background:#0D0D1A;border:1.5px solid rgba(249,115,22,.5);border-radius:16px;padding:1.4rem 1.5rem;width:320px;box-shadow:0 24px 64px rgba(0,0,0,.75);display:none;font-family:\'Inter\',sans-serif}',
    '.tt-step{font-size:.62rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(249,115,22,.65);margin-bottom:.45rem}',
    '.tt-title{font-size:1rem;font-weight:800;color:#F1F1F8;margin-bottom:.45rem;line-height:1.3}',
    '.tt-desc{font-size:.81rem;color:rgba(241,241,248,.62);line-height:1.65;margin-bottom:.9rem}',
    '.tt-progress{display:flex;gap:3px;margin-bottom:.9rem}',
    '.tt-dot{height:3px;border-radius:3px;flex:1;background:rgba(255,255,255,.1);transition:background .2s}',
    '.tt-dot.done{background:#F97316}',
    '.tt-controls{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap}',
    '.tt-btn{padding:.38rem .85rem;border-radius:8px;font-size:.77rem;font-weight:700;cursor:pointer;border:none;transition:all .15s;font-family:inherit}',
    '.tt-btn-prev{background:rgba(255,255,255,.07);color:rgba(241,241,248,.55)}',
    '.tt-btn-prev:hover{background:rgba(255,255,255,.12)}',
    '.tt-btn-next{background:#F97316;color:#07070F;flex:1}',
    '.tt-btn-next:hover{background:#FB923C}',
    '.tt-btn-skip{background:none;border:none;color:rgba(241,241,248,.3);font-size:.7rem;cursor:pointer;margin-left:auto;font-family:inherit;padding:.2rem 0}',
    '.tt-btn-skip:hover{color:rgba(241,241,248,.6)}',
    '#tour-start-btn{background:rgba(249,115,22,.14);color:#F97316;border:1px solid rgba(249,115,22,.3);padding:.38rem .8rem;border-radius:7px;font-size:.77rem;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap;flex-shrink:0}',
    '#tour-start-btn:hover{background:rgba(249,115,22,.25);border-color:rgba(249,115,22,.6)}',
  ].join('');
  document.head.appendChild(style);

  /* Canvas */
  canvas = document.createElement('canvas');
  canvas.id = 'tour-canvas';
  document.body.appendChild(canvas);

  /* Tooltip */
  tooltip = document.createElement('div');
  tooltip.id = 'tour-tooltip';
  document.body.appendChild(tooltip);

  /* Tour button in demo nav */
  var demoInner = document.querySelector('.demo-nav-inner');
  if (demoInner) {
    var startBtn = document.createElement('button');
    startBtn.id = 'tour-start-btn';
    startBtn.textContent = '✦ Tour';
    startBtn.addEventListener('click', startTour);
    demoInner.insertBefore(startBtn, demoInner.querySelector('.demo-nav-close'));
  }

  function startTour() {
    current = 0;
    active = true;
    canvas.style.display = 'block';
    showStep();
  }

  function showStep() {
    var step, el;

    /* Iteratively skip steps whose element doesn't exist in the DOM */
    while (current < steps.length) {
      step = steps[current];
      el = document.querySelector(step.sel);
      if (el) break;
      current++;
    }
    if (current >= steps.length) { endTour(); return; }

    /* Activate the containing view if specified */
    if (step.view && typeof window.showView === 'function') {
      window.showView(step.view);
    }

    /* Wait for DOM to update after view activation, then check real visibility */
    setTimeout(function () {
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        /* Still hidden even after activation — skip this step */
        current++;
        showStep();
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () {
        drawOverlay(el);
        positionTooltip(el, step);
      }, 300);
    }, 120);
  }

  /* Cross-browser rounded rect (replaces ctx.roundRect which is Chrome 99+ only) */
  function drawRoundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y,     x + w, y + r,     r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x,     y + h, x,     y + h - r, r);
    c.lineTo(x,     y + r);
    c.arcTo(x,     y,     x + r, y,         r);
    c.closePath();
  }

  function drawOverlay(el) {
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    var r = el.getBoundingClientRect();
    var pad = 10;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.8)';
    ctx.fillRect(0, 0, W, H);

    var sx = r.left - pad, sy = r.top - pad;
    var sw = r.width + pad * 2, sh = r.height + pad * 2;

    ctx.globalCompositeOperation = 'destination-out';
    drawRoundRect(ctx, sx, sy, sw, sh, 12);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = 'rgba(249,115,22,.6)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, sx, sy, sw, sh, 12);
    ctx.stroke();
  }

  function positionTooltip(el, step) {
    var r = el.getBoundingClientRect();
    var TW = 320, TH = 240, pad = 16;

    tooltip.innerHTML = buildHTML(step);
    tooltip.style.display = 'block';

    var left, top;
    if (step.pos === 'right') {
      left = Math.min(r.right + pad, window.innerWidth - TW - 8);
      top  = Math.max(8, Math.min(r.top, window.innerHeight - TH - 64));
    } else if (step.pos === 'bottom') {
      left = Math.max(8, Math.min(r.left, window.innerWidth - TW - 8));
      top  = r.bottom + pad;
      if (top + TH > window.innerHeight - 64) top = r.top - TH - pad;
    } else {
      left = Math.max(8, Math.min(r.left, window.innerWidth - TW - 8));
      top  = r.top - TH - pad;
      if (top < 8) top = r.bottom + pad;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';

    tooltip.querySelector('.tt-btn-next').addEventListener('click', nextStep);
    var prev = tooltip.querySelector('.tt-btn-prev');
    if (prev) prev.addEventListener('click', prevStep);
    tooltip.querySelector('.tt-btn-skip').addEventListener('click', endTour);
  }

  function buildHTML(step) {
    var dots = steps.map(function(_, i) {
      return '<div class="tt-dot' + (i <= current ? ' done' : '') + '"></div>';
    }).join('');
    var isLast = current === steps.length - 1;
    var prevBtn = current > 0 ? '<button class="tt-btn tt-btn-prev">← Back</button>' : '';
    return (
      '<div class="tt-step">Step ' + (current + 1) + ' / ' + steps.length + '</div>' +
      '<div class="tt-title">' + step.title + '</div>' +
      '<div class="tt-desc">' + step.desc + '</div>' +
      '<div class="tt-progress">' + dots + '</div>' +
      '<div class="tt-controls">' +
        prevBtn +
        '<button class="tt-btn tt-btn-next">' + (isLast ? '🎉 Done' : 'Next →') + '</button>' +
        '<button class="tt-btn-skip">Skip</button>' +
      '</div>'
    );
  }

  function nextStep() {
    if (current < steps.length - 1) { current++; showStep(); } else { endTour(); }
  }
  function prevStep() {
    if (current > 0) { current--; showStep(); }
  }
  function endTour() {
    active = false;
    canvas.style.display = 'none';
    tooltip.style.display = 'none';
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) endTour(); });
  window.addEventListener('resize', function () {
    if (active) { var el = document.querySelector(steps[current].sel); if (el) drawOverlay(el); }
  });

}());
