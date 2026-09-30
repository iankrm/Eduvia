import { Nav } from '../components/Nav.jsx';
import { Hero } from '../components/Hero.jsx';
import { Benefits } from '../components/Benefits.jsx';
import { Featured } from '../components/Featured.jsx';
import { Trending } from '../components/Trending.jsx';
import { Journey, Certificates, Business } from '../components/Banners.jsx';
import { Testimonials } from '../components/Testimonials.jsx';
import { EmailCapture } from '../components/EmailCapture.jsx';
import { Faq } from '../components/Faq.jsx';
import { Footer, StickyCta } from '../components/StickyCta.jsx';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#classes">
        Skip to content
      </a>

      <Nav />

      <main>
        <Hero />
        <Benefits />
        <Featured />
        <Trending />
        <Journey />
        <Certificates />
        <Business />
        <Testimonials />
        <EmailCapture />
        <Faq />
      </main>

      <Footer />
      <StickyCta />
    </>
  );
}
