import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiDownload, FiFileText } from 'react-icons/fi';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const styles = `
  .viewer-toolbar {
    display: flex; align-items: center; gap: 8px;
    padding: 0 12px; height: 56px;
    background: #fff; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;
  }
  .viewer-back-btn {
    width: 40px; height: 40px; border: none; background: transparent;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #5f6368; transition: background 0.15s; flex-shrink: 0;
  }
  .viewer-back-btn:hover { background: #f1f3f4; color: #202124; }
  .viewer-ctrl-btn {
    width: 34px; height: 34px; border: none; background: transparent;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #5f6368; transition: background 0.15s; flex-shrink: 0; padding: 0;
  }
  .viewer-ctrl-btn:hover { background: rgba(0,0,0,0.07); }
  .viewer-pill {
    display: flex; align-items: center; gap: 2px;
    background: #f1f3f4; border-radius: 20px; padding: 3px 6px;
  }
  .viewer-download-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px;
    border-radius: 20px; border: none; background: #1a73e8; color: #fff;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; flex-shrink: 0;
  }
  .viewer-download-btn:hover { background: #1557b0; }
  .viewer-canvas-wrap {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    background: #525659;
    display: flex; flex-direction: column; align-items: center;
    padding: 20px 16px; gap: 12px;
  }
  .viewer-canvas-wrap .react-pdf__Document {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; width: 100%;
  }
  .viewer-canvas-wrap .react-pdf__Page {
    box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    border-radius: 2px; flex-shrink: 0;
  }
  .pdf-loading-wrap {
    width: 100%; display: flex; align-items: center; justify-content: center; padding: 80px 0;
  }
  @media (max-width: 480px) {
    .viewer-doc-name { display: none !important; }
    .viewer-download-label { display: none !important; }
    .viewer-download-btn { padding: 8px 10px; }
  }
`;

const PDFLoadingSpinner = () => (
  <div className="pdf-loading-wrap">
    <div className="spinner-border" role="status" style={{ color: '#fff', width: '2.5rem', height: '2.5rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default function VaultViewer({ document, isLoading, onBack }) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(false);

  const documentId = document?._id;

  // Reset cleanly whenever document changes — useEffect, never useMemo
  // Fires when clicking a NEW document
useEffect(() => {
  setPdfError(false);
  setNumPages(null);
}, [documentId]);

  // Pure data transform — no side effects inside
  const pdfSrc = useMemo(() => {
    if (!document?.data) return null;
    try {
      const binary = atob(document.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { data: bytes };
    } catch (e) {
      return null;
    }
  }, [document?.data]);

  // Fires when the same document is re-clicked (data reference changes after re-fetch)
useEffect(() => {
  if (pdfSrc) {
    setPdfError(false);
    setNumPages(null);
  }
}, [pdfSrc]);

  const handleLoadSuccess = useCallback(({ numPages }) => {
    setPdfError(false);
    setNumPages(numPages);
  }, []);

  // Only flag error when pdfSrc is valid — ignores spurious errors during transitions
  const handleLoadError = useCallback(() => {
    if (pdfSrc) setPdfError(true);
  }, [pdfSrc]);

  const handleDownload = () => {
    if (!document?.data) return;
    const binary = atob(document.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.originalName || `${document.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageWidth = window.innerWidth < 576 ? window.innerWidth - 32 : undefined;

  if (isLoading || !document) {
    return (
      <>
        <style>{styles}</style>
        {isLoading && (
          <div className="viewer-toolbar">
            <button className="viewer-back-btn" onClick={onBack} title="Back to files">
              <FiArrowLeft size={20} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isLoading ? '#525659' : '#f8f9fa', height: isLoading ? 'auto' : '100%' }}>
          {isLoading ? (
            <div className="spinner-border" role="status" style={{ color: '#fff', width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            <>
              <FiFileText size={52} style={{ opacity: 0.2, marginBottom: '16px', color: '#80868b' }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#80868b' }}>No document selected</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#80868b' }}>Pick a file from the list</p>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div className="viewer-toolbar">
          <button className="viewer-back-btn" onClick={onBack} title="Back">
            <FiArrowLeft size={20} />
          </button>
          <span className="viewer-doc-name" style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {document.name}
          </span>
          {numPages && (
            <span style={{ fontSize: '12px', color: '#80868b', flexShrink: 0 }}>
              {numPages} {numPages === 1 ? 'page' : 'pages'}
            </span>
          )}
          <div className="viewer-pill">
            <button className="viewer-ctrl-btn" onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))} title="Zoom out">
              <FiZoomOut size={15} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#202124', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button className="viewer-ctrl-btn" onClick={() => setScale(s => Math.min(2.5, +(s + 0.25).toFixed(2)))} title="Zoom in">
              <FiZoomIn size={15} />
            </button>
          </div>
          <button className="viewer-download-btn" onClick={handleDownload}>
            <FiDownload size={15} />
            <span className="viewer-download-label">Download</span>
          </button>
        </div>

        <div className="viewer-canvas-wrap">
          {pdfError ? (
            <div style={{ background: '#fce8e6', color: '#c5221f', borderRadius: '8px', padding: '16px 20px', margin: '20px', fontSize: '14px' }}>
              Failed to load PDF. Please try again.
            </div>
          ) : (
            <Document
              file={pdfSrc}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={<PDFLoadingSpinner />}
              error={null}
            >
              {numPages && Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  scale={scale}
                  width={pageWidth}
                  loading={
                    <div style={{ width: pageWidth || 595, height: 842, background: '#3a3a3a', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner-border spinner-border-sm" style={{ color: '#888' }} />
                    </div>
                  }
                />
              ))}
            </Document>
          )}
        </div>

      </div>
    </>
  );
}