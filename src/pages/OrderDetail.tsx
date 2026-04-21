import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Order } from '../api';

const priceFmt = new Intl.NumberFormat('ru-RU');
const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const STATUSES = [
  'new',
  'awaiting_payment',
  'paid',
  'shipped',
  'completed',
  'canceled',
  'refunded',
];

export function OrderDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api
      .getOrder(id)
      .then((o) => {
        if (alive) setOrder(o);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  async function onStatusChange(next: string) {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await api.updateOrder(order.id, { status: next });
      setOrder(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p>Загрузка…</p>;

  return (
    <section>
      <div className="toolbar">
        <h1>
          Заказ {order.number}{' '}
          <span className={`pill pill-${order.status}`}>{order.status}</span>
        </h1>
        <Link to="/orders" className="btn-ghost">
          ← Назад
        </Link>
      </div>

      <div className="card">
        <dl className="dl">
          <dt>Создан</dt>
          <dd>{dateFmt.format(new Date(order.created_at))}</dd>
          <dt>Клиент</dt>
          <dd>
            {order.customer_name}
            <div className="muted small">
              {order.customer_email} · {order.customer_phone}
            </div>
          </dd>
          <dt>Адрес</dt>
          <dd>{order.delivery_address || <span className="muted">—</span>}</dd>
          <dt>Комментарий</dt>
          <dd>{order.comment || <span className="muted">—</span>}</dd>
          <dt>Оплата</dt>
          <dd>
            {order.payment_status ?? '—'}
            {order.yookassa_payment_id ? (
              <div className="muted small mono">{order.yookassa_payment_id}</div>
            ) : null}
          </dd>
          <dt>Сумма</dt>
          <dd>
            <strong>{priceFmt.format(order.total_rub)} ₽</strong>
          </dd>
          <dt>Статус</dt>
          <dd>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </dd>
        </dl>
      </div>

      <h2>Состав</h2>
      <table className="grid">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Кол-во</th>
            <th>Цена, ₽</th>
            <th>Сумма, ₽</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name_snapshot}</td>
              <td>{item.qty}</td>
              <td>{priceFmt.format(item.price_rub_snapshot)}</td>
              <td>{priceFmt.format(item.price_rub_snapshot * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
