# RevGenIQ AI Widget — Installation Guide

This guide explains how to add the RevGenIQ AI chat widget to a customer's website. It covers the dashboard steps, the actual code snippet, platform-specific instructions (WordPress, Shopify, Wix, plain HTML, React/Next.js/Vue, Google Tag Manager), customization, verification, and troubleshooting.

---

## 1. Overview

The widget is a small, self-contained JavaScript file (`loader.js`) served by the RevGenIQ backend. A customer installs it by pasting **one `<script>` tag** into their website. No npm install, no build step, and no framework dependency on the customer's side — it works on any website, regardless of what it's built with.

Once installed, the script:
- Injects a floating chat bubble (bottom-left or bottom-right, per your configuration)
- Fetches that tenant's widget configuration (colors, welcome message, agent name)
- Opens a chat panel on click and exchanges messages with the AI agent in real time
- Persists the visitor's identity and conversation session in their browser (`localStorage`), so returning visitors continue their conversation instead of starting over

Each customer (tenant) has a unique `widget_key` that identifies which company's configuration, knowledge base, and AI settings to use. This key is generated automatically the moment a workspace is created — there is no manual setup required to obtain it.

---

## 2. Prerequisites

- The customer has an active RevGenIQ AI account with at least one workspace created.
- You (or the customer) have access to edit the customer's website HTML — either directly, or through a platform's theme/tracking-code editor.
- The RevGenIQ backend is reachable from the customer's website (i.e., not blocked by a firewall/VPN-only network). In production this is your deployed backend's public domain; in local development it's `http://localhost:8000`.

---

## 3. Get the embed snippet

1. Log into the RevGenIQ dashboard.
2. In the sidebar, click **Widget Builder**.
3. The page loads your workspace's widget configuration automatically — no setup step needed, it already exists.
4. (Optional) Customize the widget under **Appearance**:
   - **Agent name** — the name shown in the chat header (e.g. "Sales Bot", "Acme Assistant")
   - **Position** — bottom-right or bottom-left
   - **Primary color** — matches your brand, used for the bubble, header, and message bubbles
   - **Placeholder text** — the hint text in the message input box
   - **Welcome message** — the first thing visitors see when they open the chat
   - Click **Save changes** to apply.
5. Under **Install on your website**, click **Copy** to copy the snippet. It looks like this:

```html
<script
  src="https://<your-revgeniq-backend-domain>/widget/v1/loader.js"
  data-widget-key="YOUR-UNIQUE-WIDGET-KEY"
  async
></script>
```

The `src` domain and `data-widget-key` are already filled in correctly for your workspace — you don't need to edit anything, just copy and paste.

---

## 4. Install the snippet on the customer's website

Paste the snippet immediately before the closing `</body>` tag. Where that lives depends on the platform:

### Plain HTML / static site
Open the site's HTML file(s) (or the shared layout/footer template if the site has one) and paste the snippet right before `</body>`:

```html
  ...
  <script src="https://your-backend.com/widget/v1/loader.js" data-widget-key="..." async></script>
</body>
</html>
```

If the site has many pages without a shared template, add it to each page, or better, to whatever layout file all pages include.

### WordPress
1. Go to **Appearance → Theme File Editor** (or use a plugin like "Insert Headers and Footers" — safer, since it survives theme updates).
2. If using a plugin: paste the snippet into the **Footer** script box and save.
3. If editing the theme directly: open `footer.php` and paste the snippet immediately before `</body>`.

### Shopify
1. Go to **Online Store → Themes → Edit code**.
2. Open `layout/theme.liquid`.
3. Paste the snippet immediately before `</body>` and save.

### Wix
1. Go to **Settings → Custom Code** (Wix Editor) or **Settings → Advanced → Custom Code** (Wix Studio).
2. Add a new custom code snippet, paste the widget `<script>` tag, set it to load on **All Pages**, and place it in the **Body - End** section.

### Squarespace
1. Go to **Settings → Advanced → Code Injection**.
2. Paste the snippet into the **Footer** box and save.

### Google Tag Manager
1. Create a new **Custom HTML** tag.
2. Paste the `<script>` snippet as the tag's content.
3. Set the trigger to **All Pages**.
4. Publish the container.

### React / Next.js / Vue / other JS frameworks
Add the script tag to the app's root HTML shell:
- **Next.js (App Router):** in `app/layout.tsx`, use `next/script` with `strategy="lazyOnload"`:
  ```tsx
  import Script from 'next/script'

  <Script src="https://your-backend.com/widget/v1/loader.js" data-widget-key="..." strategy="lazyOnload" />
  ```
- **Plain React (Vite/CRA):** add the snippet directly to `public/index.html` (or `index.html` for Vite) before `</body>`, the same as a static site.
- **Vue/Nuxt:** add it to `nuxt.config` under `app.head.script`, or directly in `public/index.html` for a plain Vue app.

---

## 5. Verify it's working

1. Open the customer's website in a browser (a private/incognito window is a good idea, to see it as a first-time visitor would).
2. Confirm the chat bubble appears in the configured corner within a second or two of page load.
3. Click the bubble — the panel should open and show the configured welcome message.
4. Type a message and send it — you should see a typing indicator, followed by the AI agent's response.
5. Refresh the page and reopen the chat — the earlier conversation should still be there (this confirms session persistence is working).

If any step fails, see **Troubleshooting** below.

---

## 6. How it works (technical summary)

| Step | Endpoint | Purpose |
|---|---|---|
| Page load | `GET /widget/v1/loader.js` | Serves the widget's JS bundle |
| Widget opens | `GET /widget/v1/config/{widget_key}` | Fetches colors, agent name, welcome message |
| Message sent | `POST /widget/v1/chat` | Runs the AI pipeline (intent classification → knowledge base retrieval → response) and returns a reply |
| Lead captured | `POST /widget/v1/lead` | Saves a lead when the conversation collects contact info |

The widget stores two values in the visitor's browser `localStorage`:
- `revgeniq_visitor_id` — a stable anonymous ID for that browser, shared across all RevGenIQ widgets on that domain
- `revgeniq_session_<widget_key>` — the current conversation's session token, scoped per widget, so returning visitors resume their conversation

The widget renders inside a **Shadow DOM**, so its styles cannot be affected by the host site's CSS, and it cannot leak styles onto the host page either.

These endpoints allow cross-origin requests from any domain (unlike the rest of the RevGenIQ API), since the widget is designed to run on websites you don't control. They require no cookies or authentication — the `widget_key` alone determines which tenant's configuration and knowledge base to use.

---

## 7. Troubleshooting

**The bubble doesn't appear at all**
- Open the browser console (F12 → Console) and look for errors. `[RevGenIQ widget] missing required data-widget-key attribute` means the snippet was pasted without the `data-widget-key` attribute — re-copy it from Widget Builder.
- Confirm the script tag is actually present in the rendered page (View Page Source, or Inspect Element). Some site builders strip inline `<script>` tags from certain content areas — use the platform's dedicated "custom code" or "footer scripts" section instead (see platform steps above).
- Confirm the backend domain in `src` is reachable from the browser — try opening `https://your-backend-domain/widget/v1/health` directly; it should return `{"status":"ok"}`.

**The bubble appears but clicking it shows a blank panel / config never loads**
- Console error `[RevGenIQ widget] failed to load config` means the `GET /widget/v1/config/{widget_key}` call failed. Check that the `widget_key` in the snippet exactly matches the one shown in Widget Builder, and that the widget hasn't been deactivated.

**Messages don't get a response / "Sorry, I'm having trouble connecting right now"**
- This is the widget's fallback message when the chat request fails or times out — check the backend logs for the actual cause (common causes: OpenAI API key exhausted/rate-limited, knowledge base/vector DB unreachable).
- This message means the request reached the backend and failed gracefully — it does not mean the widget itself is broken.

**Works locally but not after deploying**
- The snippet's `src` must point at your **deployed** backend's public domain, not `localhost`. Widget Builder fills this in automatically based on how the dashboard itself is configured (`VITE_API_URL`) — if it's still showing `localhost`, the dashboard's environment configuration needs to be set for production before generating the snippet.

**Widget shows the wrong colors/branding**
- Changes made in Widget Builder require clicking **Save changes**. The widget's *configuration* (colors, welcome message) is fetched fresh on every page load and is not cached — but the `loader.js` file itself is served with a 5-minute cache header, so if you've also changed the widget's underlying JS behavior (not just its config), hard-refresh (Ctrl+Shift+R) to bypass that.

---

## 8. Data & privacy notes

- The widget does not set any cookies. It uses `localStorage`, scoped to the customer's own domain (standard same-origin browser storage — RevGenIQ cannot read it from a different site).
- No visitor data is sent anywhere until the visitor sends a message or submits contact details through the chat's lead-capture flow.
- Conversation history, messages, and any captured leads are stored under the customer's own tenant in RevGenIQ, isolated from every other customer's data.

---

## 9. FAQ

**Can I add the widget to only some pages?**
Yes — instead of a shared layout/footer, add the snippet only to the specific page templates you want it on.

**Can one company run widgets for multiple brands/domains?**
Yes — create a separate workspace per brand in RevGenIQ. Each workspace gets its own `widget_key`, configuration, and knowledge base, so install the corresponding snippet on each brand's site.

**Does it slow down page load?**
The script tag uses the `async` attribute, so it downloads and executes without blocking the rest of the page from rendering.

**Can I move the widget to a different position or hide RevGenIQ branding?**
Position (bottom-left/right) is configurable in Widget Builder. The "Powered by RevGenIQ AI" footer is controlled by the `show_branding` setting — it can currently be toggled off via the widget settings API (`PATCH /api/v1/widget-settings`) regardless of plan; there is no plan-based enforcement of this yet, even though the Business plan's feature set includes a `white_label` flag. If you want white-labeling restricted to specific plans, that gating needs to be added — it isn't wired up today.
