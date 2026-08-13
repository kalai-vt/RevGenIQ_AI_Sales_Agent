import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/layout/PageHero'
import ProductsShowcase from '../components/sections/ProductsShowcase'

export default function Products() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PageHero
        eyebrow="Products"
        title="Two products, built by RevGenAI"
        subtitle="Pick a product to see full features, pricing, and specifications."
      />
      <ProductsShowcase id="products-list" />
      <Footer />
    </div>
  )
}
