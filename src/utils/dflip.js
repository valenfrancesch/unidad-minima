import { MAGAZINE_PDF_PUBLIC_PATH } from '../config/magazine';

const DFLIP_BASE = '/dflip/';
const BOOK_ELEMENT_ID = 'book_pdf';
const VIEWER_BG = '#1a2bc3';
const INIT_TIMEOUT_MS = 60000;
const READY_POLL_MS = 250;

let assetsPromise = null;
let translationObserver = null;
let activeAbortController = null;

const DFLIP_TEXT_ES_AR = {
  toggleSound: 'Activar/desactivar sonido',
  toggleThumbnails: 'Miniaturas',
  toggleOutline: 'Índice / marcadores',
  previousPage: 'Página anterior',
  nextPage: 'Página siguiente',
  toggleFullscreen: 'Pantalla completa',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  toggleHelp: 'Ayuda',
  singlePageMode: 'Una página',
  doublePageMode: 'Dos páginas',
  downloadPDFFile: 'Descargar PDF',
  gotoFirstPage: 'Primera página',
  gotoLastPage: 'Última página',
  play: 'Iniciar reproducción automática',
  pause: 'Pausar reproducción automática',
  share: 'Compartir',
  mailSubject: 'Te comparto este documento',
  mailBody: 'Mirá este sitio: {{url}}',
  loading: 'Cargando',
};

const TEXT_REPLACEMENTS = [
  [/Unable to load PDF service\.\./g, 'No se pudo cargar el servicio PDF.'],
  [/Cannot access file!\s*/g, 'No se puede acceder al archivo: '],
  [/ WEBGL 3D \.\.\./g, ' motor 3D...'],
  [/ PDF Worker CORS \.\.\./g, ' worker PDF (CORS)...'],
  [/ PDF Service \(require\) \.\.\./g, ' servicio PDF (require)...'],
  [/ PDF Service \.\.\./g, ' servicio PDF...'],
  [/ PDF Worker \.\.\./g, ' worker PDF...'],
  [/ PDF \.\.\./g, ' PDF...'],
  [
    /Your browser \(Internet Explorer\) is out of date to run DFlip Flipbook Plugin\./g,
    'Tu navegador (Internet Explorer) está desactualizado y no puede ejecutar el visor DFlip.',
  ],
  [/Upgrade to a new one/g, 'Actualizalo por uno más nuevo'],
  [
    /Unknown source type\. Please check documentation for help/g,
    'Tipo de origen desconocido. Consultá la documentación.',
  ],
];

function loadStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`No se pudo cargar ${href}`));
    document.head.appendChild(link);
  });
}

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}

function isAborted(signal) {
  return signal?.aborted === true;
}

export function isPortraitOrientation() {
  if (window.matchMedia('(orientation: portrait)').matches) {
    return true;
  }
  return window.innerHeight >= window.innerWidth;
}

export function getResponsivePageMode() {
  return isPortraitOrientation() ? 1 : 2;
}

export function resizeDFlipViewer() {
  if (window.book_pdf && typeof window.book_pdf.resize === 'function') {
    window.book_pdf.resize();
  }
  window.dispatchEvent(new Event('resize'));
}

export function applyResponsivePageMode() {
  if (!window.dflipUi || typeof window.dflipUi.setPageMode !== 'function') {
    return;
  }

  window.dflipUi.setPageMode(isPortraitOrientation());
  resizeDFlipViewer();
}

export function closeDFlipSidePanels() {
  const container = getDFlipContainer();
  if (!container) {
    return;
  }

  container.classList.remove('df-sidemenu-open');

  container
    .querySelectorAll('.df-ui-thumbnail.df-active, .df-ui-outline.df-active')
    .forEach((button) => button.click());

  const sidemenu = container.querySelector('.df-sidemenu');
  if (sidemenu) {
    sidemenu.classList.remove('df-sidemenu-visible');
  }
}

function translateText(text) {
  let result = text;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function translateNode(node) {
  if (node.nodeType !== Node.TEXT_NODE) {
    return;
  }
  const translated = translateText(node.textContent);
  if (translated !== node.textContent) {
    node.textContent = translated;
  }
}

function translateElementAttributes(element) {
  if (!element.hasAttribute('title')) {
    return;
  }
  const title = element.getAttribute('title');
  const translatedTitle = translateText(title);
  if (translatedTitle !== title) {
    element.setAttribute('title', translatedTitle);
  }
}

function walkTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateNode(node);
    node = walker.nextNode();
  }
}

export function setupDFlipTranslations() {
  if (translationObserver) {
    return;
  }

  translationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        translateNode(mutation.target);
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          translateNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          translateElementAttributes(node);
          walkTextNodes(node);
        }
      });
    });
  });

  translationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title'],
  });
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function getDFlipContainer() {
  const bookElement = document.getElementById(BOOK_ELEMENT_ID);
  if (!bookElement) {
    return null;
  }

  if (bookElement.classList.contains('df-container')) {
    return bookElement;
  }

  return bookElement.querySelector('.df-container');
}

function isDFlipBookReady() {
  if (window.book_pdf) {
    return true;
  }

  const container = getDFlipContainer();
  if (!container) {
    return false;
  }

  const loadingInfo = container.querySelector('.loading-info');
  if (loadingInfo && /100\s*%/.test(loadingInfo.textContent || '')) {
    return true;
  }

  return !container.classList.contains('df-loading') && !container.classList.contains('df-init');
}

function configureDFlipOptions(source, signal) {
  window.dFlipLocation = DFLIP_BASE;

  window.option_book_pdf = {
    source,
    webgl: false,
    height: '100%',
    backgroundColor: VIEWER_BG,
    pageMode: getResponsivePageMode(),
    autoEnableOutline: false,
    autoEnableThumbnail: false,
    enableDownload: false,
    hideControls: 'download',
    moreControls: 'pageMode,startPage,endPage,sound',
    text: DFLIP_TEXT_ES_AR,
    onCreateUI(ui) {
      if (isAborted(signal)) {
        return;
      }
      window.dflipUi = ui;
      closeDFlipSidePanels();
      applyResponsivePageMode();
    },
    onReady() {
      if (isAborted(signal)) {
        return;
      }
      closeDFlipSidePanels();
      window.setTimeout(closeDFlipSidePanels, 0);
      window.setTimeout(closeDFlipSidePanels, 300);
      applyResponsivePageMode();
      resizeDFlipViewer();
    },
  };
}

export function loadDFlipAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      await loadStylesheet(`${DFLIP_BASE}css/dflip.min.css`);
      await loadStylesheet(`${DFLIP_BASE}css/themify-icons.min.css`);
      window.dFlipLocation = DFLIP_BASE;

      if (!window.jQuery) {
        await loadScript(`${DFLIP_BASE}js/libs/jquery.min.js`);
      }

      // Precargar PDF.js antes de DFlip (el worker lo resuelve DFlip vía dFlipLocation)
      await loadScript(`${DFLIP_BASE}js/libs/compatibility.js`);
      await loadScript(`${DFLIP_BASE}js/libs/pdf.min.js`);

      if (!window.DFLIP) {
        await loadScript(`${DFLIP_BASE}js/dflip.min.js`);
      }
    })();
  }

  return assetsPromise;
}

function resetBookElement() {
  const bookElement = document.getElementById(BOOK_ELEMENT_ID);
  if (!bookElement) {
    return;
  }

  bookElement.removeAttribute('df-parsed');
  bookElement.removeAttribute('parsed');
  bookElement.innerHTML = '';
}

function parseDFlipBook() {
  resetBookElement();

  if (window.DFLIP?.parseBooks) {
    window.DFLIP.parseBooks();
  }
}

function waitUntilDFlipReady(signal) {
  return new Promise((resolve, reject) => {
    if (isDFlipBookReady()) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(pollId);
      reject(
        new Error(
          `La revista tardó demasiado en cargar. Verificá que el PDF exista en ${MAGAZINE_PDF_PUBLIC_PATH}.`,
        ),
      );
    }, INIT_TIMEOUT_MS);

    const pollId = window.setInterval(() => {
      if (isAborted(signal)) {
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        reject(new DOMException('Inicialización cancelada', 'AbortError'));
        return;
      }

      if (isDFlipBookReady()) {
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        resolve();
      }
    }, READY_POLL_MS);
  });
}

export async function initDFlipViewer(source) {
  activeAbortController?.abort();
  const abortController = new AbortController();
  activeAbortController = abortController;
  const { signal } = abortController;

  configureDFlipOptions(source, signal);
  setupDFlipTranslations();

  await waitForNextFrame();
  if (isAborted(signal)) {
    throw new DOMException('Inicialización cancelada', 'AbortError');
  }

  await loadDFlipAssets();
  if (isAborted(signal)) {
    throw new DOMException('Inicialización cancelada', 'AbortError');
  }

  await waitForNextFrame();
  if (isAborted(signal)) {
    throw new DOMException('Inicialización cancelada', 'AbortError');
  }

  // Si DFlip ya estaba cargado, forzar un nuevo parse del contenedor actual
  parseDFlipBook();

  window.setTimeout(() => {
    if (!isAborted(signal)) {
      resizeDFlipViewer();
    }
  }, 50);

  await waitUntilDFlipReady(signal);

  if (isAborted(signal)) {
    throw new DOMException('Inicialización cancelada', 'AbortError');
  }

  closeDFlipSidePanels();
  applyResponsivePageMode();
  resizeDFlipViewer();
}

export function destroyDFlipViewer() {
  activeAbortController?.abort();
  activeAbortController = null;

  const book = window.book_pdf;
  if (book && typeof book.destroy === 'function') {
    try {
      book.destroy();
    } catch {
      // ignorar errores al destruir tras Strict Mode
    }
  }

  resetBookElement();

  window.book_pdf = undefined;
  window.dflipUi = undefined;
  window.option_book_pdf = undefined;
}

export { BOOK_ELEMENT_ID };
