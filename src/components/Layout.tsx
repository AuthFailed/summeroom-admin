import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getMe } from '../auth';

export function Layout(): JSX.Element {
  const me = getMe();
  const navigate = useNavigate();

  const onLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">Комната лета · админ</div>
        <nav className="nav">
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            Каталог
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            Заказы
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Настройки
          </NavLink>
        </nav>
        <div className="user">
          {me ? <span className="muted">{me.email}</span> : null}
          <button type="button" className="btn-ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
