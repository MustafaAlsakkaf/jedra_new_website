// The three stacked diamonds from the Jedra mark, used as the list marker across the site.
const Diamonds = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 10 26" aria-hidden="true" className={className}>
    <path d="M5 0 9 4 5 8 1 4Z M5 9 9 13 5 17 1 13Z M5 18 9 22 5 26 1 22Z" fill="currentColor" />
  </svg>
);

export default Diamonds;
