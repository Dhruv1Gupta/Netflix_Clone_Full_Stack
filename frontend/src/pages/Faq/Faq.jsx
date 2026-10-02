import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Faq.scss';

const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ q: `faq.q${n}`, a: `faq.a${n}` }));

export default function Faq() {
  const { t } = useLanguage();
  usePageTitle(t('faq.title'));
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="page faq-page">
      <h1 className="faq-page__title">{t('faq.title')}</h1>
      <p className="faq-page__subtitle">{t('faq.subtitle')}</p>

      <div className="faq-list">
        {ITEMS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div className={`faq-item ${open ? 'faq-item--open' : ''}`} key={item.q}>
              <button
                type="button"
                className="faq-item__question"
                onClick={() => setOpenIndex(open ? -1 : i)}
                aria-expanded={open}
                aria-controls={`faq-answer-${i}`}
              >
                <span>{t(item.q)}</span>
                <span className="faq-item__chevron" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <p className="faq-item__answer" id={`faq-answer-${i}`}>
                  {t(item.a)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
