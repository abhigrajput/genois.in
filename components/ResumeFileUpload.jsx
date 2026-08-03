'use client';
import { useRef, useState } from 'react';

/**
 * Client-side resume text extraction for the ATS page.
 *
 * Everything happens in the browser: the file is never uploaded, no new API
 * route exists, and /api/resume/analyze still receives exactly what it always
 * did — plain text from the textarea. The extracted text is written back into
 * that textarea so the student can read and fix it before analyzing, which
 * matters because PDF extraction is approximate by nature.
 *
 * pdfjs-dist and mammoth are imported lazily inside the handler so neither ends
 * up in the page's initial bundle — they only load when a file is actually
 * picked.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Below this, a PDF that "parsed fine" almost certainly has no text layer — it
// is a scan or an image export. Telling the student that is far more useful
// than handing them three characters of noise and an ATS score built on it.
const MIN_MEANINGFUL_CHARS = 50;

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function fileKind(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file?.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx') || file?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  // .doc is the old binary format — mammoth cannot read it, so it is refused by
  // name rather than failing later with an unexplained parse error.
  if (name.endsWith('.doc')) return 'legacy-doc';
  return 'unsupported';
}

/**
 * Rebuild reading-order text from a pdf.js text-content stream.
 *
 * pdf.js hands back positioned fragments, not lines — concatenating them
 * blindly runs every bullet of a resume into one paragraph, which then reads to
 * the ATS analyzer as "long paragraphs instead of bullets". Fragments are
 * grouped by their baseline Y so the line structure survives.
 */
function itemsToText(items) {
  const lines = [];
  let parts = [];
  let lineY = null;

  const flush = () => {
    if (parts.length) lines.push(parts.join(''));
    parts = [];
    lineY = null;
  };

  for (const item of items) {
    if (typeof item?.str !== 'string') continue;
    const y = item.transform?.[5];
    // 2.5pt of tolerance absorbs sub-pixel baseline jitter within one line
    // without merging genuinely separate lines.
    if (lineY !== null && typeof y === 'number' && Math.abs(y - lineY) > 2.5) flush();
    if (lineY === null && typeof y === 'number') lineY = y;
    parts.push(item.str);
    if (item.hasEOL) flush();
  }
  flush();

  return lines
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

async function extractPdf(file, onProgress) {
  const pdfjs = await import('pdfjs-dist');

  // pdf.js parses in a Web Worker, served from public/ at a fixed path.
  //
  // This was previously `new URL('pdfjs-dist/build/pdf.worker.min.mjs',
  // import.meta.url)`. Webpack turns that into an emitted asset, but Turbopack
  // — the default bundler for `next build` in Next 16, and therefore what
  // Vercel runs — does not, so the deployed build 404'd on the worker while
  // local dev worked. A public/ path resolves identically under either bundler.
  //
  // scripts/copy-pdf-worker.mjs refreshes that copy on install and before every
  // build, so it can never drift from the installed pdfjs-dist: pdf.js refuses
  // to run when the worker and API versions differ.
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  // destroy() lives on the loading task, not the document proxy — releasing the
  // worker matters here because a student may try several files in a row.
  const loadingTask = pdfjs.getDocument({ data: buffer });

  try {
    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;
    const pages = [];
    for (let n = 1; n <= pageCount; n++) {
      onProgress?.(`Reading page ${n} of ${pageCount}…`);
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(itemsToText(content.items));
      page.cleanup();
    }
    return { text: pages.filter(Boolean).join('\n\n'), pageCount };
  } finally {
    loadingTask.destroy().catch(() => {});
  }
}

async function extractDocx(file, onProgress) {
  onProgress?.('Reading document…');
  // The browser build; the default entry pulls in Node-only modules.
  const mammoth = await import('mammoth/mammoth.browser.js');
  const run = mammoth.default || mammoth;
  const buffer = await file.arrayBuffer();
  const result = await run.extractRawText({ arrayBuffer: buffer });
  return { text: (result?.value || '').replace(/\n{3,}/g, '\n\n').trim(), pageCount: null };
}

// Turn a thrown parse error into something the student can act on. Anything
// unrecognised keeps its real message rather than becoming "something failed".
function failureMessage(err, kind) {
  const name = String(err?.name || '');
  const msg = String(err?.message || '');

  if (name === 'PasswordException' || /password/i.test(msg)) {
    return 'This PDF is password-protected. Remove the password (or open it and re-save a copy without one) and try again.';
  }
  if (name === 'InvalidPDFException' || /invalid pdf|corrupt/i.test(msg)) {
    return 'This file is not a readable PDF — it may be corrupted or only partly downloaded. Try re-exporting it, or paste the text instead.';
  }
  if (/zip|end of central directory|not a valid|body element/i.test(msg)) {
    return 'This DOCX could not be read — it may be corrupted or saved in a different format. Try re-saving it as .docx, or paste the text instead.';
  }
  // A version mismatch means public/pdf.worker.min.mjs went stale against the
  // installed pdfjs-dist — a deploy problem, not the student's browser. Name it
  // so it is diagnosable from a screenshot instead of looking like a hiccup.
  if (/does not match the Worker version|API version/i.test(msg)) {
    return 'The PDF reader is misconfigured on our side (version mismatch) — we are on it. Paste your resume text instead for now.';
  }
  if (/worker/i.test(msg)) {
    return 'The PDF reader failed to start in your browser. Reload the page and try again, or paste the text instead.';
  }
  return `Could not read this ${kind === 'pdf' ? 'PDF' : 'document'}: ${msg || 'unknown parsing error'}. Paste the text manually instead.`;
}

export default function ResumeFileUpload({ onExtract, disabled = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file) {
    if (!file || busy) return;
    setError(null);
    setSuccess(null);

    const kind = fileKind(file);
    if (kind === 'legacy-doc') {
      setError('.doc (the old Word format) can’t be read here. Open it in Word or Google Docs and save it as .docx or PDF, then upload that.');
      return;
    }
    if (kind === 'unsupported') {
      setError(`"${file.name}" isn’t a supported file. Upload a PDF or DOCX, or paste your resume text below.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)} MB — the limit is 10 MB. A text-based resume is normally well under 1 MB.`);
      return;
    }
    if (file.size === 0) {
      setError('That file is empty. Check it opens correctly, then try again.');
      return;
    }

    setBusy(true);
    setProgress('Opening file…');
    try {
      const { text, pageCount } = kind === 'pdf'
        ? await extractPdf(file, setProgress)
        : await extractDocx(file, setProgress);

      const clean = (text || '').trim();

      // A PDF with no text layer parses perfectly and yields nothing. Silence
      // here, or filling the textarea with a few stray characters, would send
      // garbage into the analyzer and produce a confidently wrong ATS score.
      if (clean.length < MIN_MEANINGFUL_CHARS) {
        setError(
          kind === 'pdf'
            ? 'This PDF has no selectable text (it may be scanned) — paste the text manually instead.'
            : 'This document appears to contain no readable text — paste the text manually instead.'
        );
        return;
      }

      onExtract?.(clean);
      setSuccess(
        `Loaded ${file.name}${pageCount ? ` · ${pageCount} page${pageCount === 1 ? '' : 's'}` : ''} · ${clean.length.toLocaleString()} characters. Review the text below before analyzing.`
      );
    } catch (err) {
      console.error('[resume upload] extraction failed:', err);
      setError(failureMessage(err, kind));
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  const interactive = !disabled && !busy;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        onDragOver={e => { e.preventDefault(); if (interactive) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => interactive && inputRef.current?.click()}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && interactive) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-disabled={!interactive}
        aria-busy={busy}
        style={{
          border: `1px dashed ${dragging ? 'var(--gx-accent)' : 'var(--gx-border)'}`,
          background: dragging ? 'var(--gx-accent-soft)' : 'var(--gx-bg)',
          borderRadius: 14,
          padding: '20px 18px',
          textAlign: 'center',
          cursor: interactive ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s ease, border-color 0.2s ease',
          outline: 'none',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            // Reset first so picking the same file twice still fires onChange.
            e.target.value = '';
            if (file) handleFile(file);
          }}
        />

        {busy ? (
          <>
            <div style={{ fontSize: 22, marginBottom: 8 }}>⏳</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-text)' }}>
              Extracting text…
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginTop: 6 }}>
              {progress || 'Working…'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, marginBottom: 8 }}>📎</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-text)' }}>
              Upload PDF or DOCX
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', marginTop: 6, lineHeight: 1.6 }}>
              Drag your resume here, or click to choose a file. The text is read in your browser and dropped into the box below — nothing is uploaded.
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 10, padding: '11px 14px', borderRadius: 10,
            background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)',
            fontSize: 12.5, color: 'var(--gx-text)', lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      )}

      {success && !error && (
        <div
          role="status"
          style={{
            marginTop: 10, padding: '11px 14px', borderRadius: 10,
            background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)',
            fontSize: 12.5, color: 'var(--gx-text)', lineHeight: 1.6,
          }}
        >
          ✓ {success}
        </div>
      )}
    </div>
  );
}
