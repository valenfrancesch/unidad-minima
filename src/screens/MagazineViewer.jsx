import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure pdf.js worker using CDN to avoid Vite bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// HTMLFlipBook requires pages to be forwarded refs
const PageWrapper = React.forwardRef(({ pageNumber, width }, ref) => {
  return (
    <div className="page" ref={ref} style={{ backgroundColor: 'white' }}>
      <Page 
        pageNumber={pageNumber} 
        width={width} 
        renderTextLayer={false} 
        renderAnnotationLayer={true}
      />
    </div>
  );
});

const LoadingComponent = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Cargando revista...</p>
  </div>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

const MagazineViewer = ({ bgColor = 'blue' }) => {
  const initialPage = parseInt(localStorage.getItem('magazineCurrentPage') || '0', 10);
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(initialPage + 1);
  const [errorMsg, setErrorMsg] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isMobilePortrait, setIsMobilePortrait] = useState(window.innerWidth < 600 && window.innerHeight > window.innerWidth);
  const [useSmallSize, setUseSmallSize] = useState(window.innerWidth < 950);
  const book = useRef();

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsMobilePortrait(window.innerWidth < 600 && window.innerHeight > window.innerWidth);
      setUseSmallSize(window.innerWidth < 950);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    if (numPages && book.current) {
      const savedPage = parseInt(localStorage.getItem('magazineCurrentPage') || '0', 10);
      if (savedPage > 0 && savedPage < numPages) {
        setTimeout(() => {
          if (book.current && book.current.pageFlip()) {
            book.current.pageFlip().turnToPage(savedPage);
          }
        }, 100);
      }
    }
  }, [numPages]);

  const onPage = (e) => {
    setPage(e.data);
    setPageInput(e.data + 1);
    setIsFading(false); // Reset fading state after flip
    localStorage.setItem('magazineCurrentPage', e.data.toString());
  };

  const handlePageSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    let p = parseInt(pageInput, 10);
    if (p >= 1 && p <= numPages) {
      book.current.pageFlip().turnToPage(p - 1);
      setErrorMsg("");
    } else {
      setErrorMsg(`La página debe estar entre 1 y ${numPages}.`);
      setTimeout(() => setErrorMsg(""), 3000);
      setPageInput(page + 1);
    }
  };

  const nextButtonClick = () => {
    if (!book.current) return;
    
    // If we are on the first page, fade out first
    if (page === 0) {
      setIsFading(true);
      setTimeout(() => {
        book.current.pageFlip().flipNext();
      }, 500); // Wait for fade out animation
    } else {
      book.current.pageFlip().flipNext();
    }
  };

  const prevButtonClick = () => {
    if (!book.current) return;

    // If we are on the last page, fade out first
    if (page === numPages - 1) {
      setIsFading(true);
      setTimeout(() => {
        book.current.pageFlip().flipPrev();
      }, 500);
    } else {
      book.current.pageFlip().flipPrev();
    }
  };

  return (
    <div className="magazine-container" style={{ backgroundImage: 'none', backgroundColor: bgColor }}>
      <Link to="/" state={{ skipVideo: true }} className="back-button">
        ← Volver
      </Link>

      {isMobilePortrait && (
        <div className="rotate-overlay">
          <div className="rotate-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8"></path><path d="M20 12c0 4.4-3.6 8-8 8s-8-3.6-8-8"></path><path d="m15 15 3 3 3-3"></path><path d="m9 9-3-3-3 3"></path></svg>
          </div>
          <p>Por favor, gira tu dispositivo para leer la revista</p>
        </div>
      )}
      
      <Document
        file="/unidad_minima_1_comprimido.pdf"
        onLoadSuccess={onDocumentLoadSuccess}
        onItemClick={({ pageNumber }) => {
          if (book.current) {
            book.current.pageFlip().turnToPage(pageNumber - 1);
          }
        }}
        loading={<LoadingComponent />}
        error={<div style={{ color: 'red', fontSize: '20px' }}>Error al cargar el PDF.</div>}
      >
        {numPages && (
          <>
            {/* First Page Overlay */}
            {page === 0 && (
              <div 
                className="magazine-overlay-left" 
                style={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease' }}
              >
                <h1>Revista de Arquitectura, Ciudad y Cultura pop</h1>
                <p className="description">Desliza para leer, explora la primera edición</p>
                <p className="footer-text">No te olvides seguirme en las redes</p>
                <div className="social-icons-row">
                  <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                  <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
                </div>
              </div>
            )}

            {/* Last Page Overlay */}
            {page === numPages - 1 && (
              <div 
                className="magazine-overlay-right"
                style={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease' }}
              >
                <div className="last-page-block">
                  <h1>Llegaste al final, GRACIAS!</h1>
                  <p className="description">Si te gusto, no te pierdas la siguiente edicion! Seguime en redes y compartila con tus conocidos. Nos vemos</p>
                  <div className="social-icons-row">
                    <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                    <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
                  </div>
                </div>
              </div>
            )}

            {/* Persistence Sidebar Icons (Visible on all pages except first and last) */}
            {page > 0 && page < numPages - 1 && (
              <div className="social-icons-sidebar">
                <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
              </div>
            )}

            <div className={`magazine-content ${page === numPages - 1 ? 'last-page-active' : ''} ${page === 0 ? 'first-page-active' : ''}`}>
              <HTMLFlipBook 
                width={useSmallSize ? 250 : 460} 
                height={useSmallSize ? 350 : 650} 
                showCover={true}
                usePortrait={false}
                maxShadowOpacity={0.5}
                className="flipbook"
                ref={book}
                onFlip={onPage}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <PageWrapper key={`page_${index + 1}`} pageNumber={index + 1} width={useSmallSize ? 250 : 460} />
                ))}
              </HTMLFlipBook>

              <div className="controls-wrapper">
                {errorMsg && <div className="error-toast">{errorMsg}</div>}
                {!useSmallSize && (
                  <div className="controls">
                    <button onClick={prevButtonClick} className="control-btn" disabled={page === 0}>
                      ← Anterior
                    </button>
                    <form onSubmit={handlePageSubmit} className="page-form" noValidate>
                      <span>Página</span>
                      <input 
                        type="number" 
                        value={pageInput} 
                        onChange={(e) => setPageInput(e.target.value)}
                        className="page-input"
                      />
                      <span>de {numPages}</span>
                    </form>
                    <button onClick={nextButtonClick} className="control-btn" disabled={page >= numPages - 1}>
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Document>
    </div>
  );
};

export default MagazineViewer;
