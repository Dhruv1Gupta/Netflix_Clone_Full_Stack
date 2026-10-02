import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import './ReasonsToJoin.scss';

const ICONS = {
  everywhere: (
    <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
      <rect x="6" y="4" width="20" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="27" r="0.8" fill="currentColor" />
      <path d="M27 14h7v18a2 2 0 0 1-2 2h-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
      <path d="M8 12h20M8 20h20M8 28h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 25l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trailer: (
    <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
      <rect x="5" y="9" width="30" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 15l9 5-9 5V15Z" fill="currentColor" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M20 5c-3.6 4-5.6 9.4-5.6 15s2 11 5.6 15c3.6-4 5.6-9.4 5.6-15S23.6 9 20 5ZM6 20h28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  ),
};

// Shown to signed-out visitors only (see Home.jsx) — a guest "why join"
// section, mirroring the marketing block real streaming landing pages show.
export default function ReasonsToJoin() {
  const { t } = useLanguage();
  const items = [
    { icon: 'everywhere', titleKey: 'reasons.item1Title', bodyKey: 'reasons.item1Body' },
    { icon: 'list', titleKey: 'reasons.item2Title', bodyKey: 'reasons.item2Body' },
    { icon: 'trailer', titleKey: 'reasons.item3Title', bodyKey: 'reasons.item3Body' },
    { icon: 'language', titleKey: 'reasons.item4Title', bodyKey: 'reasons.item4Body' },
  ];

  return (
    <section className="reasons">
      <div className="reasons__head">
        <h2 className="reasons__title">{t('reasons.title')}</h2>
        <p className="reasons__subtitle">{t('reasons.subtitle')}</p>
      </div>

      <div className="reasons__grid">
        {items.map((item) => (
          <div key={item.titleKey} className="reasons__card">
            <span className="reasons__icon">{ICONS[item.icon]}</span>
            <h3>{t(item.titleKey)}</h3>
            <p>{t(item.bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="reasons__actions">
        <Link to="/signup" className="reasons__cta">
          {t('reasons.cta')}
        </Link>
        <Link to="/faq" className="reasons__faq-link">
          {t('reasons.faqLink')}
        </Link>
      </div>
    </section>
  );
}
