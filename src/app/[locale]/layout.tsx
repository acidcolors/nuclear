import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Header } from '../../components/Header';
import CustomCursor from '../../components/CustomCursor';
import { GlobalScrollToTop } from '../../components/GlobalScrollToTop';
import { CartDrawer } from '../../components/CartDrawer';
import { SupportDrawer } from '../../components/SupportDrawer';
// 1. Импортируем компонент для работы со скриптами
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: 'Nuclear Garden',
  description: 'Welcome to my Nuclear Garden',
  icons: {
    icon: '/fav3.ico',
    apple: '/fav3.ico',
  },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {/* 2. Подключаем SDK Телеграма. 
              Используем afterInteractive для лучшей совместимости с React */}
          <Script
            src="https://telegram.org/js/telegram-web-app.js"
            strategy="afterInteractive"
          />

          <CustomCursor />
          <Header />
          <CartDrawer />
          <SupportDrawer />
          <GlobalScrollToTop />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}