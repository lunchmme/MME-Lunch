import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import AdminShell from './AdminShell.jsx'
import { Ticket } from './CheckoutPage.jsx'
import { extractTicketKey } from './ticket.js'

export default function ScannerPage() {
  return <AdminShell active="scan">{api => <Scanner api={api} />}</AdminShell>
}

function Scanner({ api }) {
  const video = useRef(null)
  const scanner = useRef(null)
  const mounted = useRef(false)
  const handled = useRef(false)
  const operation = useRef(false)
  const result = useRef(null)
  const [camera, setCamera] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState(null)

  const showResult = useCallback(() => {
    if (!window.matchMedia('(max-width: 700px)').matches) return
    requestAnimationFrame(() => result.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    }))
  }, [])

  function accept(value) {
    scanner.current?.stop()
    setCamera(false); setError(''); setTicket(null)
    try { setTicket({ key: extractTicketKey(value), scan: Date.now() }) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => {
    mounted.current = true
    const instance = new QrScanner(video.current, result => {
      if (!mounted.current || handled.current) return
      handled.current = true
      accept(result.data)
    }, { preferredCamera: 'environment', maxScansPerSecond: 8, highlightScanRegion: true, highlightCodeOutline: true })
    scanner.current = instance
    return () => { mounted.current = false; instance.destroy(); scanner.current = null }
  }, [])
  async function start() {
    if (operation.current) return
    operation.current = true; handled.current = false
    setBusy(true); setError(''); setTicket(null)
    try {
      if (!window.isSecureContext) throw new Error('Camera access needs HTTPS or localhost. You can upload a QR image instead.')
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot access a camera. Upload a QR image instead.')
      await scanner.current.start()
      if (mounted.current && !handled.current) setCamera(true)
    } catch (e) {
      if (mounted.current) {
        scanner.current?.stop(); setCamera(false)
        setError(e.message?.includes('HTTPS') || e.message?.includes('browser') ? e.message : 'Could not start the camera. Allow camera access and check that no other app is using it, or upload a QR image below.')
      }
    } finally { operation.current = false; if (mounted.current) setBusy(false) }
  }
  function stop() { scanner.current?.stop(); setCamera(false) }
  async function readImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || operation.current) return
    operation.current = true; stop(); setBusy(true); setError(''); setTicket(null)
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      if (mounted.current) accept(result.data)
    } catch {
      if (mounted.current) setError('No readable QR code found. Choose a clear ticket image and try again.')
    } finally { operation.current = false; if (mounted.current) setBusy(false) }
  }
  return <section className="page-section">
    <h2 className="page-title">Scan tickets</h2>
    <div className="scanner-layout">
      <div className="card scanner-card">
        <div className={'camera-preview' + (camera ? ' is-active' : '')}>
          <video ref={video} muted playsInline aria-label="QR scanner camera preview" />
          {!camera && <div className="camera-placeholder"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M6 23V6h17M41 6h17v17M58 41v17H41M23 58H6V41M18 18h10v10H18zM36 18h10v10H36zM18 36h10v10H18zM36 36h5v5h5v5H36z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg><span>{busy ? 'Preparing scanner…' : 'Position a ticket inside the frame'}</span></div>}
        </div>
        <div className="action-row">
          {camera ? <button className="ghost" onClick={stop}>Stop camera</button> : <button disabled={busy} onClick={start}>{busy ? 'Please wait…' : ticket ? 'Scan next ticket' : 'Start camera'}</button>}
          <label className={'button-link ghost upload-button' + (busy ? ' disabled' : '')}>Upload QR image<input type="file" accept="image/*" disabled={busy} onChange={readImage} /></label>
        </div>
      </div>
    </div>
    {error && <p className="msg err" role="alert">{error}</p>}
    {ticket && <div ref={result} className="scanned-ticket"><Ticket key={ticket.key + ticket.scan} api={api} orderKey={ticket.key} onLoaded={showResult} /></div>}
  </section>
}
