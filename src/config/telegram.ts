// ID группы и топиков для уведомлений. Не секрет (токен бота хранится только в env),
// но в одном месте, чтобы не размазывать по роутам.
// ВАЖНО: TELEGRAM_CHAT_ID в .env.local — это другой (личный) чат, поэтому
// переопределение идёт через отдельное имя TELEGRAM_GROUP_CHAT_ID.
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || '-1003811463175';

export const TELEGRAM_THREADS = {
    orders: 3,
    support: 5,
} as const;
