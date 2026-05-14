import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';
import { getNotionHomePageMain, getNotionHomePageLinks } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';

/**
 * Основная страница (Server Component)
 * Использование Suspense позволяет мгновенно отправить оболочку (shell) 
 * в браузер, не дожидаясь ответа от Notion API.
 */
export default async function Page() {
  return (
    <Suspense fallback={<HomeClient />}>
      <HomeDataLoader />
    </Suspense>
  );
}

/**
 * Загрузчик данных с сервера
 */
async function HomeDataLoader() {
  // Если Notion отключен, сразу отдаем клиентский компонент без данных
  if (!CMS_CONFIG.USE_NOTION) {
    return <HomeClient />;
  }

  try {
    // Параллельный запрос к Notion
    // fetchWithTimeout внутри lib/notion.ts предотвратит вечное ожидание
    const [mainData, linksData] = await Promise.all([
      getNotionHomePageMain(),
      getNotionHomePageLinks()
    ]);

    return <HomeClient initialMain={mainData} initialLinks={linksData} />;
  } catch (error) {
    console.error('[HomeDataLoader] Failed to fetch data:', error);
    // В случае ошибки возвращаем клиент с дефолтными данными (которые зашиты в HomeClient)
    return <HomeClient />;
  }
}