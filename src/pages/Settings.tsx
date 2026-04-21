import { FormEvent, useEffect, useState } from 'react';
import { api, type SocialMap } from '../api';

const FIELDS: Array<{ key: keyof SocialMap; label: string; placeholder: string }> = [
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/summeroom' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/summeroom' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/summeroom' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@summeroom' },
  { key: 'vk', label: 'VK', placeholder: 'https://vk.com/summeroom' },
];

export function Settings(): JSX.Element {
  const [social, setSocial] = useState<SocialMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getSocial()
      .then((s) => {
        if (alive) setSocial(s);
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
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const next = await api.putSocial(social);
      setSocial(next);
      setToast('Сохранено');
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <section>
      <h1>Настройки</h1>
      <form className="card form" onSubmit={onSubmit}>
        <h2>Соцсети на витрине</h2>
        <div className="grid2">
          {FIELDS.map((f) => (
            <label key={f.key}>
              <span>{f.label}</span>
              <input
                type="url"
                placeholder={f.placeholder}
                value={social[f.key] ?? ''}
                onChange={(e) =>
                  setSocial((prev) => ({ ...prev, [f.key]: e.target.value || null }))
                }
              />
            </label>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        {toast ? <p className="success">{toast}</p> : null}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </section>
  );
}
