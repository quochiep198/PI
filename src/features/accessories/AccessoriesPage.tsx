import { type DragEvent, useRef, useState } from 'react';

const ASSET_TYPES = [
  { value: 'avatar', label: 'Avatar' },
  { value: 'hat', label: 'Hat' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'pet', label: 'Pet' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'backpack', label: 'Backpack' },
];

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    if (!base64.startsWith('data:image')) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const maxWidth = 800;
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      const newWidth = Math.round(img.width * ratio);
      const newHeight = Math.round(img.height * ratio);

      if (img.width <= maxWidth && img.height <= maxWidth) {
        resolve(base64);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/webp', 0.92));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export function AccessoriesPage() {
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('avatar');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file hình ảnh.' });
      return;
    }

    // Show loading state immediately
    setIsCompressing(true);
    setPreviewUrl(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      // Compress image before saving
      const compressed = await compressImage(base64);
      setImageData(compressed);
      setPreviewUrl(compressed);
      setIsCompressing(false);
      setMessage(null);
    };
    reader.onerror = () => {
      setIsCompressing(false);
      setMessage({ type: 'error', text: 'Lỗi đọc file.' });
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleDiscard() {
    setName('');
    setAssetType('avatar');
    setDescription('');
    setPrice('');
    setImageData(null);
    setPreviewUrl(null);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handlePublish() {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên.' });
      return;
    }

    if (!imageData) {
      setMessage({ type: 'error', text: 'Vui lòng chọn hình ảnh.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const endpoint = assetType === 'avatar' ? '/api/avatars' : '/api/items';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          assetType,
          description,
          price: assetType !== 'avatar' ? parseInt(price, 10) || 0 : undefined,
          imageData,
        }),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Lỗi server: ${text.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lưu dữ liệu.');
      }

      setMessage({ type: 'success', text: 'Lưu thành công!' });
      setTimeout(handleDiscard, 1500);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Đã xảy ra lỗi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="accessories-layout">
      <header className="accessories-header-section">
        <h2 className="accessories-header-section__title">Upload Ảnh</h2>
      </header>

      <div className="accessories-grid">
        {/* Left Column: Primary Details */}
        <div className="accessories-main-column">
          {/* Basic Info Card */}
          <div className="accessories-card">
            <div className="accessories-form-grid">
              <div className="accessories-form-group accessories-form-group--full">
                <label className="accessories-form-label">Tên</label>
                <input
                  className="accessories-input"
                  placeholder="e.g. Glowing Syntax Scarf"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="accessories-form-group">
                <label className="accessories-form-label">Loại</label>
                <select
                  className="accessories-select"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {assetType !== 'avatar' && (
                <div className="accessories-form-group accessories-form-group--full">
                  <label className="accessories-form-label">Giá (Coins)</label>
                  <input
                    className="accessories-input"
                    placeholder="e.g. 500"
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}

              <div className="accessories-form-group accessories-form-group--full">
                <label className="accessories-form-label">Mô tả</label>
                <textarea
                  className="accessories-textarea"
                  placeholder="How does this item help the Python Quest hero?"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="accessories-card accessories-upload-card">
            <div className="accessories-upload-stripe" />
            <label className="accessories-form-label">Hình ảnh</label>
            <div
              ref={dropzoneRef}
              className={`accessories-dropzone${isDragging ? ' is-dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="accessories-dropzone__icon">
                <span className="material-symbols-outlined">{isCompressing ? 'hourglass_empty' : 'cloud_upload'}</span>
              </div>
              <h3 className="accessories-dropzone__title">{isCompressing ? 'Đang xử lý...' : 'Kéo và thả ảnh vào đây'}</h3>
              <p className="accessories-dropzone__hint">
                {isCompressing ? 'Vui lòng đợi' : 'Supports PNG, SVG, and WEBP (Recommended 400x400)'}
              </p>
              <button
                className="accessories-dropzone__browse"
                type="button"
                onClick={handleBrowseClick}
                disabled={isCompressing}
              >
                {isCompressing ? 'Đang xử lý...' : 'Browse Files'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {message && (
            <div className={`accessories-message accessories-message--${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="accessories-side-column">
          {/* Preview Card */}
          <div className="accessories-preview-card">
            <p className="accessories-preview-label">Live Preview</p>
            <div className="accessories-preview-stage">
              {isCompressing ? (
                <div className="accessories-preview-placeholder">
                  <span className="material-symbols-outlined rotating">hourglass_empty</span>
                </div>
              ) : previewUrl ? (
                <img
                  alt="Asset preview"
                  className="accessories-preview-image"
                  src={previewUrl}
                />
              ) : (
                <div className="accessories-preview-placeholder">
                  <span className="material-symbols-outlined">image</span>
                </div>
              )}
              <div className="accessories-preview-badge">PREVIEW</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="accessories-actions">
            <button
              className="accessories-btn accessories-btn--primary"
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              {isSubmitting ? 'Đang lưu...' : 'Publish to Game'}
            </button>
            <button
              className="accessories-btn accessories-btn--danger"
              type="button"
              onClick={handleDiscard}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined">delete_forever</span>
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}