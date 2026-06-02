import { Suspense } from 'react';
import ArchivePageClient from '@/components/ArchivePageClient';
import { getNotionArchiveProducts, getNotionArchiveMainPageData } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';

/**
 * Страница архива (Server Component)
 * Использует Suspense для предотвращения блокировки SSR тяжелыми запросами к Notion.
 */
export default async function Page() {
    return (
        // fallback передает ArchivePageClient в состоянии загрузки (forcedLoading=true)
        // Это позволяет браузеру мгновенно отрисовать "скелет" страницы и запустить прелоадер.
        <Suspense fallback={<ArchivePageClient forcedLoading={true} />}>
            <ArchiveDataLoader />
        </Suspense>
    );
}

async function ArchiveDataLoader() {
    // Если Notion отключен, возвращаем клиентский компонент без данных (так как архив полностью Notion-driven, вернется пустой архив)
    if (!CMS_CONFIG.USE_NOTION) {
        return <ArchivePageClient />;
    }

    try {
        // Параллельная загрузка данных с сервера из архивных баз данных Notion
        const [products, header] = await Promise.all([
            getNotionArchiveProducts(),
            getNotionArchiveMainPageData()
        ]);

        return <ArchivePageClient initialProducts={products} initialHeader={header} />;
    } catch (error) {
        console.error('[ArchiveDataLoader] Error:', error);
        // В случае ошибки возвращаем пустой клиент архива
        return <ArchivePageClient />;
    }
}
