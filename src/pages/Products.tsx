import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Product, type SortKey } from '../api';

const priceFmt = new Intl.NumberFormat('ru-RU');
const PAGE_SIZE = 50;

type TypeFilter = 'all' | 'plant' | 'pot';
type VisibilityFilter = 'all' | 'visible' | 'hidden';
type StockFilter = 'all' | 'in' | 'out';

interface SortState {
  key: SortKey;
  order: 'asc' | 'desc';
}

const DEFAULT_SORT: SortState = { key: 'sort_order', order: 'asc' };

export function Products(): JSX.Element {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(search.trim()), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    setOffset(0);
  }, [typeFilter, visibilityFilter, stockFilter, debouncedQ, sort.key, sort.order]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listProducts({
        type: typeFilter === 'all' ? undefined : typeFilter,
        visibility: visibilityFilter === 'all' ? undefined : visibilityFilter,
        inStock: stockFilter === 'all' ? undefined : stockFilter === 'in',
        q: debouncedQ || undefined,
        sort: sort.key,
        order: sort.order,
        limit: PAGE_SIZE,
        offset,
      })
      .then((data) => {
        if (!alive) return;
        setRows(data.items);
        setTotal(data.total);
        setError(null);
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
  }, [typeFilter, visibilityFilter, stockFilter, debouncedQ, sort.key, sort.order, offset]);

  async function onDelete(p: Product) {
    if (!confirm(`Удалить «${p.name}»?`)) return;
    try {
      await api.deleteProduct(p.id);
      setRows((prev) => prev.filter((x) => x.id !== p.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { key, order: 'asc' },
    );
  }

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = Math.min(offset + rows.length, total);
  const hasPrev = offset > 0;
  const hasNext = offset + rows.length < total;

  const activeFilters = useMemo(
    () =>
      Number(typeFilter !== 'all') +
      Number(visibilityFilter !== 'all') +
      Number(stockFilter !== 'all') +
      Number(Boolean(debouncedQ)),
    [typeFilter, visibilityFilter, stockFilter, debouncedQ],
  );

  return (
    <section>
      <div className="toolbar">
        <div>
          <h1>Каталог</h1>
          <p className="muted small" style={{ marginTop: 4 }}>
            {total} товар{plural(total, 'ов', '', 'а')}
            {activeFilters > 0 ? ` · фильтров: ${activeFilters}` : ''}
          </p>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => navigate('/products/new')}>
            + Новый товар
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Поиск по названию, slug, артикулу…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">все типы</option>
          <option value="plant">🌿 растения</option>
          <option value="pot">🪴 кашпо</option>
        </select>
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}
        >
          <option value="all">видимость любая</option>
          <option value="visible">только видимые</option>
          <option value="hidden">только скрытые</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
        >
          <option value="all">остаток любой</option>
          <option value="in">в наличии</option>
          <option value="out">закончились</option>
        </select>
        {activeFilters > 0 ? (
          <button
            className="btn-ghost"
            onClick={() => {
              setTypeFilter('all');
              setVisibilityFilter('all');
              setStockFilter('all');
              setSearch('');
            }}
          >
            Сбросить
          </button>
        ) : null}
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th style={{ width: 56 }} />
              <th>Тип</th>
              <SortableTh label="Название" k="name" sort={sort} onClick={toggleSort} />
              <th>Slug / код</th>
              <SortableTh label="Цена, ₽" k="price" sort={sort} onClick={toggleSort} align="right" />
              <SortableTh label="Остаток" k="stock" sort={sort} onClick={toggleSort} align="right" />
              <th>Показ</th>
              <SortableTh label="Сорт." k="sort_order" sort={sort} onClick={toggleSort} align="right" />
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const primary =
                p.images.find((i) => i.is_primary)?.url ?? p.images[0]?.url ?? null;
              return (
                <tr key={p.id}>
                  <td>
                    {primary ? (
                      <img src={primary} alt="" className="thumb" loading="lazy" />
                    ) : (
                      <div className="thumb thumb-empty">—</div>
                    )}
                  </td>
                  <td>{p.type === 'plant' ? '🌿' : '🪴'}</td>
                  <td>
                    <Link to={`/products/${p.id}`} className="row-title">
                      {p.name}
                    </Link>
                    {p.latin_name ? (
                      <div className="muted small">{p.latin_name}</div>
                    ) : null}
                  </td>
                  <td className="mono small">
                    {p.slug}
                    {p.code ? <div className="muted">{p.code}</div> : null}
                  </td>
                  <td className="num">{priceFmt.format(p.price_rub)}</td>
                  <td className="num">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td>
                    <span className={`pill ${p.is_visible ? 'pill-ok' : 'pill-muted'}`}>
                      {p.is_visible ? 'видим' : 'скрыт'}
                    </span>
                  </td>
                  <td className="num muted">{p.sort_order}</td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => onDelete(p)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty">
                  Ничего не найдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {loading ? <div className="table-loading">Загрузка…</div> : null}
      </div>

      <div className="pager">
        <div className="muted small">
          {total > 0 ? `${pageFrom}–${pageTo} из ${total}` : ''}
        </div>
        <div className="pager-nav">
          <button
            className="btn-ghost btn-sm"
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Назад
          </button>
          <button
            className="btn-ghost btn-sm"
            disabled={!hasNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Вперёд →
          </button>
        </div>
      </div>
    </section>
  );
}

function SortableTh({
  label,
  k,
  sort,
  onClick,
  align,
}: {
  label: string;
  k: SortKey;
  sort: SortState;
  onClick: (k: SortKey) => void;
  align?: 'right';
}): JSX.Element {
  const active = sort.key === k;
  const indicator = active ? (sort.order === 'asc' ? '↑' : '↓') : '';
  return (
    <th
      className={`sortable${active ? ' active' : ''}`}
      onClick={() => onClick(k)}
      style={align === 'right' ? { textAlign: 'right' } : undefined}
    >
      {label}
      <span className="sort-ind"> {indicator}</span>
    </th>
  );
}

function StockBadge({ stock }: { stock: number }): JSX.Element {
  const cls = stock === 0 ? 'pill-danger' : stock < 3 ? 'pill-warn' : 'pill-ok';
  return <span className={`pill ${cls}`}>{stock}</span>;
}

function plural(n: number, zero: string, one: string, few: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return zero;
}
