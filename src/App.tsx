import { copy, type Lang } from './i18n';
import Navbar from './components/Navbar';
import Header from './components/Header';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App = ({ lang }: { lang: Lang }) => {
  const t = copy[lang];
  return (
    <div lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2 focus:text-navy"
      >
        {lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>
      <Navbar lang={lang} t={t} />
      <main id="main">
        <Header t={t} />
        <About t={t} />
        <HowItWorks t={t} />
        <Services t={t} />
        <Faq t={t} />
        <Contact lang={lang} t={t} />
      </main>
      <Footer lang={lang} t={t} />
    </div>
  );
};

export default App;
