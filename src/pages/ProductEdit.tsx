import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Product, type ProductDraft, type ProductImage } from '../api';

const BLANK: ProductDraft = {
  type: 'plant',
  slug: '',
  code: null,
  name: '',
  latin_name: null,
  description: null,
  price_rub: 0,
  attrs: {},
  is_visible: true,
  stock: 0,
  sort_order: 0,
  images: [],
};

export function ProductEdit(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ProductDraft>(BLANK);
  const [attrsRaw, setAttrsRaw] = useState<string>('{}');
  const [attrsError, setAttrsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    api
      .getProduct(id!)
      .then((p: Product) => {
        if (!alive) return;
        setDraft(p);
        setAttrsRaw(JSON.stringify(p.attrs, null, 2));
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  function update<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateImage(idx: number, patch: Partial<ProductImage>) {
    setDraft((prev) => {
      const images = [...prev.images];
      images[idx] = { ...images[idx], ...patch };
      return { ...prev, images };
    });
  }

  function addImage() {
    setDraft((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: '', alt: null, sort_order: prev.images.length, is_primary: prev.images.length === 0 },
      ],
    }));
  }

  function removeImage(idx: number) {
    setDraft((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let attrs: Record<string, unknown>;
    try {
      attrs = JSON.parse(attrsRaw || '{}');
    } catch {
      setAttrsError('Некорректный JSON');
      return;
    }
    setAttrsError(null);

    const body: ProductDraft = { ...draft, attrs };

    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createProduct(body);
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        await api.updateProduct(id!, body);
        navigate('/products');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <section>
      <div className="toolbar">
        <h1>{isNew ? 'Новый товар' : `Редактировать: ${draft.name}`}</h1>
      </div>

      <form className="card form" onSubmit={onSubmit}>
        <div className="grid2">
          <label>
            <span>Тип</span>
            <select
              value={draft.type}
              onChange={(e) => update('type', e.target.value as 'plant' | 'pot')}
            >
              <option value="plant">Растение</option>
              <option value="pot">Кашпо</option>
            </select>
          </label>
          <label>
            <span>Slug</span>
            <input
              required
              value={draft.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder="monstera-thai"
            />
          </label>

          <label>
            <span>Название</span>
            <input
              required
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
          <label>
            <span>Латинское название</span>
            <input
              value={draft.latin_name ?? ''}
              onChange={(e) => update('latin_name', e.target.value || null)}
            />
          </label>

          <label>
            <span>Код (для кашпо)</span>
            <input
              value={draft.code ?? ''}
              onChange={(e) => update('code', e.target.value || null)}
              placeholder="KL-01"
            />
          </label>
          <label>
            <span>Цена, ₽</span>
            <input
              type="number"
              min={0}
              value={draft.price_rub}
              onChange={(e) => update('price_rub', Number(e.target.value) || 0)}
            />
          </label>

          <label>
            <span>Остаток</span>
            <input
              type="number"
              min={0}
              value={draft.stock}
              onChange={(e) => update('stock', Number(e.target.value) || 0)}
            />
          </label>
          <label>
            <span>Порядок</span>
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
            />
          </label>

          <label className="span2">
            <span>Описание</span>
            <textarea
              rows={3}
              value={draft.description ?? ''}
              onChange={(e) => update('description', e.target.value || null)}
            />
          </label>

          <label className="span2 check">
            <input
              type="checkbox"
              checked={draft.is_visible}
              onChange={(e) => update('is_visible', e.target.checked)}
            />
            <span>Показывать на витрине</span>
          </label>
        </div>

        <fieldset>
          <legend>Атрибуты (JSON)</legend>
          <textarea
            rows={10}
            className="mono"
            value={attrsRaw}
            onChange={(e) => setAttrsRaw(e.target.value)}
          />
          {attrsError ? <p className="error">{attrsError}</p> : null}
          <p className="muted small">
            Для растений: category, tag, light, water, level, leafColor, spotColor, stripes, vertical, fern, veins, small.
            Для кашпо: shape, colorA, colorB, size, height, material, nameItalic.
          </p>
        </fieldset>

        <fieldset>
          <legend>Изображения</legend>
          {draft.images.map((img, idx) => (
            <div key={idx} className="image-row">
              <input
                placeholder="URL"
                value={img.url}
                onChange={(e) => updateImage(idx, { url: e.target.value })}
              />
              <input
                placeholder="alt"
                value={img.alt ?? ''}
                onChange={(e) => updateImage(idx, { alt: e.target.value || null })}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={img.is_primary}
                  onChange={(e) => updateImage(idx, { is_primary: e.target.checked })}
                />
                <span>главное</span>
              </label>
              <button type="button" className="btn-ghost" onClick={() => removeImage(idx)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={addImage}>
            + Добавить изображение
          </button>
        </fieldset>

        {error ? <p className="error">{error}</p> : null}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate('/products')}>
            Отмена
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </section>
  );
}
