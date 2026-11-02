import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import '../globals.css';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import CustomCursor from '../../components/CustomCursor';
import { GlobalScrollToTop } from '../../components/GlobalScrollToTop';
import { CartDrawer } from '../../components/CartDrawer';
import { SupportDrawer } from '../../components/SupportDrawer';
import { PromoModal } from '../../components/PromoModal';
// 1. Импортируем компонент для работы со скриптами
import Script from 'next/script';

// Основной шрифт сайта (заголовки и описание) — Inter. Оставлен для быстрого отката.
const inter = localFont({
  src: '../../../public/fonts/Inter-Variable.woff2',
  variable: '--font-inter',
});

// Тестовый шрифт — JetBrains Mono (Google Fonts)
const testFont = JetBrains_Mono({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-test',
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
      <body className={`${inter.variable} ${testFont.variable} ${testFont.className}`}>
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
          <PromoModal />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}