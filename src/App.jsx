import { useMemo, useRef, useState } from 'react'
import './App.css'

const STATUS = {
  NONE: '',
  SINGLE: 'Single',
  UNSINGLE: 'Unsingle',
  DEPEND: 'Depend',
}

const CONTACT_METHODS = [
  { value: 'Line', label: 'Line' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
]

const BACKGROUND_MAP = {
  [STATUS.NONE]: '/images/Default.png',
  [STATUS.SINGLE]: '/images/Single-green.png',
  [STATUS.UNSINGLE]: '/images/Unsingle-red.png',
  [STATUS.DEPEND]: '/images/Depend-purple.png',
}

export default function App() {
  const fileInputRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState('/images/nopic.png')
  const [photoFile, setPhotoFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [contactMethod, setContactMethod] = useState(CONTACT_METHODS[0].value)
  const [contactValue, setContactValue] = useState('')
  const [status, setStatus] = useState(STATUS.NONE)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const backgroundImage = useMemo(() => BACKGROUND_MAP[status] ?? BACKGROUND_MAP[STATUS.NONE], [status])

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview('/images/nopic.png')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result)
      setPhotoFile(file)
    }
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setPhotoFile(null)
    setPhotoPreview('/images/nopic.png')
    setCaption('')
    setContactMethod(CONTACT_METHODS[0].value)
    setContactValue('')
    setStatus(STATUS.NONE)
    setMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const payload = {
      caption,
      contactMethod,
      contactValue,
      status,
      photoFilename: photoFile?.name ?? null,
    }

    try {
      // Replace this URL with your real API endpoint.
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }

      setMessage('Saved successfully 🎉')
    } catch (err) {
      setMessage(`Save failed: ${err?.message ?? err}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="overlay" />
      <div className="card">
        <section className="field">
          <div className="photo-row">
            <div className="photo-preview" aria-label="Photo preview">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" />
              ) : (
                <div className="photo-placeholder">ยังไม่มีรูป</div>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="photo"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
            />
          </div>
        </section>

        <section className="field">
          <label className="label" htmlFor="caption">
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Find any caption that makes you stand out the most tonight ..."
            rows={3}
          />
        </section>

        <section className="field">
          <label className="label" htmlFor="contact-method">
            Contact
          </label>
          <div className="contact-row">
            <select
              id="contact-method"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
            >
              {CONTACT_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={contactValue}
              placeholder="Warp Gate ..."
              onChange={(e) => setContactValue(e.target.value)}
            />
          </div>
        </section>

        <section className="field">
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value={STATUS.DEPEND}>{STATUS.DEPEND}</option>
            <option value={STATUS.SINGLE}>{STATUS.SINGLE}</option>
            <option value={STATUS.UNSINGLE}>{STATUS.UNSINGLE}</option>
          </select>
        </section>

        <div className="actions">
          <button
            className="button primary"
            onClick={handleSave}
            disabled={saving || !photoFile}
            title={!photoFile ? 'Please upload a photo before saving' : undefined}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="button secondary" onClick={resetForm} type="button">
            Clear
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        <footer className="footer">
          <small>Proudly presented by vows and victory.</small>
        </footer>
      </div>
    </main>
  )
}
