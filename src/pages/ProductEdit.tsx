import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AttrsEditor } from '../components/AttrsEditor';
import { ImagesEditor } from '../components/ImagesEditor';
import { api, type Product, type ProductDraft } from '../api';

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
  const [initial, setInitial] = useState<ProductDraft>(BLANK);
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
        setInitial(p);
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

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createProduct(draft);
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        const updated = await api.updateProduct(id!, draft);
        setInitial(updated);
        setDraft(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (dirty && !confirm('Отменить несохранённые изменения?')) return;
    navigate('/products');
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <section>
      <div className="toolbar">
        <div>
          <h1>{isNew ? 'Новый товар' : draft.name || 'Без названия'}</h1>
          {!isNew ? (
            <p className="muted small" style={{ marginTop: 4 }}>
              {draft.type === 'plant' ? '🌿 Растение' : '🪴 Кашпо'}
              {dirty ? ' · несохранённые изменения' : ''}
            </p>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="edit-form">
        <div className="card">
          <h2 className="card-title">Основное</h2>
          <div className="grid2">
            <label>
              <span>Тип</span>
              <select
                value={draft.type}
                onChange={(e) => update('type', e.target.value as 'plant' | 'pot')}
              >
                <option value="plant">🌿 Растение</option>
                <option value="pot">🪴 Кашпо</option>
              </select>
            </label>
            <label>
              <span>Slug</span>
              <input
                required
                value={draft.slug}
                onChange={(e) => update('slug', e.target.value)}
                placeholder="monstera-thai"
                className="mono"
              />
            </label>

            <label className="span2">
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
                placeholder="Monstera Thai Constellation"
              />
            </label>
            <label>
              <span>Артикул</span>
              <input
                value={draft.code ?? ''}
                onChange={(e) => update('code', e.target.value || null)}
                placeholder="KL-01"
                className="mono"
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
              <span>Порядок сортировки</span>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.is_visible}
                onChange={(e) => update('is_visible', e.target.checked)}
              />
              <span>Показывать на витрине</span>
            </label>

            <label className="span2">
              <span>Описание</span>
              <textarea
                rows={3}
                value={draft.description ?? ''}
                onChange={(e) => update('description', e.target.value || null)}
                placeholder="Краткое описание — необязательно"
              />
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Характеристики</h2>
          <AttrsEditor
            type={draft.type}
            value={draft.attrs}
            onChange={(attrs) => update('attrs', attrs)}
          />
        </div>

        <div className="card">
          <h2 className="card-title">Изображения</h2>
          <ImagesEditor
            value={draft.images}
            onChange={(images) => update('images', images)}
          />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="save-bar">
          <div className="save-bar-status">
            {dirty ? <span className="muted small">несохранённые изменения</span> : null}
          </div>
          <div className="save-bar-actions">
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !dirty}>
              {saving ? 'Сохраняем…' : isNew ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
