# ChessTrainer

Веб-приложение для тренировки шахматной тактики.

## Стек

- Node.js + Express
- SQLite (`better-sqlite3`)
- Vanilla JavaScript frontend
- WebSocket (`ws`)
- JWT + bcryptjs

## Запуск локально

Требуется Node.js 20+.

```bash
npm install
cp .env.example .env
```

Для локальной разработки задай `JWT_SECRET` в `.env`, затем:

```bash
npm start
```

Приложение будет доступно на `http://localhost:3000`.

Проверка:

```text
http://localhost:3000/health
```

## GitHub

Репозиторий должен содержать исходники и `package-lock.json`, но не должен содержать:

- `node_modules`
- `.env`
- SQLite-базу
- логи и временные файлы

`.gitignore` уже настроен.

Пример:

```bash
git init
git add .
git commit -m "Initial ChessTrainer"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

## Railway

1. Создай новый проект в Railway.
2. Подключи GitHub-репозиторий.
3. Railway определит Node.js-проект по `package.json`.
4. Добавь переменную окружения:

```text
JWT_SECRET=<длинная случайная строка>
```

5. Для сохранения пользователей, рейтинга и статистики **обязательно подключи Railway Volume**.
6. Смонтируй Volume, например, в:

```text
/data
```

7. Добавь переменную:

```text
DB_PATH=/data/chesstrainer.db
```

После деплоя проверь:

```text
https://ТВОЙ-ДОМЕН/health
```

Должен вернуться JSON:

```json
{"ok":true,"service":"ChessTrainer"}
```

### Важно про SQLite на Railway

Без Volume файловая система контейнера не является постоянным хранилищем. При новом деплое/перезапуске база SQLite может быть потеряна. Поэтому production-конфигурация должна использовать:

```text
DB_PATH=/data/chesstrainer.db
```

при смонтированном Volume.

## Переменные окружения

| Переменная | Обязательно | Назначение |
|---|---|---|
| `JWT_SECRET` | Да для production | Секрет подписи JWT |
| `DB_PATH` | Нет | Путь к SQLite. По умолчанию `server/chesstrainer.db` |
| `PORT` | Нет | Railway задаёт автоматически |

## Health check

`GET /health` используется Railway для проверки работоспособности приложения.

## Примечания

Текущий набор шахматных задач в `server/app.js` является демонстрационным. Перед публичным запуском стоит заменить его на проверенный набор задач и отдельно доработать серверную валидацию результатов режима «Шторм».
