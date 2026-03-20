/**
 * PdfPasswordInput
 * Reusable password card for unlocking password-protected PDFs.
 *
 * Chrome/Edge trigger save-password purely on type="password".
 * Fix: always render type="text" and fake masking via CSS
 * -webkit-text-security so the browser never sees a password field.
 *
 * Props:
 *   onSubmit     (password: string) => void
 *   onCancel     () => void
 *   error?       string
 *   loading?     boolean
 *   fileName?    string
 *   submitLabel? string   default "Open PDF"
 *   cancelLabel? string   default "Cancel"
 */

import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function PdfPasswordInput({
  onSubmit,
  onCancel,
  error       = '',
  loading     = false,
  fileName    = '',
  submitLabel = 'Open PDF',
  cancelLabel = 'Cancel',
}) {
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) return;
    onSubmit(password.trim());
  };

  return (
    <>
      <style>{`
        .ppw-card {
          background: #fff;
          border-radius: 14px;
          padding: 28px 24px;
          width: 100%;
          max-width: 360px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ppw-input-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid #dadce0;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .ppw-input-wrap:focus-within { border-color: #1a73e8; }

        /*
         * KEY FIX: type="text" so Chrome never identifies this as a password
         * field. We fake masking with -webkit-text-security instead.
         * When showPwd is true we switch to 'none' via the .ppw-visible class.
         */
        .ppw-input {
          flex: 1;
          padding: 10px 14px;
          border: none;
          outline: none;
          font-size: 15px;
          background: transparent;
          -webkit-text-security: disc;
          letter-spacing: 0.1em;
        }
        .ppw-input.ppw-visible {
          -webkit-text-security: none;
          letter-spacing: normal;
        }

        .ppw-eye {
          padding: 0 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #80868b;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .ppw-eye:hover { color: #202124; }

        .ppw-submit {
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: #1a73e8;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ppw-submit:hover:not(:disabled) { background: #1557b0; }
        .ppw-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .ppw-cancel {
          padding: 8px;
          border: 1.5px solid #dadce0;
          border-radius: 8px;
          background: transparent;
          color: #5f6368;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ppw-cancel:hover { background: #f1f3f4; border-color: #bdc1c6; }
      `}</style>

      <div className="ppw-card">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiLock size={20} color="#1a73e8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124' }}>
              Password required
            </div>
            <div style={{ fontSize: '13px', color: '#80868b', marginTop: '2px' }}>
              {fileName
                ? <><strong>{fileName}</strong> is password protected</>
                : 'This PDF is password protected'}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: '13px', color: '#c5221f', background: '#fce8e6', borderRadius: '6px', padding: '8px 12px' }}>
            {error}
          </div>
        )}

        {/* Input */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            PDF Password
          </label>

          <div className="ppw-input-wrap">
            {/*
              type="text" — intentional. Chrome only triggers save/suggest/autofill
              on type="password". CSS -webkit-text-security handles visual masking.
            */}
            <input
              className={`ppw-input${showPwd ? ' ppw-visible' : ''}`}
              type="text"
              inputMode="text"
              placeholder="Enter password"
              value={password}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              autoSave="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button
              className="ppw-eye"
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd(v => !v)}
              title={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#80868b', marginTop: '6px', marginBottom: 0, lineHeight: 1.5 }}>
            Bank PDFs are often protected with your date of birth (DDMMYYYY),
            mobile number's last 4 digits, or account number.
          </p>
        </div>

        {/* Submit */}
        <button
          className="ppw-submit"
          onClick={handleSubmit}
          disabled={loading || !password.trim()}
        >
          <FiLock size={14} />
          {loading ? 'Opening…' : submitLabel}
        </button>

        {/* Cancel */}
        <button className="ppw-cancel" onClick={onCancel}>
          ← {cancelLabel}
        </button>

      </div>
    </>
  );
}