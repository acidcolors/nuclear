import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '../components/Header';
import CustomCursor from '../components/CustomCursor';
import { GlobalScrollToTop } from '../components/GlobalScrollToTop';
import { CartDrawer } from '../components/CartDrawer';
import { SupportDrawer } from '../components/SupportDrawer';

// Настройка шрифта
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>

        {/* Кастомный курсор будет работать на всех страницах */}
        <CustomCursor />

        {/* Шапка теперь зафиксирована на уровне всего приложения */}
        <Header />

        {/* Корзина */}
        <CartDrawer />

        {/* Поддержка / Уведомления */}
        <SupportDrawer />

        {/* Глобальная кнопка "Вверх" */}
        <GlobalScrollToTop />

        {children}
      </body>
    </html>
  );
}