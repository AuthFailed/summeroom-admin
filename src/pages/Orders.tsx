import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Order } from '../api';

const priceFmt = new Intl.NumberFormat('ru-RU');
const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const STATUSES = [
  { value: '', label: 'все' },
  { value: 'new', label: 'новые' },
  { value: 'awaiting_payment', label: 'ждут оплаты' },
  { value: 'paid', label: 'оплачены' },
  { value: 'shipped', label: 'отправлены' },
  { value: 'completed', label: 'завершены' },
  { value: 'canceled', label: 'отменены' },
  { value: 'refunded', label: 'возврат' },
];

export function Orders(): JSX.Element {
  const [rows, setRows] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listOrders(filter || undefined)
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
  }, [filter]);

  return (
    <section>
      <div className="toolbar">
        <h1>Заказы</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p>Загрузка…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && rows.length === 0 ? <p className="muted">Заказов нет</p> : null}

      {rows.length > 0 ? (
        <table className="grid">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Создан</th>
              <th>Клиент</th>
              <th>Сумма, ₽</th>
              <th>Статус</th>
              <th>Оплата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td className="small">{dateFmt.format(new Date(o.created_at))}</td>
                <td>
                  {o.customer_name}
                  <div className="muted small">{o.customer_email}</div>
                </td>
                <td>{priceFmt.format(o.total_rub)}</td>
                <td>
                  <span className={`pill pill-${o.status}`}>{o.status}</span>
                </td>
                <td className="small">{o.payment_status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
