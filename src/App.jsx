import { useMemo, useRef, useState, useEffect } from 'react'
import './App.css'

const CONTACT_METHODS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'LINE', label: 'Line' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'WECHAT', label: 'WeChat' },

]

const STATUS_METHODS = [
  { value: 'DEPEND', label: 'Depend' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'UNSINGLE', label: 'Unsingle' },
]

const BACKGROUND_MAP = {
  [STATUS_METHODS[0].value]: '/images/Depend-purple.png',
  [STATUS_METHODS[1].value]: '/images/Single-green.png',
  [STATUS_METHODS[2].value]: '/images/Unsingle-red.png',

}

export default function App() {
  const fileInputRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState('/images/nopic.png')
  const [photoFile, setPhotoFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [contactMethod, setContactMethod] = useState(CONTACT_METHODS[0].value)
  const [contactValue, setContactValue] = useState('')
  const [status, setStatus] = useState(STATUS_METHODS[0].value)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imageScale, setImageScale] = useState(100)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const backgroundImage = useMemo(() => BACKGROUND_MAP[status] ?? BACKGROUND_MAP[STATUS_METHODS[0].value], [status])

  const clampOffset = (x, y, scale) => {
    if (scale <= 100) return { x: 0, y: 0 }
    
    // With object-fit: contain, visual size stays within container
    // So use fixed max offset for boundary clamping
    const maxOffset = 100
    
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, y))
    }
  }

  const handleMouseDown = (e) => {
    if (imageScale <= 100) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      offsetX: offsetX,
      offsetY: offsetY
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || imageScale <= 100) return
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    const newX = dragStart.offsetX + deltaX
    const newY = dragStart.offsetY + deltaY
    const clamped = clampOffset(newX, newY, imageScale)
    setOffsetX(clamped.x)
    setOffsetY(clamped.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging || imageScale <= 100) return
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const newX = dragStart.offsetX + deltaX
      const newY = dragStart.offsetY + deltaY
      const clamped = clampOffset(newX, newY, imageScale)
      setOffsetX(clamped.x)
      setOffsetY(clamped.y)
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = 'grabbing'
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = ''
    }
  }, [isDragging, dragStart, imageScale])

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
    setStatus(STATUS_METHODS[0].value)
    setMessage('')
    setImageScale(100)
    setOffsetX(0)
    setOffsetY(0)
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const payload = {
      filName: photoFile?.name ?? null,
      caption,
      contract: {
        contractType: contactMethod,
        contractValue: contactValue,
      },
      status
    }

    try {
      // contracts/create
      const res = await fetch('http://localhost:8080/warpgate-service/api/v1/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }

      setMessage('Saved successfully 🎉')

      setTimeout(() => {
        setMessage('')
      }, 10000)

      resetForm()
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
                <img 
                  src={photoPreview} 
                  alt="preview" 
                  style={{ 
                    transform: `scale(${imageScale / 100}) translate(${offsetX}px, ${offsetY}px)`,
                    transformOrigin: 'center',
                    cursor: imageScale > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  draggable={false}
                />
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
          {photoPreview && photoPreview !== '/images/nopic.png' && (
            <div className="scale-control">
              <label htmlFor="image-scale">ขนาดรูป: {imageScale}%</label>
              <input
                id="image-scale"
                type="range"
                min="50"
                max="200"
                value={imageScale}
                onChange={(e) => setImageScale(Number(e.target.value))}
                className="scale-slider"
              />
              {imageScale > 100 && (
                <div className="drag-hint">
                  คลิกและลากเพื่อปรับตำแหน่งรูปภาพ
                </div>
              )}
            </div>
          )}
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
            Contract
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
            {STATUS_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
