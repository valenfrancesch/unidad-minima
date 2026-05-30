import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Document, Page, Outline, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure pdf.js worker using CDN to avoid Vite bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const customOutline = [
  { title: "Portada", page: 1 },
  { title: "Editorial", page: 3 },
  { title: "La ciudad observada", page: 6 },
  { title: "¿Qué jugador urbano sos?", page: 12 },
  { title: "La ciudad recorrida", page: 14 },
  { title: "Elegí tu propia aventura", page: 22 },
  { title: "La ciudad simulada", page: 26 },
  { title: "Lugano a París", page: 34 },
  { title: "La ciudad consumida", page: 42 },
  { title: "La ilusión de intervenir la calle", page: 50 },
  { title: "La imagen de la ciudad", page: 58 },
  { title: "La ciudad proyectada", page: 60 },
  { title: "La odisea del espacio", page: 66 }
];

const ASPECT_RATIO = 460 / 650;

const PageWrapper = React.forwardRef(({ pageNumber, width }, ref) => {
  return (
    <div className="page" ref={ref} style={{ backgroundColor: 'white' }}>
      <Page 
        pageNumber={pageNumber} 
        width={width} 
        renderTextLayer={false} 
        renderAnnotationLayer={false} 
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

const MagazineViewer = ({ bgColor = '#1a2bc3' }) => {
  const initialPage = parseInt(localStorage.getItem('magazineCurrentPage') || '0', 10);
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(initialPage + 1);
  const [errorMsg, setErrorMsg] = useState("");
  
  // View states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('thumbnails'); // 'thumbnails' or 'outline'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasPdfOutline, setHasPdfOutline] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Responsive calculations
  const [dimensions, setDimensions] = useState({ width: 460, height: 650 });
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [isMobileSize, setIsMobileSize] = useState(window.innerWidth < 850 || window.innerHeight > window.innerWidth);

  const book = useRef();
  const lastJumpedPage = useRef(null);

  const calculateLayout = () => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    const sidebarWidth = (isSidebarOpen && vw >= 768) ? 300 : 0;
    const availWidth = vw - sidebarWidth - 48; // Gutter space
    const availHeight = vh - 140; // Subtract header (60px) and bottom toolbar (80px)

    const mobile = vw < 850 || vh > vw;
    setIsMobileSize(mobile);

    const singlePage = (vh > vw);
    setIsSinglePage(singlePage);

    let width, height;
    if (singlePage) {
      width = Math.min(availWidth - 10, availHeight * ASPECT_RATIO);
      height = width / ASPECT_RATIO;
    } else {
      const doubleAspectRatio = ASPECT_RATIO * 2;
      const totalWidth = Math.min(availWidth - 20, availHeight * doubleAspectRatio);
      width = totalWidth / 2;
      height = width / ASPECT_RATIO;
    }

    setDimensions({ width: Math.floor(width), height: Math.floor(height) });
  };

  useEffect(() => {
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', calculateLayout);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isSidebarOpen]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Pre-load current page on load
  useEffect(() => {
    if (numPages && book.current) {
      const savedPage = parseInt(localStorage.getItem('magazineCurrentPage') || '0', 10);
      if (savedPage > 0 && savedPage < numPages) {
        setTimeout(() => {
          if (book.current && book.current.pageFlip()) {
            book.current.pageFlip().turnToPage(savedPage);
          }
        }, 150);
      }
    }
  }, [numPages, isSinglePage]);

  const getSpreadIndex = (p) => {
    if (p === 0) return 0;
    if (p === numPages - 1) return Math.floor((numPages - 2) / 2) + 1;
    return Math.floor((p - 1) / 2) + 1;
  };

  const jumpToPage = useCallback((index) => {
    if (!numPages || !book.current) return;
    const targetIdx = Math.max(0, Math.min(numPages - 1, index));
    if (targetIdx === page) return;

    lastJumpedPage.current = targetIdx;
    book.current.pageFlip().turnToPage(targetIdx);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [page, numPages]);

  const onPage = (e) => {
    const newPage = e.data;
    
    if (lastJumpedPage.current !== null) {
      const target = lastJumpedPage.current;
      const targetSpread = getSpreadIndex(target);
      const librarySpread = getSpreadIndex(newPage);
      
      if (targetSpread === librarySpread) {
        setPage(target);
        setPageInput(target + 1);
        localStorage.setItem('magazineCurrentPage', target.toString());
        lastJumpedPage.current = null;
        return;
      }
      lastJumpedPage.current = null;
    }

    setPage(newPage);
    setPageInput(newPage + 1);
    localStorage.setItem('magazineCurrentPage', newPage.toString());
  };

  const handlePageSubmit = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    let p = parseInt(pageInput, 10);
    if (p >= 1 && p <= numPages) {
      jumpToPage(p - 1);
      setErrorMsg("");
    } else {
      setErrorMsg(`La página debe estar entre 1 y ${numPages}.`);
      setTimeout(() => setErrorMsg(""), 3000);
      setPageInput(page + 1);
    }
  }, [pageInput, numPages, page, jumpToPage]);

  const nextButtonClick = useCallback(() => {
    if (book.current && book.current.pageFlip()) {
      book.current.pageFlip().flipNext();
    }
  }, []);

  const prevButtonClick = useCallback(() => {
    if (book.current && book.current.pageFlip()) {
      book.current.pageFlip().flipPrev();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('.magazine-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error entering fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div className={`magazine-container ${isFullscreen ? 'fullscreen-active' : ''}`} style={{ backgroundColor: bgColor }}>
      
      {/* Custom top bar header */}
      <div className="magazine-header">
        <Link to="/" state={{ skipVideo: true }} className="back-button-link">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span>Inicio</span>
        </Link>
        <div className="header-title">REVISTA UNIDAD MÍNIMA</div>
        <div style={{ width: 80 }}></div> {/* spacer to center title */}
      </div>

      <Document
        file="/unidad_minima_1_comprimido.pdf"
        onLoadSuccess={onDocumentLoadSuccess}
        onItemClick={({ pageNumber }) => jumpToPage(pageNumber - 1)}
        loading={<LoadingComponent />}
        error={<div className="pdf-error">Error al cargar el PDF.</div>}
      >
        {/* Main viewport with Sidebar drawer */}
        <div className="magazine-body">
          
          {/* Left Sidebar Drawer */}
          <div className={`magazine-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-tabs">
              <button 
                className={`tab-button ${sidebarTab === 'thumbnails' ? 'active' : ''}`}
                onClick={() => setSidebarTab('thumbnails')}
              >
                Miniaturas
              </button>
              <button 
                className={`tab-button ${sidebarTab === 'outline' ? 'active' : ''}`}
                onClick={() => setSidebarTab('outline')}
              >
                Índice
              </button>
            </div>

            <div className="sidebar-content">
              {sidebarTab === 'thumbnails' && numPages && (
                <div className="thumbnails-grid">
                  {Array.from(new Array(numPages), (el, index) => {
                    const pNum = index + 1;
                    const isCurrent = isSinglePage ? (page === index) : (page === index || (page > 0 && page % 2 === 0 ? page - 1 === index : page + 1 === index));
                    return (
                      <div 
                        key={`thumb_${pNum}`} 
                        className={`thumbnail-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => jumpToPage(index)}
                      >
                        <div className="thumbnail-wrapper">
                          <Page 
                            pageNumber={pNum} 
                            width={110} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                          />
                        </div>
                        <span className="thumbnail-label">{pNum}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {sidebarTab === 'outline' && (
                <div className="outline-list">
                  {!hasPdfOutline ? (
                    customOutline.map((item, idx) => (
                      <button 
                        key={`out_${idx}`}
                        className="outline-item"
                        onClick={() => jumpToPage(item.page - 1)}
                      >
                        <span className="outline-dot"></span>
                        <span className="outline-title">{item.title}</span>
                        <span className="outline-page-num">pág. {item.page}</span>
                      </button>
                    ))
                  ) : (
                    <Outline 
                      className="pdf-outline-render" 
                      onItemClick={({ pageNumber }) => jumpToPage(pageNumber - 1)} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Outer text overlays (shown on screen sides if desktop space permits) */}
          {page === 0 && (
            <div className="magazine-overlay-left">
              <h1>Revista de Arquitectura, Ciudad y Cultura pop</h1>
              <p className="description">Desliza para leer, explora la primera edición</p>
              <p className="footer-text">No te olvides seguirme en las redes</p>
              <div className="social-icons-row">
                <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
              </div>
            </div>
          )}

          {page === numPages - 1 && (
            <div className="magazine-overlay-right">
              <div className="last-page-block">
                <h1>Llegaste al final, GRACIAS!</h1>
                <p className="description">Si te gustó, ¡no te pierdas la siguiente edición! Seguime en redes y compartila con tus conocidos.</p>
                <div className="social-icons-row">
                  <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                  <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Backdrop on Mobile */}
          {isSidebarOpen && window.innerWidth < 768 && (
            <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
          )}

          {/* Workspace Area */}
          <div className="magazine-workspace">
            
            {/* Absolute navigation arrows on sides (Desktop only) */}
            {!isMobileSize && page > 0 && (
              <button className="book-arrow-btn left" onClick={prevButtonClick} title="Página anterior" style={{ zIndex: 10 }}>
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}
            {!isMobileSize && page < numPages - 1 && (
              <button className="book-arrow-btn right" onClick={nextButtonClick} title="Página siguiente" style={{ zIndex: 10 }}>
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            )}

            {/* Persistent Social Floating Bar (desktop only) */}
            {!isMobileSize && page > 0 && page < numPages - 1 && (
              <div className="social-icons-sidebar">
                <a href="https://www.instagram.com/_unidadminima?igsh=dHZwaDR2YWQ0ODVs" target="_blank" rel="noopener noreferrer" className="icon-button"><InstagramIcon /></a>
                <a href="https://www.tiktok.com/@sabru.fran?_r=1&_t=ZS-96PnXYFFB3s" target="_blank" rel="noopener noreferrer" className="icon-button"><TikTokIcon /></a>
              </div>
            )}

            {numPages && (
              <div className="flipbook-outer-container">
                  <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={4}
                    centerOnInit={true}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ step: 0.5, mode: 'toggle' }}
                    pinch={{ step: 5 }}
                    onZoom={(ref) => setZoomScale(ref.state.scale)}
                  >
                    {({ zoomIn, zoomOut, resetTransform, state }) => (
                      <TransformComponent
                        wrapperStyle={{ width: '100%', height: '100%' }}
                        contentStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <HTMLFlipBook 
                          key={isSinglePage ? 'portrait' : 'landscape'}
                          width={dimensions.width} 
                          height={dimensions.height} 
                          showCover={true}
                          usePortrait={isSinglePage}
                          maxShadowOpacity={isSinglePage ? 0.2 : 0.4}
                          useMouseEvents={false}
                          className="flipbook"
                          ref={book}
                          onFlip={onPage}
                          flippingTime={600}
                        >
                          {Array.from(new Array(numPages), (el, index) => {
                            const pNum = index + 1;
                            return (
                              <PageWrapper 
                                key={`page_${pNum}`} 
                                pageNumber={pNum} 
                                width={dimensions.width} 
                              />
                            );
                          })}
                        </HTMLFlipBook>
                      </TransformComponent>
                    )}
                  </TransformWrapper>
              </div>
            )}
          </div>
        </div>

        {/* Floating Glassmorphic Bottom Toolbar */}
        {numPages && (
          <div className="magazine-toolbar-container">
            <div className="magazine-toolbar">
              
              {/* Left section: Sidebar Toggle */}
              <div className="toolbar-section left">
                <button 
                  className={`toolbar-btn ${isSidebarOpen ? 'active' : ''}`}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  title="Mostrar/Ocultar Menú"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
              </div>

              {/* Center section: Pagination and Arrows */}
              <div className="toolbar-section center">
                <button 
                  className="toolbar-btn nav-arrow" 
                  onClick={() => jumpToPage(0)}
                  disabled={page === 0}
                  title="Primera página"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg>
                </button>

                <button 
                  className="toolbar-btn nav-arrow" 
                  onClick={prevButtonClick}
                  disabled={page === 0}
                  title="Anterior"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <form onSubmit={handlePageSubmit} className="toolbar-page-form">
                  <input 
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageSubmit}
                    className="toolbar-page-input"
                  />
                  <span className="toolbar-page-total">/ {numPages}</span>
                </form>

                <button 
                  className="toolbar-btn nav-arrow" 
                  onClick={nextButtonClick}
                  disabled={page === numPages - 1}
                  title="Siguiente"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>

                <button 
                  className="toolbar-btn nav-arrow" 
                  onClick={() => jumpToPage(numPages - 1)}
                  disabled={page === numPages - 1}
                  title="Última página"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>
                </button>
              </div>

              {/* Right section: Fullscreen Only */}
              <div className="toolbar-section right">
                <button 
                  className={`toolbar-btn ${zoomScale > 1 ? 'active' : ''}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                >
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"></path></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18-3a2 2 0 0 0-2-2h-3m3 16a2 2 0 0 1-2 2h-3m-8-2a2 2 0 0 0-2-2H5"></path></svg>
                  )}
                </button>
              </div>

            </div>
            {errorMsg && <div className="toolbar-error-toast">{errorMsg}</div>}
          </div>
        )}
      </Document>
    </div>
  );
};

export default MagazineViewer;
