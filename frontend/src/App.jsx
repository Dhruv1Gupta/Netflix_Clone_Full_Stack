import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import OfflineBanner from './components/OfflineBanner/OfflineBanner';
import BackToTop from './components/BackToTop/BackToTop';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import MovieDetail from './pages/MovieDetail/MovieDetail';
import MovieForm from './pages/MovieForm/MovieForm';
import MyList from './pages/MyList/MyList';
import GenreView from './pages/Genre/GenreView';
import AdminMovies from './pages/Admin/AdminMovies';
import Faq from './pages/Faq/Faq';
import Contact from './pages/Contact/Contact';
import Help from './pages/Help/Help';
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';
import NotFound from './pages/NotFound/NotFound';

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <OfflineBanner />
      <Navbar />
      <main className="app-main" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/genre/:genre" element={<GenreView />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminMovies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movies/new"
            element={
              <ProtectedRoute>
                <MovieForm mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movies/:id/edit"
            element={
              <ProtectedRoute>
                <MovieForm mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
