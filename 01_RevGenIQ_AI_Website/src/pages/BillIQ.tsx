import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import './BillIQ.css'

const modules = [
  {
    no: '01', title: 'Billing & POS',
    items: [
      { name: 'Fast Checkout & Cart', desc: 'Ring up sales in seconds at a counter built for busy hours.' },
      { name: 'Held Bills', desc: 'Park an in-progress sale and resume it without losing line items.' },
      { name: 'Provisional Bills', desc: "Print a pre-final bill for approval before it's invoiced." },
      { name: 'Thermal Printing', desc: 'Direct ESC/POS printing via QZ Tray — no print dialog at the counter.' },
      { name: 'Credit Sales & Discount Approval', desc: 'Control who can approve a discount or a credit sale.' },
    ],
  },
  {
    no: '02', title: 'Inventory',
    items: [
      { name: 'Stock Levels & History', desc: "Track what's on the shelf and every movement behind it." },
      { name: 'Bulk Import', desc: 'Load your catalog from a spreadsheet, with a full import history.' },
      { name: 'Low-Stock Alerts', desc: "Know before you run out, not after." },
      { name: 'Multi-Branch Stock', desc: 'Separate stock counts across every branch and warehouse.' },
    ],
  },
  {
    no: '03', title: 'Customers & Payments',
    items: [
      { name: 'Customer Directory', desc: 'One record per customer, with full purchase and payment history.' },
      { name: 'Outstanding & Credit Tracking', desc: 'See exactly who owes what, and collect it faster.' },
      { name: 'Receive Payments', desc: 'Log partial or full payments against any bill.' },
      { name: 'Online Checkout', desc: 'Razorpay-powered checkout for subscription and online payments.' },
    ],
  },
  {
    no: '04', title: 'Procurement & Vendors',
    items: [
      { name: 'Vendor Directory', desc: "Every supplier's details and terms, in one place." },
      { name: 'Purchase Entry & Returns', desc: "Record incoming stock and send back what doesn't check out." },
      { name: 'Vendor Payments', desc: "Track what you owe and what you've paid, per vendor." },
      { name: 'Procurement Analytics', desc: 'Spend and purchase trends by vendor and category.' },
    ],
  },
  {
    no: '05', title: 'Analytics & Reporting',
    items: [
      { name: 'Live Dashboard', desc: 'Sales, stock, and cash position at a glance.' },
      { name: 'Advanced Analytics', desc: 'Deeper cuts of your sales and inventory data.' },
      { name: 'Trend Comparison', desc: "Set any two periods side by side to see what's actually changing." },
    ],
  },
  {
    no: '06', title: 'Invoice Designer',
    items: [
      { name: 'Drag-and-Drop Templates', desc: 'Design your own header, item table, tax summary, and footer.' },
      { name: 'Custom Branding', desc: 'Your logo, colours, and paper size on every printed bill.' },
      { name: 'QR & Barcode Panels', desc: 'A scannable QR or barcode, placed right on the bill.' },
    ],
  },
  {
    no: '07', title: 'Returns & Multi-Branch',
    items: [
      { name: 'Sales & Purchase Returns', desc: 'Handle returns cleanly on both sides of the counter.' },
      { name: 'Multi-User Logins', desc: 'Give staff their own logins with the right access.' },
      { name: 'Multi-Branch Accounts', desc: 'Run several branches from a single Bill IQ account.' },
    ],
  },
]

const barWidths = [2, 1, 3, 1, 2, 1, 1, 4, 1, 2, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1]
const barHeights = [34, 24, 34, 18, 34, 28, 34, 22, 34, 16, 34, 30, 34, 20, 34, 26, 34, 14, 34, 30]

export default function BillIQ() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="billiq-page" style={{ paddingTop: '80px' }}>
        <nav className="subnav" aria-label="Bill IQ sections">
          <div className="subnav-inner">
            <a href="#overview">Overview</a>
            <a href="#modules">Modules</a>
            <a href="#highlights">AI &amp; WhatsApp</a>
            <a href="#pricing">Pricing</a>
          </div>
        </nav>

        <main id="top">
          {/* HERO */}
          <section className="hero">
            <div className="wrap hero-grid">
              <div>
                <p className="eyebrow">Billing · POS · Inventory · Payments</p>
                <h1>Run the whole shop from one bill counter.</h1>
                <p className="lede">
                  Bill IQ is a cloud billing and point-of-sale platform for retail stores, restaurants,
                  pharmacies, and service businesses — one place for checkout, stock, customers, vendors,
                  and the numbers behind all of it.
                </p>
                <div className="hero-ctas">
                  <a className="btn btn-primary" href="#pricing">View Plans &amp; Pricing</a>
                  <a className="btn btn-ghost" href="#modules">See Every Module</a>
                </div>
                <p className="hero-note">Basic from ₹699/mo · Advance from ₹1099/mo</p>
              </div>
              <div className="receipt" aria-hidden="true">
                <div className="receipt-head">
                  <div className="biz">Sharma General Store</div>
                  <div className="sub">GSTIN 27ABCDE1234F1Z5 · Pune</div>
                </div>
                <hr />
                <div className="rline"><span className="qty">2 ×</span><span>Basmati Rice 5kg</span><span className="tabular">₹540</span></div>
                <div className="rline"><span className="qty">1 ×</span><span>Sunflower Oil 1L</span><span className="tabular">₹165</span></div>
                <div className="rline"><span className="qty">3 ×</span><span>Toor Dal 1kg</span><span className="tabular">₹255</span></div>
                <hr />
                <div className="rtotal"><span>Total</span><span className="tabular">₹960.00</span></div>
                <div className="rflag"><strong>Sent on WhatsApp</strong> — no printout needed</div>
                <div className="receipt-torn" />
              </div>
            </div>
          </section>

          {/* OVERVIEW */}
          <section id="overview" className="notice">
            <div className="wrap">
              <div className="label">What it is</div>
              <div>
                <p>
                  Bill IQ is a multi-tenant, cloud-native billing and POS platform built for everyday retail —
                  general stores, restaurants, pharmacies, hospitality, and service businesses that need billing,
                  stock, and customer records to work off the same source of truth.
                </p>
                <p>
                  Every plan covers the counter: checkout, held bills, barcode scanning, and thermal-printer
                  support out of the box. Move up a plan and Bill IQ grows into a full back office — inventory
                  across branches, procurement, analytics, a drag-and-drop invoice designer, AI-assisted insights,
                  and WhatsApp bill delivery.
                </p>
              </div>
            </div>
          </section>

          {/* MODULES */}
          <section id="modules" className="section">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">Modules</p>
                <h2>Everything on the ledger.</h2>
                <p>
                  Seven working areas, one account. Line items below are grouped the way your business actually
                  runs — counter, stock, customers, suppliers, and the reports that tie them together.
                </p>
              </div>

              <div className="ledger-grid">
                {modules.map((m) => (
                  <div className="ledger-card" key={m.no}>
                    <h3><span className="cat-no">{m.no}</span> {m.title}</h3>
                    <ul>
                      {m.items.map((it, idx) => (
                        <li key={it.name}>
                          <span className="item-no">{String.fromCharCode(97 + idx)}</span>
                          <div>
                            <div className="item-name">{it.name}</div>
                            <div className="item-desc">{it.desc}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* HIGHLIGHTS */}
          <section id="highlights" className="section">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">On the Advance plan</p>
                <h2>Two things that change how the counter works.</h2>
                <p>These come standard with Advance — no separate add-on to configure.</p>
              </div>
              <div className="highlight-grid">
                <div className="highlight-card">
                  <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <span className="tag">AI Assistance</span>
                  <h3>The insight arrives before you go looking for it.</h3>
                  <p>
                    Bill IQ's AI assistance reads your own sales, stock, and customer data and surfaces what
                    matters — a summary on your dashboard, a pattern worth knowing about, a plain-language answer
                    to a question about your own numbers. Included on the Advance plan.
                  </p>
                </div>
                <div className="highlight-card">
                  <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 20l1.6-4.8A7.6 7.6 0 1 1 9 18.4L4 20Z" />
                    <path d="M9 10.5c.3 1.8 2.2 3.7 4 4" />
                  </svg>
                  <span className="tag">WhatsApp Bill Share</span>
                  <h3>The bill reaches the customer before they reach the door.</h3>
                  <p>
                    Send the finished bill straight to your customer's WhatsApp the moment checkout is done — no
                    printer required, and nothing for them to lose on the way home. Included on the Advance plan.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="section">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">Pricing</p>
                <h2>Two plans. Pick by how many branches you run.</h2>
                <p>
                  Start on Basic for a single counter, move to Advance when you need more branches, deeper
                  reports, AI assistance, and WhatsApp bill sharing.
                </p>
              </div>

              <div className="pricing-grid">
                <div className="invoice">
                  <div className="invoice-head">
                    <div className="plan-name">Basic</div>
                    <div className="plan-tag">One branch, one counter, done right.</div>
                  </div>
                  <div className="invoice-price">
                    <span className="amount tabular"><sup>₹</sup>699</span>
                    <span className="per"> / month</span>
                  </div>
                  <ul className="invoice-items">
                    <li><span className="chk">✓</span><span>1 user login, 1 branch</span></li>
                    <li><span className="chk">✓</span><span>Up to 500 products &amp; customers</span></li>
                    <li><span className="chk">✓</span><span>Billing &amp; POS with barcode scanning</span></li>
                    <li><span className="chk">✓</span><span>Product &amp; category catalog</span></li>
                    <li><span className="chk">✓</span><span>Customer directory &amp; outstanding tracking</span></li>
                    <li><span className="chk">✓</span><span>Sales returns</span></li>
                    <li><span className="chk">✓</span><span>Activity log &amp; standard reports</span></li>
                    <li><span className="chk">✓</span><span>1 GB storage</span></li>
                  </ul>
                  <div className="invoice-foot">
                    <Link className="btn btn-ghost btn-block" to="/contact">Choose Basic</Link>
                  </div>
                </div>

                <div className="invoice advance">
                  <span className="stamp">Recommended</span>
                  <div className="invoice-head">
                    <div className="plan-name">Advance</div>
                    <div className="plan-tag">Every branch, every report, AI included.</div>
                  </div>
                  <div className="invoice-price">
                    <span className="amount tabular"><sup>₹</sup>1099</span>
                    <span className="per"> / month</span>
                  </div>
                  <ul className="invoice-items">
                    <li><span className="chk">✓</span><span>Everything in Basic</span></li>
                    <li><span className="chk">✓</span><span>Unlimited users, products &amp; customers</span></li>
                    <li><span className="chk">✓</span><span>Multi-branch &amp; multi-warehouse</span></li>
                    <li><span className="chk">✓</span><span>Full inventory management</span></li>
                    <li><span className="chk">✓</span><span>Procurement suite — vendors, purchase returns, vendor payments</span></li>
                    <li><span className="chk">✓</span><span>Advanced analytics &amp; trend comparison</span></li>
                    <li><span className="chk">✓</span><span>Invoice Designer with custom branding</span></li>
                    <li><span className="chk">✓</span><span><strong>AI Assistance</strong></span></li>
                    <li><span className="chk">✓</span><span><strong>WhatsApp Bill Share</strong></span></li>
                    <li><span className="chk">✓</span><span>Unlimited storage</span></li>
                  </ul>
                  <div className="invoice-foot">
                    <Link className="btn btn-primary btn-block" to="/contact">Choose Advance</Link>
                  </div>
                </div>
              </div>
              <p className="pricing-note">Prices shown are per month. Taxes as applicable.</p>
            </div>
          </section>

          {/* TRUST */}
          <section className="trust">
            <div className="wrap trust-grid">
              <div className="trust-item"><span className="mark">—</span><p>Multi-tenant, cloud-hosted platform built to run more than one branch cleanly.</p></div>
              <div className="trust-item"><span className="mark">—</span><p>Secure, Razorpay-powered payments for subscriptions and online collections.</p></div>
              <div className="trust-item"><span className="mark">—</span><p>Printer-ready — works with thermal ESC/POS printers straight out of the box.</p></div>
              <div className="trust-item"><span className="mark">—</span><p>A dedicated support and account-management team behind every plan.</p></div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="cta-banner" id="contact">
            <div className="wrap">
              <p className="eyebrow">Get started</p>
              <h2>Set up your counter this week.</h2>
              <p>Talk to your Bill IQ representative to pick a plan and get your first branch billing.</p>
              <div className="hero-ctas">
                <Link className="btn btn-primary" to="/contact">Talk to Us</Link>
                <a className="btn btn-ghost" href="#modules">Review Modules Again</a>
              </div>
            </div>
          </section>
        </main>

        <div className="billiq-footer-strip">
          <div className="wrap">
            <div className="barcode" role="img" aria-label="Decorative barcode">
              {barWidths.map((w, i) => (
                <span key={i} style={{ width: `${w}px`, height: `${barHeights[i]}px` }} />
              ))}
            </div>
            <div className="footer-grid">
              <div className="footer-thanks">Thank you for choosing Bill IQ.</div>
              <div className="footer-meta tabular">Bill IQ · Billing &amp; POS Platform<br />Basic ₹699/mo · Advance ₹1099/mo</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
