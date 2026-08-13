import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import SalesIQ from './pages/SalesIQ'
import BillIQ from './pages/BillIQ'
import Pricing from './pages/Pricing'
import About from './pages/About'
import Blog from './pages/Blog'
import Careers from './pages/Careers'
import Press from './pages/Press'
import Contact from './pages/Contact'
import Changelog from './pages/Changelog'
import Roadmap from './pages/Roadmap'
import Status from './pages/Status'
import Docs from './pages/Docs'
import Community from './pages/Community'
import Tutorials from './pages/Tutorials'
import Templates from './pages/Templates'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Security from './pages/Security'
import Gdpr from './pages/Gdpr'
import Cookies from './pages/Cookies'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/sales-iq" element={<SalesIQ />} />
      <Route path="/bill-iq" element={<BillIQ />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/press" element={<Press />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/status" element={<Status />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/community" element={<Community />} />
      <Route path="/tutorials" element={<Tutorials />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      <Route path="/gdpr" element={<Gdpr />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
