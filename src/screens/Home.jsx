import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showVideo, setShowVideo] = useState(() => {
    if (location.state?.skipVideo) return false;
    if (sessionStorage.getItem('videoPlayed') === 'true') return false;
    return true;
  });
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [animationStep, setAnimationStep] = useState(0); // 0: Negro, 1: Star
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', confirmEmail: '', password: '' });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login' && authForm.email && authForm.password) {
      // API call goes here
      setUser(authForm.email.split('@')[0]);
      setShowAuthModal(false);
    } else if (authMode === 'signup' && authForm.name && authForm.email) {
      // API call goes here
      setUser(authForm.name);
      setShowAuthModal(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const infoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  // Handle initial state and state updates
  useEffect(() => {
    if (location.state?.skipVideo) {
      setShowVideo(false);
    } else if (sessionStorage.getItem('videoPlayed') === 'true') {
      setShowVideo(false);
    } else {
      setShowVideo(true);
      sessionStorage.setItem('videoPlayed', 'true');
    }
  }, [location.state]);

  useEffect(() => {
    // Start the sequence when video is gone
    if (!showVideo) {
      const timers = [];
      
      // Fade in the star after 1s
      timers.push(setTimeout(() => setAnimationStep(1), 1000));

      return () => timers.forEach(clearTimeout);
    }
  }, [showVideo]);

  const handleVideoEnd = () => {
    setVideoOpacity(0);
    setTimeout(() => {
      setShowVideo(false);
    }, 1000); // Wait for fade out animation
  };

  // Array of clickable areas
  const clickableAreas = [
    {
      id: 1,
      top: isMobile ? '28%' : '18%',
      left: isMobile ? '32%' : '38%',
      width: isMobile ? '12%' : '8%',
      height: '15%',
      redirectUrl: '/magazine',
      label: 'Blue Section',
      icon: '/blue_star_1.svg'
    }
  ];

  const handleAreaClick = (url) => {
    navigate(url);
  };

  return (
    <div className="home-container">
      {showVideo && (
        <div className="video-overlay" style={{ opacity: videoOpacity }}>
          <video 
            className="intro-video" 
            autoPlay 
            muted 
            onEnded={handleVideoEnd}
            playsInline
          >
            <source src={isMobile ? "/mobile/unidad_minima_mobile.mp4" : "/UNIDAD_MINIMA_1.mp4"} type="video/mp4" />
          </video>
        </div>
      )}
      <div className="image-wrapper">
        {/* Background Image */}
        <img 
          src={isMobile ? "/mobile/edificio_negro_mobile.png" : "/edificio_negro.png"} 
          alt="Edificio Negro" 
          className="background-image image-back" 
          draggable="false" 
        />

        {/* Title Image */}
        <h1 className="home-title-text">UNIDAD {isMobile && <br />} MINIMA</h1>

        {/* Render clickable areas and icons */}
        {clickableAreas.map((area) => (
          <div
            key={area.id}
            className="clickable-area"
            style={{
              top: area.top,
              left: area.left,
              width: area.width,
              height: area.height,
            }}
            onClick={() => handleAreaClick(area.redirectUrl)}
            title={area.label}
          >
            {area.icon && (
              <img 
                src={area.icon} 
                alt="icon" 
                className={`star-icon ${animationStep === 1 ? 'visible' : ''}`} 
              />
            )}
          </div>
        ))}
      </div>

      {/* Top right auth */}
      <div className="top-right-auth">
        {user ? (
          <button className="auth-btn">{user}</button>
        ) : (
          <button className="auth-btn" onClick={() => setShowAuthModal(true)}>Suscribirse</button>
        )}
      </div>

      {/* Social Sidebar */}
      <div className="home-social-sidebar">
        <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
        <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
      </div>

      {/* Bottom right info */}
      {!user && (
        <div className="bottom-right-info" ref={infoRef}>
          <button className="info-btn" onClick={() => setShowInfo(!showInfo)}>?</button>
          <div className={`info-popover ${showInfo ? 'visible' : ''}`}>
            <h3>¡Hola!</h3>
            <p>Unidad mínima es una revista independiente de arquitectura y urbanismo.<br />
              Cada mes se publican textos sobre ciudades, arquitectura, internet y cultura pop.<br />
              Suscribite para recibir nuevas ediciones por mail.</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {/*
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
      */}

      {/* Newsletter Subscribe Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>
              <CloseIcon />
            </button>
            <div className="auth-header">
              <h2>¡Hola! Suscribite al newsletter</h2>
              <p className="auth-subtitle" style={{ marginTop: '1rem' }}>Recibí las últimas novedades y contenido exclusivo en tu inbox.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setUser(authForm.email.split('@')[0]);
              setShowAuthModal(false);
            }}>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Suscribirme</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
