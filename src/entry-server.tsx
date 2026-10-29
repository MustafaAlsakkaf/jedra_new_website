import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { copy, type Lang } from './i18n';

export { copy };

export function render(lang: Lang): string {
  return renderToString(
    <StrictMode>
      <App lang={lang} />
    </StrictMode>,
  );
}
