import { useLanguage } from '../../hooks/useLanguage';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Legal.scss';

export default function Privacy() {
  const { t } = useLanguage();
  usePageTitle(t('privacy.title'));

  return (
    <div className="page legal-page">
      <h1 className="legal-page__title">{t('privacy.title')}</h1>
      <p className="legal-page__intro">{t('privacy.intro')}</p>
      <p className="legal-page__body">{t('privacy.body')}</p>
    </div>
  );
}
