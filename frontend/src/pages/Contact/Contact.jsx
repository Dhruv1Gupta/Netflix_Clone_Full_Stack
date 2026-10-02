import { useLanguage } from '../../hooks/useLanguage';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Contact.scss';

// Placeholder contact links — swap these for your own before you publish
// or link this project from your resume (see contact.note below).
const LINKS = {
  email: 'mailto:you@example.com',
  emailDisplay: 'you@example.com',
  github: 'https://github.com/your-username',
  linkedin: 'https://www.linkedin.com/in/your-profile',
};

export default function Contact() {
  const { t } = useLanguage();
  usePageTitle(t('contact.title'));

  return (
    <div className="page contact-page">
      <h1 className="contact-page__title">{t('contact.title')}</h1>
      <p className="contact-page__subtitle">{t('contact.subtitle')}</p>

      <ul className="contact-page__list">
        <li>
          <span>{t('contact.emailLabel')}</span>
          <a href={LINKS.email}>{LINKS.emailDisplay}</a>
        </li>
        <li>
          <span>{t('contact.githubLabel')}</span>
          <a href={LINKS.github} target="_blank" rel="noreferrer">
            {LINKS.github.replace('https://', '')}
          </a>
        </li>
        <li>
          <span>{t('contact.linkedinLabel')}</span>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
            {LINKS.linkedin.replace('https://', '')}
          </a>
        </li>
      </ul>

      <p className="contact-page__note">{t('contact.note')}</p>
    </div>
  );
}
