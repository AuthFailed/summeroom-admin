import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { getToken } from '../auth';

interface LocationState {
  from?: string;
}

export function Login(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/products';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getToken()) navigate(from, { replace: true });
  }, [from, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>Вход в админ-панель</h1>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
