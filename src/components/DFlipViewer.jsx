import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  applyResponsivePageMode,
  BOOK_ELEMENT_ID,
  destroyDFlipViewer,
  initDFlipViewer,
  resizeDFlipViewer,
} from '../utils/dflip';
import { MAGAZINE_PDF } from '../config/magazine';
import './DFlipViewer.css';

const DFlipViewer = ({ bgColor: defaultBgColor = '#1a2bc3' }) => {
  const location = useLocation();
  const pdfUrl = location.state?.pdfUrl || MAGAZINE_PDF;
  const bgColor = location.state?.bgColor || defaultBgColor;

  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    document.body.classList.add('viewer-modal-open');

    const handleResize = () => {
      applyResponsivePageMode();
    };

    const handleOrientationChange = () => {
      window.setTimeout(() => {
        applyResponsivePageMode();
      }, 300);
    };

    const orientationQuery = window.matchMedia('(orientation: portrait)');
    const onOrientationChange = () => {
      applyResponsivePageMode();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (typeof orientationQuery.addEventListener === 'function') {
      orientationQuery.addEventListener('change', onOrientationChange);
    } else if (typeof orientationQuery.addListener === 'function') {
      orientationQuery.addListener(onOrientationChange);
    }

    initDFlipViewer(pdfUrl)
      .then(() => {
        if (!cancelled) {
          setStatus('ready');
          resizeDFlipViewer();
        }
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }
        setStatus('error');
        setErrorMessage(error?.message || 'Error al cargar el visor PDF.');
      });

    return () => {
      cancelled = true;
      document.body.classList.remove('viewer-modal-open');

      window.setTimeout(() => {
        const bookHost = document.getElementById(BOOK_ELEMENT_ID);
        if (!bookHost?.isConnected) {
          destroyDFlipViewer();
        }
      }, 0);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);

      if (typeof orientationQuery.removeEventListener === 'function') {
        orientationQuery.removeEventListener('change', onOrientationChange);
      } else if (typeof orientationQuery.removeListener === 'function') {
        orientationQuery.removeListener(onOrientationChange);
      }
    };
  }, []);

  return (
    <div className="dflip-viewer-page" style={{ backgroundColor: bgColor }}>
      <Link to="/" state={{ skipVideo: true }} className="back-button">
        ← Volver
      </Link>

      {status === 'loading' && (
        <div className="dflip-viewer-loading dflip-viewer-loading--overlay">
          <div className="spinner" />
          <p>Cargando revista...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="dflip-viewer-error">{errorMessage}</div>
      )}

      <div className="dflip-viewer-host _df_book" id={BOOK_ELEMENT_ID} />
    </div>
  );
};

export default DFlipViewer;
