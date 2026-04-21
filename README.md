# summeroom-admin

Админ-панель для [summeroom.ru](https://summeroom.ru). Общается с
[`AuthFailed/summeroom-api`](https://github.com/AuthFailed/summeroom-api) через
JWT-авторизованные эндпоинты `/api/admin/*`.

## Стек

- React 18, React Router 6
- Vite 7, TypeScript 5
- без UI-библиотек — стили в одном `src/styles.css`

## Запуск

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5174
```

API по умолчанию подхватывается из `VITE_API_BASE_URL`. Для локальной связки
достаточно поднять бэкенд из соседнего репо:

```bash
cd ../summeroom-api
docker compose up -d
```

## Скрипты

| команда         | что делает                                |
|-----------------|-------------------------------------------|
| `npm run dev`   | Dev-сервер Vite на `:5174`                |
| `npm run build` | `tsc --noEmit` + `vite build` в `dist/`   |
| `npm run preview` | Локальный превью сборки                 |
| `npm run typecheck` | Только проверка типов                 |

## Что умеет

- Вход по email/паролю, токен в `localStorage`
- Каталог: список, создание, редактирование, удаление товаров
  (растения и кашпо в одной модели)
- Заказы: фильтр по статусу, детальная карточка со сменой статуса
- Настройки: ссылки на соцсети, которые показывает витрина

## Деплой

Стандартный статический хостинг (Netlify, Vercel, любой nginx). Не забудьте
выставить `VITE_API_BASE_URL` в переменные окружения CI и добавить домен в
`CORS_ORIGINS` бэкенда.
