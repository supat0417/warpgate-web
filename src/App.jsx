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

// Utility function to generate a UUID (v4)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  const [showConfirm, setShowConfirm] = useState(false)
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
    const clamped = clampOffset(offsetX, offsetY, imageScale) // Recalculate and clamp current offset
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
    const clamped = clampOffset(newX, newY, imageScale) // Clamp new offset
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
      const clamped = clampOffset(newX, newY, imageScale) // Clamp new offset
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
    } // Added offsetX, offsetY to dependencies for completeness
  }, [isDragging, dragStart, imageScale, minScale, offsetX, offsetY])

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

  const handleSave = () => {
    if (!photoFile) {
      setMessage('กรุณาอัปโหลดรูปภาพก่อนบันทึก');
      return;
    }
    setShowConfirm(true)
  }

  const performSave = async () => {
    setShowConfirm(false)
    setSaving(true)
    setMessage(''); // Clear previous messages

    if (!photoFile || !imgRef.current || !previewRef.current) {
      setMessage('Save failed: No photo or preview element found.');
      setSaving(false);
      return;
    }

    const img = imgRef.current;
    const previewContainer = previewRef.current;
    const CANVAS_OUTPUT_SIZE = 600; // กำหนดขนาดของรูปภาพที่ต้องการบันทึก (เช่น 600x600 pixels)

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_OUTPUT_SIZE;
    canvas.height = CANVAS_OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const containerWidth = previewContainer.offsetWidth; // เนื่องจาก preview เป็นสี่เหลี่ยมจัตุรัส, width == height

    // Step 1: คำนวณขนาดของรูปภาพเสมือนว่าถูก object-fit: contain ในกรอบ preview (containerWidth x containerWidth)
    const imgRatio = originalWidth / originalHeight;
    let baseW_container, baseH_container;
    if (imgRatio > 1) { // รูปภาพกว้างกว่าสูง
      baseW_container = containerWidth;
      baseH_container = containerWidth / imgRatio;
    } else { // รูปภาพสูงกว่ากว้าง หรือเป็นสี่เหลี่ยมจัตุรัส
      baseH_container = containerWidth;
      baseW_container = containerWidth * imgRatio;
    }

    // Step 2: คำนวณขนาดที่รูปภาพถูกแสดงจริงใน preview หลังจาก apply imageScale
    const displayedW = baseW_container * (imageScale / 100);
    const displayedH = baseH_container * (imageScale / 100);

    // Step 3: คำนวณตำแหน่งมุมซ้ายบนของรูปภาพที่แสดงผลเทียบกับมุมซ้ายบนของกรอบ preview
    // รูปภาพจะถูกจัดกึ่งกลางก่อน แล้วค่อยเลื่อนด้วย offsetX, offsetY
    const initialDisplayX = (containerWidth - displayedW) / 2;
    const initialDisplayY = (containerWidth - displayedH) / 2;

    const finalDisplayX = initialDisplayX + offsetX;
    const finalDisplayY = initialDisplayY + offsetY;

    // Step 4: กำหนด Source Rectangle (sx, sy, sWidth, sHeight) จากรูปภาพต้นฉบับ
    // ที่สอดคล้องกับพื้นที่ที่มองเห็นในกรอบ preview (containerWidth x containerWidth)
    const ratioX = originalWidth / displayedW;
    const ratioY = originalHeight / displayedH;

    let sx = (0 - finalDisplayX) * ratioX;
    let sy = (0 - finalDisplayY) * ratioY;
    let sWidth = containerWidth * ratioX;
    let sHeight = containerWidth * ratioY;

    // ตรวจสอบให้แน่ใจว่า Source Rectangle อยู่ภายในขอบเขตของรูปภาพต้นฉบับ
    sx = Math.max(0, sx);
    sy = Math.max(0, sy);
    sWidth = Math.min(originalWidth - sx, sWidth);
    sHeight = Math.min(originalHeight - sy, sHeight);

    // Destination Rectangle บน Canvas (ต้องการให้เต็ม Canvas)
    const dx = 0;
    const dy = 0;
    const dWidth = CANVAS_OUTPUT_SIZE;
    const dHeight = CANVAS_OUTPUT_SIZE;

    // วาดรูปภาพที่ถูกครอปและปรับขนาดลงบน Canvas
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    // แปลง Canvas เป็น Blob (ไฟล์รูปภาพ)
    let processedImageBlob = null;
    try {
      processedImageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9)); // บันทึกเป็น JPEG คุณภาพ 90%
    } catch (blobError) {
      setMessage(`Save failed: Could not process image. ${blobError.message}`);
      setSaving(false);
      return;
    }

    if (!processedImageBlob) {
      setMessage('Save failed: Processed image is empty.');
      setSaving(false);
      return;
    }

    const imageUUID = generateUUID();
    const newFileName = `${imageUUID}.jpeg`; // กำหนดชื่อไฟล์ใหม่เป็น UUID.jpeg

    try {
      // แปลงรูปภาพที่ครอปแล้วเป็น Base64 เพื่อส่งไปให้ Server ใน Request เดียว
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(processedImageBlob);
      });

      const payload = {
        fileName: newFileName,   // ส่งชื่อไฟล์ UUID
        // fileData: base64Image,   // ส่งข้อมูลรูปภาพเพื่อให้ Server ไปเซฟลง Folder imagesUpload
        caption,
        contract: {
          contractType: contactMethod,
          contractValue: contactValue,
        },
        status
      };

      const res = await fetch('http://localhost:8080/warpgate-service/api/v1/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Server returned: ${errorData.message || res.statusText}`);
      }

      setMessage('Saved successfully 🎉');
      resetForm();
    } catch (err) {
      setMessage(`Save failed: ${err?.message ?? err}`);
    } finally {
      setSaving(false);
    }
  }

  // Re-evaluate handleImageLoad to ensure minScale is calculated correctly for a square container
  // The existing handleImageLoad logic is mostly correct, but I'll ensure it's robust.
  // (No changes needed here, the existing logic is fine for the square container and object-fit: contain)

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

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--accent)', textAlign: 'center' }}>ยืนยันการบันทึกข้อมูล</h2>
            <div className="confirm-summary">
              <p style={{ margin: '8px 0' }}><strong>สถานะ:</strong> {STATUS_METHODS.find(s => s.value === status)?.label}</p>
              <p style={{ margin: '8px 0' }}><strong>ช่องทางติดต่อ:</strong> {CONTACT_METHODS.find(c => c.value === contactMethod)?.label}: {contactValue}</p>
              <p style={{ margin: '8px 0' }}><strong>ข้อความ:</strong> {caption || '-'}</p>
            </div>
            <div className="actions" style={{ marginTop: '0' }}>
              <button className="button primary" onClick={performSave}>ยืนยัน</button>
              <button className="button secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
