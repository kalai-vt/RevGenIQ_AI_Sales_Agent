/*!
 * RevGenIQ AI — embeddable chat widget loader.
 *
 * Usage (on any client site, before </body>):
 *   <script src="https://<your-revgeniq-backend>/widget/v1/loader.js"
 *           data-widget-key="YOUR-WIDGET-KEY"
 *           async></script>
 *
 * Self-contained: reads its own <script> tag for the API base URL and
 * widget key, so the same file works unmodified for every tenant and
 * every environment (local/staging/prod).
 */
(function () {
  "use strict";

  var CURRENT_SCRIPT = document.currentScript;
  if (!CURRENT_SCRIPT) return;

  var WIDGET_KEY = CURRENT_SCRIPT.getAttribute("data-widget-key");
  if (!WIDGET_KEY) {
    console.error("[RevGenIQ widget] missing required data-widget-key attribute");
    return;
  }

  var API_BASE = new URL(CURRENT_SCRIPT.src).origin;
  var VISITOR_KEY = "revgeniq_visitor_id";
  var SESSION_KEY = "revgeniq_session_" + WIDGET_KEY;
  // Short-lived widget session token from POST /init — kept in memory only
  // (re-fetched on every page load) rather than the raw widget_key being
  // resent on every /chat and /lead call from here on.
  var AUTH_TOKEN = null;

  function authHeaders() {
    return AUTH_TOKEN ? { "Authorization": "Bearer " + AUTH_TOKEN } : {};
  }

  // Every CTA the AI returns carries a machine-readable `action` code (see
  // response_formatter/persona on the backend). This is the single place the
  // frontend decides what each code actually *does* — a button is never just
  // decorative text.
  var FORM_FIELD_DEFS = {
    name:         { label: "Full Name",  type: "text",  required: true },
    email:        { label: "Email",      type: "email", required: true },
    phone:        { label: "Phone",      type: "tel",   required: false },
    company_name: { label: "Company",    type: "text",  required: false },
    country:      { label: "Country",    type: "text",  required: false },
    requirement:  { label: "How can we help?", type: "textarea", required: false },
    quantity:     { label: "Quantity",   type: "text",  required: false },
  };

  var FORM_DEFS = {
    OPEN_QUOTE_FORM:   { formType: "quote",   fields: ["name", "company_name", "email", "phone", "country", "requirement", "quantity"] },
    OPEN_DEMO_FORM:    { formType: "demo",    fields: ["name", "company_name", "email", "phone", "requirement"] },
    OPEN_CONTACT_FORM: { formType: "contact", fields: ["name", "email", "phone", "requirement"] },
  };

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = "v_" + uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function getSessionToken() {
    return localStorage.getItem(SESSION_KEY) || null;
  }

  function setSessionToken(token) {
    if (token) localStorage.setItem(SESSION_KEY, token);
  }

  var VISITOR_ID = getVisitorId();

  // ── DOM setup (Shadow DOM keeps host-page CSS from leaking in or out) ───────
  var host = document.createElement("div");
  host.id = "revgeniq-widget-host";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent =
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    ".rg-bubble{position:fixed;bottom:24px;width:60px;height:60px;border-radius:50%;background:var(--rg-primary);" +
    "background:linear-gradient(135deg,var(--rg-primary),color-mix(in srgb,var(--rg-primary),#000 22%));" +
    "border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "z-index:2147483000;transition:transform .15s ease;animation:rg-bubble-glow 2.6s ease-in-out infinite}" +
    "@keyframes rg-bubble-glow{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.22),0 0 0 0 rgba(255,255,255,0)}" +
    "50%{box-shadow:0 8px 24px rgba(0,0,0,.22),0 0 0 8px rgba(255,255,255,.1)}}" +
    ".rg-bubble:hover{transform:scale(1.06)}" +
    ".rg-bubble.right{right:24px}.rg-bubble.left{left:24px}" +
    // ── Hover tooltip on the launcher bubble itself — a lightweight nudge
    // for visitors who never see (or already dismissed) the auto-teaser.
    ".rg-bubble-tip{position:fixed;bottom:34px;background:#1f2937;color:#fff;font-size:12.5px;" +
    "font-weight:600;padding:8px 12px;border-radius:8px;white-space:nowrap;opacity:0;" +
    "transform:translateY(4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;" +
    "z-index:2147482998;box-shadow:0 6px 16px rgba(0,0,0,.2)}" +
    ".rg-bubble-tip.show{opacity:1;transform:translateY(0)}" +
    ".rg-bubble-tip.right{right:92px}.rg-bubble-tip.left{left:92px}" +
    ".rg-bubble-tip:after{content:'';position:absolute;top:50%;margin-top:-5px;width:0;height:0;" +
    "border-top:5px solid transparent;border-bottom:5px solid transparent}" +
    ".rg-bubble-tip.right:after{right:-5px;border-left:5px solid #1f2937}" +
    ".rg-bubble-tip.left:after{left:-5px;border-right:5px solid #1f2937}" +
    // ── Proactive teaser bubble — shown near the launcher before the visitor
    // has opened the chat, so they know a live AI agent is actually there.
    ".rg-teaser{position:fixed;bottom:24px;width:260px;max-width:calc(100vw - 116px);background:#fff;" +
    "border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.2);padding:14px;" +
    "z-index:2147482999;opacity:0;pointer-events:none;" +
    "transition:opacity .2s ease,transform .2s ease;cursor:pointer}" +
    ".rg-teaser.open{opacity:1;pointer-events:auto}" +
    ".rg-teaser.right{right:100px;transform:translateX(10px) scale(.97)}" +
    ".rg-teaser.right.open{transform:translateX(0) scale(1)}" +
    ".rg-teaser.left{left:100px;transform:translateX(-10px) scale(.97)}" +
    ".rg-teaser.left.open{transform:translateX(0) scale(1)}" +
    // Tail anchoring the card straight onto the launcher bubble beside it.
    ".rg-teaser:after{content:'';position:absolute;top:50%;margin-top:-7px;width:14px;height:14px;" +
    "background:#fff;transform:rotate(45deg);border-radius:2px}" +
    ".rg-teaser.right:after{right:-6px}.rg-teaser.left:after{left:-6px}" +
    ".rg-teaser-text{min-width:0}" +
    ".rg-teaser-title{display:flex;align-items:center;gap:5px;font-weight:700;font-size:13px;color:#111827;margin:0}" +
    ".rg-teaser-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;" +
    "box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:rg-pulse 2s infinite}" +
    "@keyframes rg-pulse{70%{box-shadow:0 0 0 5px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}" +
    ".rg-teaser-sub{font-size:12.5px;color:#6b7280;margin:3px 0 0;line-height:1.4;" +
    "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".rg-teaser-close{position:absolute;top:-8px;left:-8px;width:22px;height:22px;border-radius:50%;background:#1f2937;" +
    "color:#fff;border:none;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 2px 6px rgba(0,0,0,.25)}" +
    ".rg-panel{position:fixed;bottom:96px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 140px);" +
    "background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;" +
    "overflow:hidden;z-index:2147483000;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}" +
    ".rg-panel.right{right:24px}.rg-panel.left{left:24px}" +
    ".rg-panel.open{opacity:1;transform:translateY(0);pointer-events:auto}" +
    ".rg-header{background:var(--rg-primary);color:var(--rg-text-on-primary);padding:16px;display:flex;align-items:center;gap:10px}" +
    ".rg-header-title{font-weight:700;font-size:15px;margin:0}" +
    ".rg-header-sub{font-size:12px;opacity:.85;margin:0}" +
    ".rg-close{margin-left:auto;background:transparent;border:none;color:inherit;cursor:pointer;font-size:20px;line-height:1;opacity:.85}" +
    ".rg-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--rg-secondary,#f8fafc)}" +
    ".rg-msg{max-width:80%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}" +
    ".rg-msg.user{align-self:flex-end;background:var(--rg-primary);color:var(--rg-text-on-primary);border-bottom-right-radius:4px}" +
    ".rg-msg.assistant{align-self:flex-start;background:#fff;color:var(--rg-text,#111827);border:1px solid #e5e7eb;border-bottom-left-radius:4px}" +
    ".rg-msg.typing{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;color:#9ca3af;font-style:italic}" +
    ".rg-actions{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:90%}" +
    ".rg-cards{display:flex;flex-direction:column;gap:8px;align-self:flex-start;max-width:90%;width:100%}" +
    ".rg-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px 13px;font-size:13px;position:relative}" +
    ".rg-card-title{font-weight:700;color:var(--rg-text,#111827);margin-bottom:2px}" +
    ".rg-card-body{color:var(--rg-text,#111827);opacity:.85;line-height:1.4}" +
    ".rg-card-extra{color:#6b7280;font-size:11.5px;margin-top:4px}" +
    ".rg-card-badge{position:absolute;top:-9px;right:10px;background:var(--rg-primary);color:var(--rg-text-on-primary);" +
    "font-size:10px;font-weight:700;padding:2px 9px;border-radius:999px;box-shadow:0 2px 4px rgba(0,0,0,.15)}" +
    ".rg-card-image{width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block}" +
    // ── Follow-up quick-reply chips (from the "suggestions" field) — lighter
    // than the primary action buttons since these are exploratory, not CTAs.
    ".rg-suggestions{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:90%}" +
    ".rg-suggestion-chip{border:1px solid #e5e7eb;color:var(--rg-text,#111827);background:#fff;border-radius:999px;" +
    "padding:6px 12px;font-size:12.5px;cursor:pointer;opacity:.85}" +
    ".rg-suggestion-chip:hover{opacity:1;border-color:var(--rg-primary);color:var(--rg-primary)}" +
    // ── Comparison table (from the "table" field) ───────────────────────────
    ".rg-table-wrap{align-self:flex-start;max-width:90%;width:100%;overflow-x:auto;border:1px solid #e5e7eb;border-radius:12px}" +
    ".rg-table{border-collapse:collapse;width:100%;font-size:12.5px}" +
    ".rg-table th{background:var(--rg-secondary,#f0fdf4);color:var(--rg-text,#111827);font-weight:700;" +
    "text-align:left;padding:8px 12px;white-space:nowrap}" +
    ".rg-table td{padding:8px 12px;border-top:1px solid #e5e7eb;color:var(--rg-text,#111827);white-space:nowrap}" +
    ".rg-card-contact{display:flex;align-items:center;gap:10px}" +
    ".rg-card-icon{width:28px;height:28px;border-radius:50%;background:var(--rg-secondary,#f0fdf4);color:var(--rg-primary);" +
    "display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px}" +
    ".rg-card-label{font-size:11px;color:#9ca3af}" +
    ".rg-card-value{font-weight:600;color:var(--rg-primary);text-decoration:none}" +
    "a.rg-card-value:hover{text-decoration:underline}" +
    ".rg-action-btn{border:1px solid var(--rg-primary);color:var(--rg-primary);background:#fff;border-radius:999px;" +
    "padding:6px 12px;font-size:12.5px;cursor:pointer}" +
    ".rg-action-btn:hover{background:var(--rg-primary);color:var(--rg-text-on-primary)}" +
    ".rg-inputrow{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;background:#fff}" +
    ".rg-input{flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;resize:none;outline:none;max-height:80px}" +
    ".rg-input:focus{border-color:var(--rg-primary)}" +
    ".rg-send{background:var(--rg-primary);color:var(--rg-text-on-primary);border:none;border-radius:10px;width:40px;" +
    "cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}" +
    ".rg-send:disabled{opacity:.5;cursor:not-allowed}" +
    ".rg-branding{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10.5px;color:#9ca3af;padding:5px 0 9px}" +
    ".rg-branding img{height:16px;width:auto;display:block}" +
    // ── Modal form ──────────────────────────────────────────────────────────
    ".rg-modal-overlay{position:absolute;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;" +
    "justify-content:center;z-index:2147483001;opacity:0;pointer-events:none;transition:opacity .15s ease;padding:16px}" +
    ".rg-modal-overlay.open{opacity:1;pointer-events:auto}" +
    ".rg-modal{background:#fff;border-radius:14px;width:100%;max-height:100%;overflow-y:auto;padding:20px;" +
    "box-shadow:0 12px 32px rgba(0,0,0,.3)}" +
    ".rg-modal-title{font-size:15px;font-weight:700;color:#111827;margin:0 0 4px}" +
    ".rg-modal-sub{font-size:12px;color:#6b7280;margin:0 0 14px}" +
    ".rg-field{margin-bottom:10px}" +
    ".rg-field label{display:block;font-size:11.5px;font-weight:600;color:#374151;margin-bottom:4px}" +
    ".rg-field input,.rg-field textarea{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;" +
    "font-size:13px;outline:none;resize:none;font-family:inherit}" +
    ".rg-field input:focus,.rg-field textarea:focus{border-color:var(--rg-primary)}" +
    ".rg-field .rg-err{color:#ef4444;font-size:10.5px;margin-top:2px;display:none}" +
    ".rg-field.rg-invalid input,.rg-field.rg-invalid textarea{border-color:#ef4444}" +
    ".rg-field.rg-invalid .rg-err{display:block}" +
    ".rg-modal-actions{display:flex;gap:8px;margin-top:14px}" +
    ".rg-btn-primary{flex:1;background:var(--rg-primary);color:var(--rg-text-on-primary);border:none;" +
    "border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer}" +
    ".rg-btn-primary:disabled{opacity:.6;cursor:not-allowed}" +
    ".rg-btn-secondary{background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:10px 14px;" +
    "font-size:13px;cursor:pointer}" +
    ".rg-modal-error{color:#ef4444;font-size:12px;margin-top:8px;display:none}" +
    ".rg-modal-success{text-align:center;padding:20px 4px}" +
    ".rg-modal-success svg{margin-bottom:8px}";
  root.appendChild(style);

  var bubble = document.createElement("button");
  bubble.className = "rg-bubble right";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML =
    '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="12" cy="2.6" r="1.1" fill="#fff"/>' +
    '<line x1="12" y1="3.6" x2="12" y2="5.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>' +
    '<rect x="3.6" y="10" width="2.1" height="4.2" rx="1" fill="#fff"/>' +
    '<rect x="18.3" y="10" width="2.1" height="4.2" rx="1" fill="#fff"/>' +
    '<rect x="5.4" y="6" width="13.2" height="11.4" rx="5.2" fill="#fff"/>' +
    '<rect x="8.2" y="10.6" width="7.6" height="3.6" rx="1.8" style="fill:var(--rg-primary)"/>' +
    '<circle cx="10.3" cy="12.4" r="0.85" fill="#fff"/>' +
    '<circle cx="13.7" cy="12.4" r="0.85" fill="#fff"/></svg>';
  root.appendChild(bubble);

  var bubbleTip = document.createElement("div");
  bubbleTip.className = "rg-bubble-tip right";
  bubbleTip.textContent = "Chat with AI Agent";
  root.appendChild(bubbleTip);

  var teaser = document.createElement("div");
  teaser.className = "rg-teaser right";
  teaser.innerHTML =
    '<button class="rg-teaser-close" aria-label="Dismiss">&times;</button>' +
    '<div class="rg-teaser-text">' +
    '  <p class="rg-teaser-title"><span class="rg-teaser-dot"></span>We\'re Online</p>' +
    '  <p class="rg-teaser-sub" data-el="teaserSub">How can I help you today?</p>' +
    "</div>";
  root.appendChild(teaser);

  var panel = document.createElement("div");
  panel.className = "rg-panel right";
  panel.innerHTML =
    '<div class="rg-header">' +
    '  <div>' +
    '    <p class="rg-header-title" data-el="title">AI Assistant</p>' +
    '    <p class="rg-header-sub" data-el="subtitle">Online now</p>' +
    "  </div>" +
    '  <button class="rg-close" aria-label="Close chat">&times;</button>' +
    "</div>" +
    '<div class="rg-messages" data-el="messages"></div>' +
    '<div class="rg-inputrow">' +
    '  <textarea class="rg-input" data-el="input" rows="1" placeholder="Type a message..."></textarea>' +
    '  <button class="rg-send" data-el="send" aria-label="Send message">' +
    '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '      <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" fill="#fff"/></svg>' +
    "  </button>" +
    "</div>" +
    '<p class="rg-branding" data-el="branding">Powered by <img src="' + API_BASE + '/widget/v1/branding-logo.png" alt="RevGenIQ AI" /></p>' +
    '<div class="rg-modal-overlay" data-el="modalOverlay"><div class="rg-modal" data-el="modalBox"></div></div>';
  root.appendChild(panel);

  var els = {
    title: panel.querySelector('[data-el="title"]'),
    subtitle: panel.querySelector('[data-el="subtitle"]'),
    messages: panel.querySelector('[data-el="messages"]'),
    input: panel.querySelector('[data-el="input"]'),
    send: panel.querySelector('[data-el="send"]'),
    branding: panel.querySelector('[data-el="branding"]'),
    close: panel.querySelector(".rg-close"),
    modalOverlay: panel.querySelector('[data-el="modalOverlay"]'),
    modalBox: panel.querySelector('[data-el="modalBox"]'),
    teaserSub: teaser.querySelector('[data-el="teaserSub"]'),
    teaserClose: teaser.querySelector(".rg-teaser-close"),
  };

  var isOpen = false;
  var hasGreeted = false;
  var config = null;
  // In-memory only (this page load) — the backend decides how much of this
  // to actually use per the tenant's enable_memory/memory_window settings.
  var historyLog = [];

  function applyConfig(cfg) {
    config = cfg;
    var side = cfg.position && cfg.position.indexOf("left") !== -1 ? "left" : "right";
    bubble.className = "rg-bubble " + side;
    panel.className = "rg-panel " + side;
    teaser.className = "rg-teaser " + side;
    bubbleTip.className = "rg-bubble-tip " + side;
    bubbleTip.textContent = "Chat with " + (cfg.agent_name || "AI Agent");
    root.host.style.setProperty("--rg-primary", cfg.primary_color || "#10B981");
    root.host.style.setProperty("--rg-secondary", cfg.secondary_color || "#F0FDF4");
    root.host.style.setProperty("--rg-text", cfg.text_color || "#111827");
    root.host.style.setProperty("--rg-text-on-primary", "#ffffff");
    els.title.textContent = cfg.agent_name || cfg.company_name || "AI Assistant";
    els.subtitle.textContent = cfg.company_name ? "Ask us anything" : "Online now";
    els.input.placeholder = cfg.placeholder_text || "Type a message...";
    if (cfg.show_branding === false) els.branding.style.display = "none";
    els.teaserSub.textContent = cfg.welcome_message || "How can I help you today?";

    maybeShowTeaser();
  }

  function addMessage(role, text) {
    var div = document.createElement("div");
    div.className = "rg-msg " + role;
    div.textContent = text;
    els.messages.appendChild(div);
    els.messages.scrollTop = els.messages.scrollHeight;
    return div;
  }

  var CONTACT_ICON = {
    email: "✉", phone: "☎", whatsapp: "☎", address: "⌂", hours: "⏰",
  };

  function addCards(cards) {
    if (!cards || !cards.length) return;
    var wrap = document.createElement("div");
    wrap.className = "rg-cards";
    cards.forEach(function (c) {
      var card = document.createElement("div");
      card.className = "rg-card";
      if (c.badge) card.appendChild(el("div", { class: "rg-card-badge" }, c.badge));

      // Contact-info cards ({type, label, value}) get compact icon+link
      // treatment; everything else (product/certification/stat/faq cards)
      // renders generically from whichever fields are actually present —
      // the backend's card "shape" varies by response_type, so this reads
      // structurally instead of hard-coding one layout.
      if (c.type && c.value) {
        var row = document.createElement("div");
        row.className = "rg-card-contact";
        var icon = document.createElement("span");
        icon.className = "rg-card-icon";
        icon.textContent = CONTACT_ICON[c.type] || "•";
        row.appendChild(icon);
        var text = document.createElement("div");
        if (c.label) {
          var label = document.createElement("div");
          label.className = "rg-card-label";
          label.textContent = c.label;
          text.appendChild(label);
        }
        var value = c.type === "email"
          ? el("a", { href: "mailto:" + c.value }, c.value)
          : c.type === "phone" || c.type === "whatsapp"
          ? el("a", { href: "tel:" + c.value }, c.value)
          : el("span", {}, c.value);
        value.className = "rg-card-value";
        text.appendChild(value);
        row.appendChild(text);
        card.appendChild(row);
      } else {
        var title = c.name || c.question || c.stat || c.title || c.label;
        var body = c.description || c.answer || c.value || c.body || "";
        var extra = [c.details, c.benefits, c.specifications, c.shelf_life_or_validity, c.scope]
          .filter(Boolean).join(" • ");
        if (c.image_url) card.appendChild(el("img", { class: "rg-card-image", src: c.image_url, alt: title || "" }));
        if (title) card.appendChild(el("div", { class: "rg-card-title" }, title));
        if (body) card.appendChild(el("div", { class: "rg-card-body" }, body));
        if (extra) card.appendChild(el("div", { class: "rg-card-extra" }, extra));
      }
      wrap.appendChild(card);
    });
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text) node.textContent = text;
    return node;
  }

  function addActions(actions) {
    if (!actions || !actions.length) return;
    var wrap = document.createElement("div");
    wrap.className = "rg-actions";
    actions.forEach(function (a) {
      var btn = document.createElement("button");
      btn.className = "rg-action-btn";
      btn.textContent = a.label || "...";
      btn.addEventListener("click", function () {
        handleAction(a);
      });
      wrap.appendChild(btn);
    });
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function addSuggestions(suggestions) {
    if (!suggestions || !suggestions.length) return;
    var wrap = document.createElement("div");
    wrap.className = "rg-suggestions";
    suggestions.forEach(function (s) {
      var chip = document.createElement("button");
      chip.className = "rg-suggestion-chip";
      chip.textContent = s;
      chip.addEventListener("click", function () {
        sendMessage(s);
      });
      wrap.appendChild(chip);
    });
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function addTable(table) {
    if (!table || !table.headers || !table.rows || !table.rows.length) return;
    var wrap = document.createElement("div");
    wrap.className = "rg-table-wrap";
    var tbl = document.createElement("table");
    tbl.className = "rg-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    table.headers.forEach(function (h) { headRow.appendChild(el("th", {}, h)); });
    thead.appendChild(headRow);
    tbl.appendChild(thead);
    var tbody = document.createElement("tbody");
    table.rows.forEach(function (r) {
      var row = document.createElement("tr");
      r.forEach(function (cell) { row.appendChild(el("td", {}, String(cell))); });
      tbody.appendChild(row);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  // Every action code the backend can emit is handled here explicitly —
  // nothing falls through to "does nothing".
  function handleAction(a) {
    var code = (a.action || "CHAT").toUpperCase();
    if (FORM_DEFS[code]) {
      openLeadModal(code, a.label);
    } else if (code === "URL") {
      if (a.url) window.open(a.url, "_blank", "noopener");
    } else if (code === "DOWNLOAD_BROCHURE") {
      var target = a.url || (config && config.website_url);
      if (target) {
        window.open(target, "_blank", "noopener");
      } else {
        addMessage("assistant", "Our brochure isn't available for download yet — please contact us and we'll send it over.");
      }
    } else {
      sendMessage(a.message || a.label);
    }
  }

  function setTyping(on) {
    var existing = els.messages.querySelector(".rg-msg.typing");
    if (on && !existing) {
      var div = addMessage("assistant", "...");
      div.classList.add("typing");
    } else if (!on && existing) {
      existing.remove();
    }
  }

  function sendMessage(text) {
    text = (text || "").trim();
    if (!text) return;
    addMessage("user", text);
    var historyForRequest = historyLog.slice(-40);
    historyLog.push({ role: "user", content: text });
    els.input.value = "";
    els.send.disabled = true;
    setTyping(true);

    fetch(API_BASE + "/widget/v1/chat", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
      body: JSON.stringify({
        widget_key: AUTH_TOKEN ? undefined : WIDGET_KEY,
        message: text,
        session_token: getSessionToken(),
        visitor_id: VISITOR_ID,
        page_url: window.location.href,
        conversation_history: historyForRequest,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        setTyping(false);
        setSessionToken(data.session_token);
        var hasCards = data.cards && data.cards.length;
        var hasTable = data.table && data.table.rows && data.table.rows.length;
        var replyText = data.message || data.response || (hasCards || hasTable ? "" : "...");
        if (replyText) addMessage("assistant", replyText);
        addTable(data.table);
        addCards(data.cards);
        addSuggestions(data.suggestions);
        addActions(data.actions);
        historyLog.push({ role: "assistant", content: replyText || "(see details above)" });
      })
      .catch(function () {
        setTyping(false);
        addMessage("assistant", "Sorry, I'm having trouble connecting right now. Please try again shortly.");
      })
      .finally(function () {
        els.send.disabled = false;
      });
  }

  // ── Lead capture modal (Quote / Demo / Contact forms) ───────────────────────

  function openLeadModal(actionCode, title) {
    var def = FORM_DEFS[actionCode];
    var fieldsHtml = def.fields.map(function (key) {
      var f = FORM_FIELD_DEFS[key];
      var inputEl = f.type === "textarea"
        ? '<textarea rows="2" data-field="' + key + '"></textarea>'
        : '<input type="' + f.type + '" data-field="' + key + '" />';
      return (
        '<div class="rg-field" data-field-wrap="' + key + '">' +
        "<label>" + f.label + (f.required ? " *" : "") + "</label>" +
        inputEl +
        '<div class="rg-err">' + (f.type === "email" ? "Enter a valid email" : "This field is required") + "</div>" +
        "</div>"
      );
    }).join("");

    els.modalBox.innerHTML =
      '<p class="rg-modal-title">' + escapeHtml(title || "Get in touch") + "</p>" +
      '<p class="rg-modal-sub">Fill in your details and our team will follow up shortly.</p>' +
      '<form data-el="leadForm">' +
      fieldsHtml +
      '<p class="rg-modal-error" data-el="modalError">Something went wrong. Please try again.</p>' +
      '<div class="rg-modal-actions">' +
      '<button type="button" class="rg-btn-secondary" data-el="cancelBtn">Cancel</button>' +
      '<button type="submit" class="rg-btn-primary" data-el="submitBtn">Submit</button>' +
      "</div>" +
      "</form>";

    var form = els.modalBox.querySelector('[data-el="leadForm"]');
    var errorBox = els.modalBox.querySelector('[data-el="modalError"]');
    var submitBtn = els.modalBox.querySelector('[data-el="submitBtn"]');

    els.modalBox.querySelector('[data-el="cancelBtn"]').addEventListener("click", closeLeadModal);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.style.display = "none";

      var values = {};
      var valid = true;
      def.fields.forEach(function (key) {
        var f = FORM_FIELD_DEFS[key];
        var input = form.querySelector('[data-field="' + key + '"]');
        var val = input.value.trim();
        var wrap = form.querySelector('[data-field-wrap="' + key + '"]');
        var fieldValid = true;
        if (f.required && !val) fieldValid = false;
        if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) fieldValid = false;
        wrap.classList.toggle("rg-invalid", !fieldValid);
        if (!fieldValid) valid = false;
        values[key] = val;
      });
      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      fetch(API_BASE + "/widget/v1/lead", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify({
          widget_key: AUTH_TOKEN ? undefined : WIDGET_KEY,
          session_token: getSessionToken(),
          form_type: def.formType,
          name: values.name || "",
          email: values.email || "",
          phone: values.phone || "",
          company_name: values.company_name || "",
          country: values.country || "",
          requirement: values.requirement || "",
          quantity: values.quantity || "",
        }),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("lead capture failed: " + r.status);
          return r.json();
        })
        .then(function () {
          showLeadSuccess(values.name);
        })
        .catch(function () {
          errorBox.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        });
    });

    els.modalOverlay.classList.add("open");
  }

  function showLeadSuccess(name) {
    els.modalBox.innerHTML =
      '<div class="rg-modal-success">' +
      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="11" fill="var(--rg-primary)"/>' +
      '<path d="M7 12.5l3 3 7-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>" +
      '<p class="rg-modal-title">Thank you' + (name ? ", " + escapeHtml(name) : "") + '!</p>' +
      '<p class="rg-modal-sub">We’ve received your details and our team will reach out shortly.</p>' +
      '<button type="button" class="rg-btn-primary" data-el="doneBtn" style="width:100%">Done</button>' +
      "</div>";
    els.modalBox.querySelector('[data-el="doneBtn"]').addEventListener("click", function () {
      closeLeadModal();
      addMessage("assistant", "Thanks" + (name ? ", " + name : "") + " — we've got your details and will be in touch soon!");
    });
  }

  function closeLeadModal() {
    els.modalOverlay.classList.remove("open");
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    if (!hasGreeted) {
      hasGreeted = true;
      if (config && config.welcome_message) {
        addMessage("assistant", config.welcome_message);
      }
      if (config && config.suggested_questions && config.suggested_questions.length) {
        addActions(
          config.suggested_questions.map(function (q) {
            return { label: q, message: q, action: "CHAT" };
          })
        );
      }
    }
    els.input.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    closeLeadModal();
  }

  // ── Proactive teaser — lets a first-time visitor know a live AI agent is
  // actually available, without them having to notice/click the bubble first.
  var TEASER_DISMISS_KEY = "revgeniq_teaser_dismissed_" + WIDGET_KEY;
  var teaserAutoHideTimer = null;
  var teaserShowTimer = null;

  function hideTeaser() {
    teaser.classList.remove("open");
    if (teaserAutoHideTimer) { clearTimeout(teaserAutoHideTimer); teaserAutoHideTimer = null; }
    if (teaserShowTimer) { clearTimeout(teaserShowTimer); teaserShowTimer = null; }
  }

  function dismissTeaserPermanently() {
    hideTeaser();
    try { sessionStorage.setItem(TEASER_DISMISS_KEY, "1"); } catch (e) { /* ignore */ }
  }

  function maybeShowTeaser() {
    if (isOpen) return; // already chatting
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(TEASER_DISMISS_KEY) === "1"; } catch (e) { /* ignore */ }
    if (dismissed) return; // already dismissed this tab session

    teaserShowTimer = setTimeout(function () {
      teaser.classList.add("open");
      teaserAutoHideTimer = setTimeout(hideTeaser, 15000);
    }, 1000);
  }

  teaser.addEventListener("click", function () {
    hideTeaser();
    openPanel();
  });
  els.teaserClose.addEventListener("click", function (e) {
    e.stopPropagation();
    dismissTeaserPermanently();
  });

  bubble.addEventListener("click", function () {
    hideTeaser();
    bubbleTip.classList.remove("show");
    isOpen ? closePanel() : openPanel();
  });
  bubble.addEventListener("mouseenter", function () {
    if (isOpen || teaser.classList.contains("open")) return;
    bubbleTip.classList.add("show");
  });
  bubble.addEventListener("mouseleave", function () {
    bubbleTip.classList.remove("show");
  });
  els.close.addEventListener("click", closePanel);
  els.modalOverlay.addEventListener("click", function (e) {
    if (e.target === els.modalOverlay) closeLeadModal();
  });
  els.send.addEventListener("click", function () {
    sendMessage(els.input.value);
  });
  els.input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(els.input.value);
    }
  });

  var timezone = "";
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }

  fetch(API_BASE + "/widget/v1/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      widget_key: WIDGET_KEY,
      page_url: window.location.href,
      timezone: timezone,
    }),
  })
    .then(function (r) {
      if (!r.ok) throw new Error("widget init failed: " + r.status);
      return r.json();
    })
    .then(function (data) {
      AUTH_TOKEN = data.session_token;
      applyConfig(data);
    })
    .catch(function (err) {
      console.error("[RevGenIQ widget] failed to initialize:", err);
    });
})();
