# Памятка по инфраструктуре и деплою (nucleargarden.ru)

> [!IMPORTANT]
> Этот файл содержит критическую информацию для работы API и деплоя. Проверяй его перед внесением изменений в роуты Telegram или Notion.

## 1. Серверная информация
- **IP сервера:** `91.193.180.173`
- **Пользователь:** `root`
- **Путь к приложению:** `/var/www/nuclear`
- **Менеджер процессов:** PM2 (имя процесса: `nuclear`, порт `3000`)
- **Команда деплоя:** `git pull && npm install && npm run build && pm2 restart nuclear`

## 2. Telegram/Notion API и прокси
- **Проблема:** Сервер не имеет прямого доступа к `api.telegram.org` и `api.notion.com`.
- **Решение:** Все такие запросы идут через NL-прокси-сервер (`http://38.180.132.49:8888`, задан в `.env.local` как `HTTPS_PROXY`/`HTTP_PROXY`).
- **Реализация:** Единый механизм — `fetch()` с явным `dispatcher: getProxyDispatcher()` из `src/lib/proxyDispatcher.ts` (undici `ProxyAgent`).
- **ВАЖНО:** не использовать `axios`/`https-proxy-agent` или второй параллельный прокси-механизм — два разных туннельных механизма к одному прокси в одном процессе конфликтуют между собой (проверено на практике 2026-09-02: Notion и Telegram работали по отдельности, но ломали друг друга при одновременной работе разными способами).
- **Конфигурация (Node.js/TS):**
  ```typescript
  import { getProxyDispatcher } from '@/lib/proxyDispatcher';

  const response = await fetch(url, {
    ...options,
    dispatcher: getProxyDispatcher(),
  } as any);
  ```

## 3. Маршрутизация уведомлений (Telegram)
- **Chat ID группы:** `-1003811463175`
- **Топики (фиксированные):**
  - **Новый заказ:** `message_thread_id: 3`
  - **Поддержка:** `message_thread_id: 5`
- **Логика:** Динамическое создание топиков и вебхуки ОТКЛЮЧЕНЫ. Все сообщения идут в указанные выше топики.

## 4. Notion CMS
- **База заказов:** `NOTION_ORDERS_DB_ID` (из .env)
- **Логика:** При каждом оформлении заказа данные дублируются в Notion через `createNotionOrder`.

## 5. Контакты пользователя
- Используется единое поле "@telegram или email".
- **Валидация:** Если поле содержит `@` и `.` (точку) — это **Email**. Иначе — **Telegram**.
- Для нормализации всегда вызывай `normalizeContact(input)` из `src/lib/telegram.ts`.
