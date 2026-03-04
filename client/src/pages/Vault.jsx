import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments, clearActiveDocument } from '../app/vaultSlice';
import VaultItems from '../components/VaultItems';
import VaultViewer from '../components/VaultViewer';

export default function Vault() {
  const dispatch = useDispatch();
  const { activeDocument, loading, error } = useSelector((s) => s.vault);
  const [view, setView] = useState('list');
  // Prevents the "No document selected" flash while fetchDocumentById is in-flight
  const [docReady, setDocReady] = useState(false);

  useEffect(() => {
    dispatch(fetchDocuments());
    return () => { dispatch(clearActiveDocument()); };
  }, [dispatch]);

  // Mark ready only once activeDocument actually arrives in Redux
  useEffect(() => {
    if (activeDocument && view === 'viewer') {
      setDocReady(true);
    }
  }, [activeDocument, view]);

  const handleDocumentSelect = () => {
    setDocReady(false); // reset — new doc is being fetched
    setView('viewer');
  };

  const handleBack = () => {
    dispatch(clearActiveDocument());
    setView('list');
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', overflow: 'hidden', position: 'relative', fontFamily: "'Google Sans', 'Segoe UI', sans-serif" }}>

      {/* ── List view ── */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: view === 'list' ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        background: '#f8f9fa', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          background: '#fff', borderBottom: '1px solid #e0e0e0',
          padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#4285F4" opacity="0.15"/>
            <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 5h14v14H5V5z" fill="#4285F4"/>
            <path d="M12 7l5 5-5 5-5-5 5-5z" fill="#4285F4"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#202124', letterSpacing: '-0.3px' }}>My Vault</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div className="spinner-border spinner-border-sm text-primary" />
          </div>
        )}
        {error && <div className="alert alert-danger m-3 py-2 small">{error}</div>}

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <VaultItems onSelect={handleDocumentSelect} />
        </div>
      </div>

      {/* ── Viewer ── */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: view === 'viewer' ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        background: '#fff', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <VaultViewer
          document={activeDocument}
          isLoading={!docReady}
          onBack={handleBack}
        />
      </div>

    </div>
  );
}