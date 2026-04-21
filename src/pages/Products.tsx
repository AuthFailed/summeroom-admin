import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Product } from '../api';

const priceFmt = new Intl.NumberFormat('ru-RU');

export function Products(): JSX.Element {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'plant' | 'pot'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listProducts()
      .then((data) => {
        if (alive) setRows(data);
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

  async function onDelete(p: Product) {
    if (!confirm(`Удалить «${p.name}»?`)) return;
    try {
      await api.deleteProduct(p.id);
      setRows((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const filtered = typeFilter === 'all' ? rows : rows.filter((p) => p.type === typeFilter);

  return (
    <section>
      <div className="toolbar">
        <h1>Каталог</h1>
        <div className="toolbar-right">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          >
            <option value="all">все</option>
            <option value="plant">растения</option>
            <option value="pot">кашпо</option>
          </select>
          <button className="btn-primary" onClick={() => navigate('/products/new')}>
            + Новый товар
          </button>
        </div>
      </div>

      {loading ? <p>Загрузка…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && filtered.length === 0 ? <p className="muted">Пусто</p> : null}

      {filtered.length > 0 ? (
        <table className="grid">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Название</th>
              <th>Slug / код</th>
              <th>Цена, ₽</th>
              <th>Остаток</th>
              <th>Показ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.type === 'plant' ? '🌿' : '🪴'}</td>
                <td>
                  <Link to={`/products/${p.id}`}>{p.name}</Link>
                  {p.latin_name ? <div className="muted small">{p.latin_name}</div> : null}
                </td>
                <td className="mono small">
                  {p.slug}
                  {p.code ? <div className="muted">{p.code}</div> : null}
                </td>
                <td>{priceFmt.format(p.price_rub)}</td>
                <td>{p.stock}</td>
                <td>{p.is_visible ? 'да' : 'нет'}</td>
                <td>
                  <button className="btn-ghost" onClick={() => onDelete(p)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
