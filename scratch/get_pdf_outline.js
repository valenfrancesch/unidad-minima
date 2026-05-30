import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function run() {
  try {
    const doc = await getDocument('public/unidad_minima_1_comprimido.pdf').promise;
    console.log("PDF loaded successfully. Number of pages:", doc.numPages);
    
    // Check pages 2 to 8 for table of contents
    for (let pNum = 2; pNum <= 8; pNum++) {
      console.log(`\n--- PAGE ${pNum} TEXT ---`);
      const page = await doc.getPage(pNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      console.log(text);
    }
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}

run();
