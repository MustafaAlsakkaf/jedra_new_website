import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { detectLang } from './i18n';

const container = document.getElementById('root')!;
const lang = detectLang(window.location.pathname);
const app = (
  <StrictMode>
    <App lang={lang} />
  </StrictMode>
);

// Pages are prerendered at build time; hydrate them. In dev the root is empty, so render.
if (container.firstElementChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
