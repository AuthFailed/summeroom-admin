import { useRef, useState, type DragEvent } from 'react';
import { api, ApiError, type ProductImage } from '../api';

interface Props {
  value: ProductImage[];
  onChange: (next: ProductImage[]) => void;
}

export function ImagesEditor({ value, onChange }: Props): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: list.length });
    const added: ProductImage[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const up = await api.uploadImage(f);
        added.push({
          url: up.url,
          alt: null,
          sort_order: value.length + added.length,
          is_primary: value.length === 0 && added.length === 0,
        });
        setUploadProgress({ done: i + 1, total: list.length });
      }
      onChange([...value, ...added]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message;
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  function onDropFiles(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropHover(false);
    if (e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  function updateImage(idx: number, patch: Partial<ProductImage>) {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    if (patch.is_primary) {
      for (let i = 0; i < next.length; i++) {
        if (i !== idx) next[i] = { ...next[i], is_primary: false };
      }
    }
    onChange(next);
  }

  function removeImage(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    if (!next.some((i) => i.is_primary) && next.length > 0) {
      next[0] = { ...next[0], is_primary: true };
    }
    onChange(renumber(next));
  }

  function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(renumber(next));
  }

  function addByUrl() {
    const url = prompt('URL изображения:');
    if (!url) return;
    onChange([
      ...value,
      {
        url,
        alt: null,
        sort_order: value.length,
        is_primary: value.length === 0,
      },
    ]);
  }

  return (
    <div className="images-editor">
      <div
        className={`dropzone${dropHover ? ' dropzone-hover' : ''}${uploading ? ' dropzone-busy' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDropHover(true);
        }}
        onDragLeave={() => setDropHover(false)}
        onDrop={onDropFiles}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <p>
            Загрузка {uploadProgress?.done}/{uploadProgress?.total}…
          </p>
        ) : (
          <>
            <p className="dropzone-title">Перетащите файлы сюда или кликните для выбора</p>
            <p className="muted small">jpeg, png, webp, gif, avif · до 10 МБ</p>
          </>
        )}
      </div>

      {error ? <p className="error">{error}</p> : null}

      {value.length > 0 ? (
        <div className="image-grid">
          {value.map((img, idx) => (
            <div
              key={idx}
              className={`image-tile${img.is_primary ? ' image-tile-primary' : ''}${dragIndex === idx ? ' image-tile-dragging' : ''}`}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveTo(dragIndex, idx);
                setDragIndex(null);
              }}
            >
              <div className="image-tile-preview">
                {img.url ? (
                  <img src={img.url} alt={img.alt ?? ''} loading="lazy" />
                ) : (
                  <div className="image-tile-empty">нет URL</div>
                )}
                {img.is_primary ? <span className="image-tile-badge">главное</span> : null}
              </div>
              <div className="image-tile-meta">
                <input
                  placeholder="alt"
                  value={img.alt ?? ''}
                  onChange={(e) => updateImage(idx, { alt: e.target.value || null })}
                />
                <input
                  placeholder="URL (опц.)"
                  value={img.url}
                  onChange={(e) => updateImage(idx, { url: e.target.value })}
                  className="mono small"
                />
                <div className="image-tile-actions">
                  <label className="check">
                    <input
                      type="radio"
                      name="primary"
                      checked={img.is_primary}
                      onChange={(e) => updateImage(idx, { is_primary: e.target.checked })}
                    />
                    <span>главное</span>
                  </label>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => removeImage(idx)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="images-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={addByUrl}>
          Добавить по URL
        </button>
      </div>
    </div>
  );
}

function renumber(images: ProductImage[]): ProductImage[] {
  return images.map((img, i) => ({ ...img, sort_order: i }));
}
