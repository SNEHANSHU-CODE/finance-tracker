/**
 * FileImportModal.jsx
 *
 * Multi-format import: PDF · CSV · XLSX
 * Supports password-protected PDFs with a dedicated unlock step.
 *
 * Field mapping → transactionModel.js  (mirrors Transactions.jsx handleSubmit):
 *   UI "Title"       → description   (required, max 100)
 *   UI "Description" → notes         (optional, max 200)
 *   amount           → amount        (positive; pre-save hook applies sign)
 *   type             → type          ("Income" | "Expense")
 *   category         → category      (validated enum)
 *   date             → date
 *   paymentMethod    → paymentMethod (default "Other")
 *   metadata.source  → "import"
 *
 * Steps:
 *   UPLOAD → [PASSWORD if locked PDF] → EXTRACTING → REVIEW → SAVING → DONE
 *
 * Layout:
 *   marginTop 5.4rem  → clears fixed navbar
 *   maxWidth 860px    → centred, not full viewport width
 */

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaFilePdf, FaFileCsv, FaFileExcel,
  FaTimes, FaEdit, FaTrash, FaCheck, FaSpinner,
  FaUpload, FaFileAlt, FaLock, FaEye, FaEyeSlash,
} from 'react-icons/fa';
import {
  extractTransactionsFromPDF,
  extractTransactionsFromCSV,
  extractTransactionsFromExcel,
  bulkInsertTransactions,
  fetchTransactions,
} from '../app/transactionSlice';

// ── Categories — mirror transactionModel.js enum ──────────────────────────────
const CATEGORIES_INCOME  = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other Income'];
const CATEGORIES_EXPENSE = [
  'Food', 'Transportation', 'Shopping', 'Entertainment', 'Utilities',
  'Healthcare', 'Education', 'Travel', 'Insurance', 'Rent', 'Other Expense',
];
const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other',
];

// ── Classifier ────────────────────────────────────────────────────────────────
const EXPENSE_KW = {
  Food:           ['food','restaurant','cafe','coffee','swiggy','zomato','eat','meal','lunch',
                   'dinner','breakfast','snack','grocery','groceries','supermarket','bakery',
                   'pizza','burger','biryani','bar','pub','dhaba','kitchen','canteen','tiffin'],
  Transportation: ['uber','ola','cab','auto','rickshaw','metro','bus','train','railway','irctc',
                   'fuel','petrol','diesel','parking','toll','transport','rapido','dunzo','bike'],
  Shopping:       ['amazon','flipkart','myntra','ajio','nykaa','meesho','shop','store','mall',
                   'mart','market','purchase','order','fashion','clothes','electronics','gadget'],
  Entertainment:  ['netflix','hotstar','spotify','youtube','prime','zee5','sonyliv','jiocinema',
                   'movie','cinema','game','gaming','stream','subscription','concert','ticket',
                   'bookmyshow','pvr','inox'],
  Utilities:      ['electricity','water','gas','broadband','internet','wifi','mobile','recharge',
                   'phone','postpaid','prepaid','utility','bill','dth','tata play','jio','airtel',
                   'bsnl','vodafone'],
  Healthcare:     ['hospital','clinic','doctor','pharmacy','medicine','medical','health','lab',
                   'test','diagnostic','apollo','medplus','netmeds','pharmeasy','1mg','dental',
                   'gym','fitness','yoga'],
  Education:      ['school','college','university','course','tuition','coaching','udemy',
                   'coursera','book','stationery','exam','certification','training','learn'],
  Travel:         ['flight','resort','hostel','airbnb','makemytrip','yatra','goibibo','redbus',
                   'cleartrip','holiday','tour','trip','travel','visa','airport'],
  Insurance:      ['insurance','premium','lic','policy','hdfc life','sbi life','bajaj allianz',
                   'star health','mediclaim'],
  Rent:           ['rent','lease','landlord','pg ','paying guest','flat','apartment',
                   'accommodation','housing','maintenance','society'],
};
const INCOME_KW = {
  Salary:     ['salary','sal ','payroll','wages','ctc','stipend','pay credit','net pay','compensation'],
  Freelance:  ['freelance','client payment','project payment','consulting','upwork','fiverr','invoice'],
  Bonus:      ['bonus','incentive','reward','performance','appraisal','commission'],
  Investment: ['dividend','interest','return','maturity','mutual fund','sip','stock','share',
               'zerodha','groww','fd interest','redemption','capital gain'],
};

function classifyCategory(text, type) {
  const lower = (text || '').toLowerCase();
  if (type === 'Income') {
    for (const [cat, kws] of Object.entries(INCOME_KW))
      if (kws.some(k => lower.includes(k))) return cat;
    return 'Other Income';
  }
  for (const [cat, kws] of Object.entries(EXPENSE_KW))
    if (kws.some(k => lower.includes(k))) return cat;
  return 'Other Expense';
}

function resolveType(raw) {
  if (raw.type === 'Income' || raw.type === 'Expense') return raw.type;
  if (typeof raw.amount === 'number' && raw.amount < 0) return 'Expense';
  const text = `${raw.description || ''} ${raw.narration || ''}`.toLowerCase();
  if (Object.values(INCOME_KW).flat().some(k => text.includes(k))) return 'Income';
  return 'Expense';
}

function normaliseRow(raw, localId) {
  const todayISO = new Date().toISOString().split('T')[0];
  const title = (raw.description || raw.narration || raw.name || '').trim()
    || 'Unnamed Transaction';
  const rawNotes = (raw.notes || raw.comment || '').trim();
  const notes = (rawNotes && rawNotes !== title) ? rawNotes : '';

  let date = todayISO;
  if (raw.date) {
    const p = new Date(raw.date);
    if (!isNaN(p)) date = p.toISOString().split('T')[0];
  }

  const amount = Math.abs(parseFloat(raw.amount) || 0);
  const type   = resolveType(raw);
  const validList = type === 'Income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
  let category = raw.category || '';
  if (!validList.includes(category)) category = classifyCategory(title, type);
  const paymentMethod = PAYMENT_METHODS.includes(raw.paymentMethod)
    ? raw.paymentMethod : 'Other';

  return { _localId: localId, title, notes, date, type, category, amount, paymentMethod };
}

// ── File helpers ──────────────────────────────────────────────────────────────
const FILE_TYPES = {
  pdf:  { label: 'PDF',   Icon: FaFilePdf,   color: '#e74c3c' },
  csv:  { label: 'CSV',   Icon: FaFileCsv,   color: '#27ae60' },
  xlsx: { label: 'Excel', Icon: FaFileExcel, color: '#217346' },
};

function detectFileType(file) {
  const n = file.name.toLowerCase();
  if (n.endsWith('.pdf'))  return 'pdf';
  if (n.endsWith('.csv'))  return 'csv';
  if (n.endsWith('.xlsx')) return 'xlsx';
  return null;
}

function getThunk(ft) {
  if (ft === 'csv')  return extractTransactionsFromCSV;
  if (ft === 'xlsx') return extractTransactionsFromExcel;
  return extractTransactionsFromPDF;
}

const STEP = {
  UPLOAD:      'upload',
  PASSWORD:    'password',   // ← NEW: PDF is locked, ask user for password
  EXTRACTING:  'extracting',
  REVIEW:      'review',
  SAVING:      'saving',
  DONE:        'done',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function FileImportModal({ onClose }) {
  const dispatch = useDispatch();
  const { filters, pagination } = useSelector(s => s.transaction);
  const userId = useSelector(s => s.auth.user?.userId);

  const fileInputRef              = useRef(null);
  const passwordInputRef          = useRef(null);
  const [step,        setStep]    = useState(STEP.UPLOAD);
  const [error,       setError]   = useState('');
  const [rows,        setRows]    = useState([]);
  const [editIdx,     setEditIdx] = useState(null);
  const [editData,    setEditData]= useState({});
  const [fileInfo,    setFileInfo]= useState(null);
  const [fileObj,     setFileObj] = useState(null);   // kept for password retry
  const [dragging,    setDragging]= useState(false);
  const [password,    setPassword]= useState('');
  const [showPwd,     setShowPwd] = useState(false);
  const [pwdWrong,    setPwdWrong]= useState(false);  // shows "incorrect" hint

  // ── Core extract helper (used on first attempt and password retry) ──────────
  const runExtract = async (file, ft, pwd = null) => {
    setStep(STEP.EXTRACTING);
    setError('');
    try {
      const payload  = ft === 'pdf' ? { file, password: pwd } : file;
      const thunk    = getThunk(ft);
      const result   = await dispatch(thunk(payload)).unwrap();

      // Backend signals a locked PDF
      if (result.needs_password) {
        setPwdWrong(!!pwd);        // if we sent a password and still got this, it was wrong
        setPassword('');
        setStep(STEP.PASSWORD);
        setTimeout(() => passwordInputRef.current?.focus(), 100);
        return;
      }

      if (!result.success || result.count === 0) {
        setError(result.message || 'No transactions found in this file.');
        setStep(STEP.UPLOAD);
        return;
      }

      setRows(result.transactions.map((t, i) => normaliseRow(t, i)));
      setStep(STEP.REVIEW);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to extract transactions.');
      setStep(STEP.UPLOAD);
    }
  };

  // ── File selected from input or drop ───────────────────────────────────────
  const processFile = (file) => {
    const ft = detectFileType(file);
    if (!ft) { setError('Unsupported file. Please upload PDF, CSV, or XLSX.'); return; }
    setFileInfo({ name: file.name, type: ft });
    setFileObj(file);
    setPwdWrong(false);
    setPassword('');
    runExtract(file, ft, null);
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  // ── Password submit ────────────────────────────────────────────────────────
  const handlePasswordSubmit = () => {
    const pwd = password.trim();
    if (!pwd) return;
    runExtract(fileObj, fileInfo.type, pwd);
  };

  // ── Row editing ────────────────────────────────────────────────────────────
  const startEdit  = (idx) => { setEditIdx(idx); setEditData({ ...rows[idx] }); };
  const cancelEdit = ()    => { setEditIdx(null); setEditData({}); };
  const saveEdit   = () => {
    const title = (editData.title || '').trim() || 'Unnamed Transaction';
    setRows(prev =>
      prev.map((r, i) => i === editIdx ? { ...editData, title, _localId: r._localId } : r)
    );
    setEditIdx(null);
    setEditData({});
  };
  const deleteRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  // ── Save to backend ────────────────────────────────────────────────────────
  const handleAddAll = async () => {
    if (!rows.length) { setError('No transactions to save.'); return; }
    setError('');
    setStep(STEP.SAVING);
    const payload = rows.map(({ _localId, title, notes, ...rest }) => ({
      description: title,
      notes:       notes || undefined,
      ...rest,
      metadata: { source: 'import' },
    }));
    try {
      await dispatch(bulkInsertTransactions(payload)).unwrap();
      if (userId) {
        dispatch(fetchTransactions({
          userId,
          page:  pagination.currentPage  || 1,
          limit: pagination.itemsPerPage || 10,
          ...filters,
        }));
      }
      setStep(STEP.DONE);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save transactions.');
      setStep(STEP.REVIEW);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const FileTypeIcon = ({ type, size = 26 }) => {
    const info = FILE_TYPES[type];
    if (!info) return <FaFileAlt size={size} color="#888" />;
    return <info.Icon size={size} color={info.color} />;
  };

  const resetToUpload = () => {
    setStep(STEP.UPLOAD); setRows([]); setError('');
    setFileInfo(null); setFileObj(null);
    setPassword(''); setPwdWrong(false);
  };

  // Inline edit row
  const EditRow = () => {
    const validCats = editData.type === 'Income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
    return (
      <tr style={{ background: '#fffef2' }}>
        <td style={{ minWidth: 130 }}>
          <input type="date" className="form-control form-control-sm"
            value={editData.date || ''}
            onChange={e => setEditData(d => ({ ...d, date: e.target.value }))} />
        </td>
        <td style={{ minWidth: 155 }}>
          <input type="text" className="form-control form-control-sm"
            placeholder="Title *" maxLength={100}
            value={editData.title || ''}
            onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
        </td>
        <td style={{ minWidth: 105 }}>
          <input type="number" step="0.01" min="0.01" className="form-control form-control-sm"
            value={editData.amount || ''}
            onChange={e => setEditData(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} />
        </td>
        <td style={{ minWidth: 100 }}>
          <select className="form-select form-select-sm"
            value={editData.type || 'Expense'}
            onChange={e => setEditData(d => ({
              ...d, type: e.target.value,
              category: e.target.value === 'Income' ? 'Other Income' : 'Other Expense',
            }))}>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </td>
        <td style={{ minWidth: 148 }}>
          <select className="form-select form-select-sm"
            value={editData.category || validCats[0]}
            onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}>
            {validCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td style={{ minWidth: 148 }}>
          <input type="text" className="form-control form-control-sm"
            placeholder="Optional" maxLength={200}
            value={editData.notes || ''}
            onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
        </td>
        <td>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-success" onClick={saveEdit} title="Save">
              <FaCheck size={11} />
            </button>
            <button className="btn btn-sm btn-secondary" onClick={cancelEdit} title="Cancel">
              <FaTimes size={11} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== STEP.SAVING) onClose(); }}
    >
      <div
        className="modal-dialog modal-dialog-scrollable"
        style={{ maxWidth: 860, width: '95vw', margin: '5.4rem auto 1.5rem' }}
      >
        <div className="modal-content shadow">

          {/* Header */}
          <div className="modal-header py-3">
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0"
                style={{ fontSize: '1rem' }}>
              {step === STEP.PASSWORD
                ? <><FaLock className="text-warning" size={14} /> Unlock PDF</>
                : <><FaUpload className="text-primary" size={14} /> Import Transactions</>
              }
            </h5>
            {step !== STEP.SAVING && <button className="btn-close" onClick={onClose} />}
          </div>

          {/* Body */}
          <div className="modal-body">

            {/* Error banner */}
            {error && (
              <div className="alert alert-danger py-2 mb-3 d-flex justify-content-between align-items-center">
                <span className="small">{error}</span>
                <button className="btn-close btn-sm ms-2" onClick={() => setError('')} />
              </div>
            )}

            {/* ── UPLOAD ── */}
            {step === STEP.UPLOAD && (
              <div>
                <div
                  className="border border-2 rounded-3 p-4 mb-3 text-center"
                  style={{
                    borderStyle: 'dashed',
                    borderColor: dragging ? '#0d6efd' : '#dee2e6',
                    background:  dragging ? '#f0f5ff' : 'transparent',
                    cursor: 'pointer',
                    transition: 'border-color .15s, background .15s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="d-flex justify-content-center gap-3 mb-2">
                    <FileTypeIcon type="pdf" />
                    <FileTypeIcon type="csv" />
                    <FileTypeIcon type="xlsx" />
                  </div>
                  <p className="fw-semibold mb-1" style={{ fontSize: '0.95rem' }}>
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-muted small mb-0">PDF · CSV · Excel (.xlsx)</p>
                </div>

                <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx"
                  className="d-none" onChange={handleFileSelect} />

                <div className="d-flex justify-content-center gap-2 mb-3">
                  {Object.entries(FILE_TYPES).map(([key, ft]) => (
                    <span key={key} className="badge rounded-pill" style={{
                      background: ft.color + '18', color: ft.color,
                      border: `1px solid ${ft.color}44`,
                      fontSize: '0.72rem', padding: '5px 12px', fontWeight: 500,
                    }}>
                      <ft.Icon size={10} style={{ marginRight: 4 }} />
                      {ft.label}
                    </span>
                  ))}
                </div>

                <div className="text-center mb-3">
                  <button className="btn btn-primary px-4"
                    onClick={() => fileInputRef.current?.click()}>
                    <FaUpload size={13} style={{ marginRight: 7 }} />
                    Choose File
                  </button>
                </div>

                <div className="rounded-3 p-3" style={{ background: '#f8f9fa' }}>
                  <p className="small fw-semibold text-muted mb-1">Tips for best results</p>
                  <ul className="small text-muted mb-0 ps-3" style={{ lineHeight: 1.8 }}>
                    <li>PDF — bank statements and salary slips work best</li>
                    <li>CSV / Excel — needs Date, Description and Amount columns</li>
                    <li>Password-protected PDFs are supported</li>
                    <li>Dates default to today if not found in the file</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── PASSWORD ── */}
            {step === STEP.PASSWORD && (
              <div className="d-flex flex-column align-items-center py-3">

                {/* Lock icon */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 56, height: 56, background: '#fff8e1', border: '2px solid #ffe082' }}
                >
                  <FaLock style={{ color: '#f59e0b' }} size={22} />
                </div>

                <h6 className="fw-semibold mb-1" style={{ fontSize: '0.95rem' }}>
                  PDF is password protected
                </h6>
                <p className="text-muted small mb-4 text-center" style={{ maxWidth: 340 }}>
                  <span
                    className="badge bg-light text-dark border me-1"
                    style={{ fontSize: '0.72rem', fontWeight: 400 }}
                  >
                    <FaFilePdf size={9} style={{ color: '#e74c3c', marginRight: 3 }} />
                    {fileInfo?.name}
                  </span>
                  requires a password to open.
                </p>

                {/* Wrong password alert */}
                {pwdWrong && (
                  <div
                    className="d-flex align-items-center gap-2 rounded-3 px-3 py-2 mb-3 small"
                    style={{
                      background: '#fff3cd', border: '1px solid #ffc107',
                      color: '#856404', width: '100%', maxWidth: 380,
                    }}
                  >
                    <FaLock size={11} />
                    Incorrect password — please try again.
                  </div>
                )}

                {/* Password input — dummy hidden inputs prevent Chrome save-password dialog */}
                <div
                  className="rounded-3 p-3"
                  style={{
                    width: '100%', maxWidth: 380,
                    background: '#f8f9fa', border: '1px solid #e9ecef',
                  }}
                >
                  <label className="form-label small fw-semibold mb-2" style={{ color: '#495057' }}>
                    Enter PDF Password
                  </label>

                  {/* aria-hidden decoys: Chrome needs BOTH a text + password decoy to stay quiet */}
                  <div aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <input type="text" name="prevent_autofill" tabIndex={-1} readOnly />
                    <input type="password" name="prevent_autofill_pwd" tabIndex={-1} readOnly />
                  </div>

                  <div className="input-group">
                    <input
                      ref={passwordInputRef}
                      type={showPwd ? 'text' : 'password'}
                      className={`form-control${pwdWrong ? ' border-warning' : ''}`}
                      placeholder="Enter password"
                      value={password}
                      name="pdf_document_password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd(v => !v)}
                      title={showPwd ? 'Hide' : 'Show'}
                    >
                      {showPwd ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                  </div>

                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.73rem', lineHeight: 1.5 }}>
                    Bank PDFs are commonly protected with your mobile number's last 4 digits,
                    date of birth (DDMMYYYY), or account number.
                  </p>
                </div>
              </div>
            )}

            {/* ── EXTRACTING ── */}
            {step === STEP.EXTRACTING && (
              <div className="text-center py-5">
                <FaSpinner className="fa-spin text-primary mb-3" size={42} />
                <p className="fw-semibold mb-1">Extracting transactions…</p>
                <p className="text-muted small">
                  Reading your {fileInfo?.type?.toUpperCase()} — {fileInfo?.name}
                </p>
              </div>
            )}

            {/* ── REVIEW ── */}
            {step === STEP.REVIEW && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <p className="small mb-0">
                    <span className="fw-semibold">{rows.length}</span>
                    <span className="text-muted">
                      {' '}transaction{rows.length !== 1 ? 's' : ''} extracted
                    </span>
                    {fileInfo && (
                      <>
                        <span className="text-muted"> from </span>
                        <span className="badge bg-light text-dark border"
                          style={{ fontSize: '0.71rem', fontWeight: 500 }}>
                          <FileTypeIcon type={fileInfo.type} size={10} />
                          <span style={{ marginLeft: 4 }}>{fileInfo.name}</span>
                        </span>
                      </>
                    )}
                  </p>
                  <button className="btn btn-sm btn-outline-secondary" onClick={resetToUpload}>
                    ← Re-upload
                  </button>
                </div>

                {rows.length === 0 ? (
                  <p className="text-center text-muted py-4 mb-0">
                    All rows deleted. Re-upload or close.
                  </p>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '52vh' }}>
                    <table className="table table-sm table-hover align-middle mb-0"
                      style={{ fontSize: '0.82rem' }}>
                      <thead className="table-light sticky-top">
                        <tr>
                          <th style={{ minWidth: 100 }}>Date</th>
                          <th style={{ minWidth: 155 }}>Title</th>
                          <th style={{ minWidth: 90  }}>Amount</th>
                          <th style={{ minWidth: 88  }}>Type</th>
                          <th style={{ minWidth: 132 }}>Category</th>
                          <th style={{ minWidth: 140 }}>Description</th>
                          <th style={{ minWidth: 70  }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) =>
                          editIdx === idx
                            ? <EditRow key={row._localId} />
                            : (
                              <tr key={row._localId}>
                                <td className="text-muted">{row.date}</td>
                                <td>
                                  <div className="fw-medium text-truncate"
                                    style={{ maxWidth: 165 }} title={row.title}>
                                    {row.title}
                                  </div>
                                </td>
                                <td className={`fw-semibold ${row.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                                  {row.type === 'Income' ? '+' : '−'}
                                  {Number(row.amount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  <span className={`badge ${row.type === 'Income' ? 'bg-success' : 'bg-danger'} bg-opacity-75`}>
                                    {row.type}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border"
                                    style={{ fontWeight: 500 }}>
                                    {row.category}
                                  </span>
                                </td>
                                <td className="text-muted text-truncate"
                                  style={{ maxWidth: 150 }} title={row.notes}>
                                  {row.notes || <span style={{ opacity: 0.3 }}>—</span>}
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-sm btn-outline-primary"
                                      onClick={() => startEdit(idx)}
                                      disabled={editIdx !== null} title="Edit">
                                      <FaEdit size={11} />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger"
                                      onClick={() => deleteRow(idx)}
                                      disabled={editIdx !== null} title="Delete">
                                      <FaTrash size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── SAVING ── */}
            {step === STEP.SAVING && (
              <div className="text-center py-5">
                <FaSpinner className="fa-spin text-primary mb-3" size={42} />
                <p className="fw-semibold mb-1">Saving {rows.length} transactions…</p>
                <p className="text-muted small">Please wait</p>
              </div>
            )}

            {/* ── DONE ── */}
            {step === STEP.DONE && (
              <div className="text-center py-4">
                <div className="rounded-circle d-inline-flex align-items-center
                  justify-content-center mb-3"
                  style={{ width: 64, height: 64, background: '#d1fae5' }}>
                  <FaCheck className="text-success" size={28} />
                </div>
                <h6 className="mb-1">Import complete!</h6>
                <p className="text-muted small mb-0">
                  Your transactions have been added successfully.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer py-2">

            {step === STEP.PASSWORD && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={resetToUpload}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-sm px-4"
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim()}
                >
                  <FaLock size={11} style={{ marginRight: 6 }} />
                  Unlock &amp; Import
                </button>
              </>
            )}

            {step === STEP.REVIEW && (
              <>
                <button className="btn btn-secondary btn-sm"
                  onClick={onClose} disabled={editIdx !== null}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm px-3"
                  onClick={handleAddAll}
                  disabled={rows.length === 0 || editIdx !== null}>
                  <FaCheck size={11} style={{ marginRight: 6 }} />
                  Import {rows.length} Transaction{rows.length !== 1 ? 's' : ''}
                </button>
              </>
            )}

            {step === STEP.DONE && (
              <button className="btn btn-success btn-sm px-4" onClick={onClose}>
                Done
              </button>
            )}

            {(step === STEP.UPLOAD || step === STEP.EXTRACTING) && (
              <button className="btn btn-secondary btn-sm"
                onClick={onClose} disabled={step === STEP.EXTRACTING}>
                Cancel
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}