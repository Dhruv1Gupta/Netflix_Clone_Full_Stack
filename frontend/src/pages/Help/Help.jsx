import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Help.scss';

export default function Help() {
  const { t } = useLanguage();
  usePageTitle(t('help.title'));

  const sections = [
    { titleKey: 'help.demoAccountsTitle', bodyKey: 'help.demoAccountsBody' },
    { titleKey: 'help.addMovieTitle', bodyKey: 'help.addMovieBody' },
    { titleKey: 'help.watchlistTitle', bodyKey: 'help.watchlistBody' },
  ];

  return (
    <div className="page help-page">
      <h1 className="help-page__title">{t('help.title')}</h1>
      <p className="help-page__subtitle">{t('help.subtitle')}</p>

      <div className="help-page__sections">
        {sections.map((s) => (
          <div className="help-page__card" key={s.titleKey}>
            <h2>{t(s.titleKey)}</h2>
            <p>{t(s.bodyKey)}</p>
          </div>
        ))}
      </div>

      <Link to="/faq" className="help-page__faq-cta">
        {t('help.faqCta')}
      </Link>
    </div>
  );
}
