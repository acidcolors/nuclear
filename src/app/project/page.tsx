import { Suspense } from 'react';
import ProjectPageClient from '@/components/ProjectPageClient';
import { getNotionProducts, getNotionMainPageData } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';

/**
 * Страница проектов (Server Component)
 * Использует Suspense для предотвращения блокировки SSR тяжелыми запросами к Notion.
 */
export default async function Page() {
    return (
        // fallback передает ProjectPageClient в состоянии загрузки (forcedLoading=true)
        // Это позволяет браузеру мгновенно отрисовать "скелет" страницы и запустить прелоадер.
        <Suspense fallback={<ProjectPageClient forcedLoading={true} />}>
            <ProjectDataLoader />
        </Suspense>
    );
}

async function ProjectDataLoader() {
    // Если Notion отключен, возвращаем клиентский компонент без данных (он сам возьмет локальные)
    if (!CMS_CONFIG.USE_NOTION) {
        return <ProjectPageClient />;
    }

    try {
        // Параллельная загрузка данных с сервера
        const [products, header] = await Promise.all([
            getNotionProducts(),
            getNotionMainPageData()
        ]);

        return <ProjectPageClient initialProducts={products} initialHeader={header} />;
    } catch (error) {
        console.error('[ProjectDataLoader] Error:', error);
        // В случае ошибки возвращаем клиент (он покажет локальные данные)
        return <ProjectPageClient />;
    }
}