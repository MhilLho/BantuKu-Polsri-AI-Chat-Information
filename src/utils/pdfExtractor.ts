import * as pdfjsLib from 'pdfjs-dist';

// Use worker from unpkg or cdnjs corresponding to the installed version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedPdfResult {
  text: string;
  numPages: number;
  fileName: string;
  titleSuggestion: string;
  summarySuggestion: string;
}

export async function extractTextFromPdf(file: File): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item: any) => (item && 'str' in item ? item.str : ''))
      .filter((s: string) => s.trim().length > 0);

    const pageJoined = strings.join(' ').replace(/\s+/g, ' ').trim();
    if (pageJoined) {
      pageTexts.push(`[Halaman ${pageNum}]\n${pageJoined}`);
    }
  }

  const fullText = pageTexts.join('\n\n');
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Generate simple summary suggestion
  let summary = '';
  if (fullText.length > 0) {
    const cleanFirstChars = fullText.replace(/\[Halaman \d+\]/g, '').trim();
    summary = cleanFirstChars.slice(0, 160).replace(/\s+/g, ' ') + '...';
  }

  return {
    text: fullText,
    numPages: pdf.numPages,
    fileName: file.name,
    titleSuggestion: baseName,
    summarySuggestion: summary,
  };
}
