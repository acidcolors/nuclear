import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Список всех поддерживаемых локалей
  locales: ['ru', 'en'],

  // Локаль по умолчанию (если язык не определен)
  defaultLocale: 'ru',

  // Всегда показывать префикс локали в URL (например, /ru, /en) для предсказуемости
  localePrefix: 'always'
});

export const config = {
  // Запускаем middleware для всех путей, КРОМЕ:
  // - api (API роуты)
  // - _next (внутренние сборки)
  // - _vercel (сервисы Vercel)
  // - статические файлы с точкой в имени (картинки, шрифты, json-файлы анимаций вроде relax_girl.json)
  matcher: [
    '/', 
    '/(ru|en)/:path*', 
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
