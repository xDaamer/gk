import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { api } from '../lib/api'
import ConfirmDialog from './ConfirmDialog'

export default function BackupControls() {
  const fileInputRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null) // { data, summary }
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }
  const [importing, setImporting] = useState(false)

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya art arda seçilebilsin
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data.guests) || !Array.isArray(data.archive)) {
        throw new Error('Bu dosya geçerli bir GK Regency yedeği değil (guests/archive dizileri bulunamadı).')
      }
      setMessage(null)
      setPendingImport({
        data,
        summary: `${data.guests.length} aktif kayıt, ${data.archive.length} arşiv kaydı`,
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof SyntaxError ? 'Dosya geçerli bir JSON değil.' : err.message,
      })
    }
  }

  async function confirmImport() {
    if (!pendingImport) return
    setImporting(true)
    try {
      await api.importBackup(pendingImport.data)
      setPendingImport(null)
      setMessage({ type: 'success', text: 'Yedek içe aktarıldı, sayfa yenileniyor…' })
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
      setImporting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-3">
      {message && (
        <span
          className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
        >
          {message.text}
        </span>
      )}

      <a
        href="/api/export"
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
      >
        <Download size={14} />
        Dışa Aktar
      </a>
      <button
        type="button"
        onClick={handleImportClick}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
      >
        <Upload size={14} />
        İçe Aktar
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={handleFileChange}
      />

      {pendingImport && (
        <ConfirmDialog
          title="Yedeği İçe Aktar"
          description={`${pendingImport.summary} içe aktarılacak. Bu işlem MEVCUT TÜM VERİLERİN üzerine yazacaktır ve geri alınamaz.`}
          confirmLabel={importing ? 'İçe aktarılıyor…' : 'Üzerine Yaz'}
          danger
          disabled={importing}
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  )
}
