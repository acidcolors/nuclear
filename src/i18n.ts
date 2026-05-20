import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Если локаль не определена или не входит в список, ставим дефолтную
  if (!locale || !['ru', 'en'].includes(locale)) {
    locale = 'ru';
  }

  return {
    locale: locale as string, // Явно указываем TypeScript, что это строка
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
