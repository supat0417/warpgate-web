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
  [STATUS_METHODS[0].value]: '/warpgate-web/images/Depend-purple.png',
  [STATUS_METHODS[1].value]: '/warpgate-web/images/Single-green.png',
  [STATUS_METHODS[2].value]: '/warpgate-web/images/Unsingle-red.png',

}

export default function App() {
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)
  const imgRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState('/warpgate-web/images/nopic.png')
  const [photoFile, setPhotoFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [contactMethod, setContactMethod] = useState(CONTACT_METHODS[0].value)
  const [contactValue, setContactValue] = useState('')
  const [status, setStatus] = useState(STATUS_METHODS[0].value)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imageScale, setImageScale] = useState(100)
  const [minScale, setMinScale] = useState(100)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const backgroundImage = useMemo(() => BACKGROUND_MAP[status] ?? BACKGROUND_MAP[STATUS_METHODS[0].value], [status])

  const clampOffset = (x, y, scale) => {
    // ถ้าขนาดรูปเล็กกว่าหรือเท่ากับค่า minScale ที่ล็อกไว้ (ในด้านนั้นๆ) ให้ล็อกไว้ที่ตรงกลาง
    if (!previewRef.current || !imgRef.current) return { x: 0, y: 0 }
    
    const container = previewRef.current.getBoundingClientRect()
    const img = imgRef.current
    const k = scale / 100
    
    // คำนวณขนาดรูปภาพที่แท้จริงหลังจากทำ object-fit: contain
    const containerRatio = container.width / container.height
    const imageRatio = img.naturalWidth / img.naturalHeight

    let baseW, baseH
    if (imageRatio > containerRatio) {
      baseW = container.width
      baseH = container.width / imageRatio
    } else {
      baseH = container.height
      baseW = container.height * imageRatio
    }

    // คำนวณหาจุดสูงสุดที่อนุญาตให้เลื่อนได้ (ไม่ให้ขอบรูปหลุดจากขอบ Container)
    const maxX = Math.max(0, (baseW - container.width / k) / 2)
    const maxY = Math.max(0, (baseH - container.height / k) / 2)

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    }
  }

  // จัดการการ Snap Back เมื่อมีการเปลี่ยน Scale (เช่น เลื่อน Slider ลง)
  useEffect(() => {
    if (imageScale < minScale) return
    const clamped = clampOffset(offsetX, offsetY, imageScale)
    setOffsetX(clamped.x)
    setOffsetY(clamped.y)
  }, [imageScale, photoPreview, minScale])

  const handleImageLoad = () => {
    const img = imgRef.current
    if (!img || !img.naturalWidth || !img.naturalHeight || photoPreview.includes('nopic.png')) {
      setMinScale(100)
      setImageScale(100)
      return
    }
    const { naturalWidth, naturalHeight } = img
    const ratio = naturalWidth / naturalHeight
    // คำนวณ Scale ต่ำสุดที่ทำให้รูปภาพเต็มกรอบ 1:1 เสมอ (Cover logic)
    const calculatedMin = Math.max(100, Math.ceil(Math.max(1, ratio, 1 / ratio) * 100))
    
    setMinScale(calculatedMin)
    setImageScale(calculatedMin) // ตั้งค่าเริ่มต้นให้พอดีขอบที่สุด
    setOffsetX(0)
    setOffsetY(0)
  }

  const handleMouseDown = (e) => {
    if (imageScale < minScale) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      offsetX: offsetX,
      offsetY: offsetY
    })
  }

  const handleTouchStart = (e) => {
    if (imageScale < minScale) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      offsetX: offsetX,
      offsetY: offsetY
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || imageScale < minScale) return
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
    const handleMove = (clientX, clientY) => {
      if (!isDragging || imageScale < minScale) return
      const deltaX = clientX - dragStart.x
      const deltaY = clientY - dragStart.y
      const newX = dragStart.offsetX + deltaX
      const newY = dragStart.offsetY + deltaY
      const clamped = clampOffset(newX, newY, imageScale)
      setOffsetX(clamped.x)
      setOffsetY(clamped.y)
    }

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e) => {
      // ป้องกันการ Scroll หน้าจอขณะลากรูป
      if (isDragging && e.cancelable) e.preventDefault()
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    const onEnd = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onEnd)
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onEnd)
      document.body.style.cursor = 'grabbing'
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
      document.body.style.cursor = ''
    }
  }, [isDragging, dragStart, imageScale])

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview('/warpgate-web/images/nopic.png')
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
    setPhotoPreview('/warpgate-web/images/nopic.png')
    setCaption('')
    setContactMethod(CONTACT_METHODS[0].value)
    setContactValue('')
    setStatus(STATUS_METHODS[0].value)
    setMessage('')
    setImageScale(100)
    setMinScale(100)
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
            <div className="photo-preview" ref={previewRef} aria-label="Photo preview" style={{ 
              overflow: 'hidden', 
              position: 'relative',
              width: '100%',
              maxWidth: '400px', // ขนาดสูงสุดที่เหมาะสม
              height: 'auto',
              aspectRatio: '1 / 1', // ล็อกเป็นสี่เหลี่ยมจัตุรัส 4:4
              margin: '0 auto', // จัดกึ่งกลางกรอบ preview ใน Card
              flex: 'none',
              flexShrink: 0, // ป้องกัน Flexbox บีบให้เสียรูป
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#eee',
              border: '4px solid #fff', // ทำเป็นขอบขาวหนาๆ ให้ดูเหมือนกรอบรูปจริง
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // เพิ่มเงาให้กรอบดูเด่นออกมา
              borderRadius: '4px'
            }}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  ref={imgRef}
                  alt="preview" 
                  onLoad={handleImageLoad}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                    objectFit: 'contain',
                    transform: `scale(${imageScale / 100}) translate3d(${Math.round(offsetX)}px, ${Math.round(offsetY)}px, 0)`,
                    transformOrigin: 'center',
                    cursor: imageScale >= minScale ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    willChange: 'transform', // บอก Browser ให้เตรียม GPU สำหรับการขยับรูป
                    touchAction: imageScale >= minScale ? 'none' : 'auto' // ปิด touch-action ปกติเมื่อต้องการลากรูป
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
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
          {photoPreview && photoPreview !== '/warpgate-web/images/nopic.png' && (
            <div className="scale-control">
              <label htmlFor="image-scale" style={{ display: 'inline-block', minWidth: '160px' }}>
                Size Picture: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(imageScale)}%</span>
              </label>
              <input
                id="image-scale"
                type="range"
                min={minScale || 100}
                max={(minScale || 100) + 200}
                step="0.1"
                value={imageScale}
                onInput={(e) => setImageScale(Number(e.target.value))} // ใช้ onInput เพื่อความลื่นไหลบน Android
                className="scale-slider"
              />
              {/* ใช้ visibility เพื่อจองพื้นที่ไว้ ไม่ให้ Card กระตุกเวลาข้อความโผล่ */}
              <div className="drag-hint" style={{ 
                height: '20px', 
                visibility: imageScale >= minScale ? 'visible' : 'hidden',
                fontSize: '13px',
                marginTop: '8px',
                color: '#666'
              }}>
                คลิกและลากเพื่อปรับตำแหน่งรูปภาพ
              </div>
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
