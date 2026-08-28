import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAGAZINES } from '../config/magazinesData';
import MagazineCard from '../components/MagazineCard';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// Layout coordinates matching the 6-magazine design screenshot with larger alternate sizes:
// Even indexes (0, 2, 4) are LARGE (width 22%, height 90%)
// Odd indexes (1, 3, 5) are SMALLER (width 17%, height 72%)
const MAGAZINE_POSITIONS = [
  { top: '8%', left: '0%', width: '22%', height: '90%', rotation: -12, zIndex: 10 },
  { top: '5%', left: '15%', width: '17%', height: '72%', rotation: -8, zIndex: 20 },
  { top: '12%', left: '28%', width: '22%', height: '90%', rotation: 0, zIndex: 30 },
  { top: '30%', left: '45%', width: '17%', height: '72%', rotation: 20, zIndex: 10 },
  { top: '5%', left: '58%', width: '22%', height: '90%', rotation: -8, zIndex: 30 },
  { top: '22%', left: '74%', width: '17%', height: '72%', rotation: -12, zIndex: 20 }
];

const Home = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', confirmEmail: '', password: '' });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login' && authForm.email && authForm.password) {
      setUser(authForm.email.split('@')[0]);
      setShowAuthModal(false);
    } else if (authMode === 'signup' && authForm.name && authForm.email) {
      setUser(authForm.name);
      setShowAuthModal(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMagazineClick = (mag) => {
    navigate('/magazine', { state: { pdfUrl: mag.pdfUrl, bgColor: mag.color, title: mag.title } });
  };

  const isSingle = MAGAZINES.length === 1;

  // On mobile, reverse the magazines array so that the last edition appears first
  const displayedMagazines = isMobile ? [...MAGAZINES].reverse() : MAGAZINES;

  return (
    <div className="home-container">
      {/* Top Left Title */}
      <h1 className="home-header-title">UNIDAD MINIMA</h1>

      {/* Magazines Display Area */}
      <div className="magazines-container">
        {displayedMagazines.map((magazine, index) => {
          // Use original magazine.id to determine position/rotation/sizes
          const originalIndex = magazine.id;
          const position = MAGAZINE_POSITIONS[originalIndex % MAGAZINE_POSITIONS.length];
          return (
            <MagazineCard
              key={magazine.id}
              index={originalIndex}
              mapIndex={index}
              magazine={magazine}
              position={position}
              isSingle={isSingle}
              isMobile={isMobile}
              onClick={() => handleMagazineClick(magazine)}
            />
          );
        })}
      </div>

      {/* Top right auth */}
      <div className="top-right-auth">
        {user ? (
          <button className="auth-btn">{user}</button>
        ) : (
          <button className="auth-btn" onClick={() => setShowAuthModal(true)}>Ingresar</button>
        )}
      </div>

      {/* Social Sidebar */}
      <div className="home-social-sidebar">
        <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
        <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
      </div>

      {/* Bottom right info */}
      {!user && (
        <div className="bottom-right-info">
          <button className="info-btn" onClick={() => setShowInfo(!showInfo)}>?</button>
          <div className={`info-popover ${showInfo ? 'visible' : ''}`}>
            <h3>Suscripción</h3>
            <p>Accede a contenido exclusivo suscribiéndote a nuestra revista. ¡Disfruta de nuevas ediciones cada mes, entrevistas inéditas y más!</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>
              <CloseIcon />
            </button>
            <div className="auth-header">
              <h2>{authMode === 'login' ? 'Ingresar' : 'Registrarse'}</h2>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />
                </div>
              )}
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
              </div>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Confirmar Correo electrónico</label>
                  <input type="email" value={authForm.confirmEmail} onChange={e => setAuthForm({...authForm, confirmEmail: e.target.value})} required />
                </div>
              )}
              {authMode === 'login' && (
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
                </div>
              )}
              <div className="modal-actions">
                {authMode === 'signup' ? (
                  <button type="submit" className="btn-primary">Suscribirse con Mercado Pago</button>
                ) : (
                  <button type="submit" className="btn-primary">Ingresar</button>
                )}
                <div 
                  className="auth-switch" 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                >
                  {authMode === 'login' ? '¿No tenés cuenta? Registrarse' : '¿Ya tenés cuenta? Ingresar'}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
