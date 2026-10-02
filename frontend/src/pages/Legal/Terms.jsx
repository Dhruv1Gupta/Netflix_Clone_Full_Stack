import { useLanguage } from '../../hooks/useLanguage';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Legal.scss';

export default function Terms() {
  const { t } = useLanguage();
  usePageTitle(t('terms.title'));

  return (
    <div className="page legal-page">
      <h1 className="legal-page__title">{t('terms.title')}</h1>
      <p className="legal-page__intro">{t('terms.intro')}</p>
      <p className="legal-page__body">{t('terms.body')}</p>
    </div>
  );
}
