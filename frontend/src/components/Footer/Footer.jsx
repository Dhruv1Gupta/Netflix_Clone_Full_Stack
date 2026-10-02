import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import LanguageMenu from '../LanguageMenu/LanguageMenu';
import './Footer.scss';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav className="site-footer__columns" aria-label="Footer">
          <div className="site-footer__col">
            <Link to="/faq">{t('footer.faq')}</Link>
            <Link to="/help">{t('footer.help')}</Link>
            <Link to="/contact">{t('footer.contact')}</Link>
          </div>
          <div className="site-footer__col">
            <Link to="/terms">{t('footer.terms')}</Link>
            <Link to="/privacy">{t('footer.privacy')}</Link>
          </div>
          <div className="site-footer__col">
            <Link to="/">{t('footer.browse')}</Link>
            <Link to="/my-list">{t('footer.myList')}</Link>
          </div>
        </nav>

        <div className="site-footer__language">
          <span>{t('footer.languageLabel')}</span>
          <LanguageMenu variant="footer" />
        </div>

        <p className="site-footer__disclaimer">{t('footer.disclaimer')}</p>
        <p className="site-footer__rights">{t('footer.rights', { year })}</p>
      </div>
    </footer>
  );
}
