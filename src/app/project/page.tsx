import { Suspense } from 'react';
import ProjectClient from '@/components/ProjectClient';
import { getNotionProducts } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';

export default async function Page() {
    return (
        <Suspense fallback={<ProjectClient />}>
            <ProjectDataLoader />
        </Suspense>
    );
}

async function ProjectDataLoader() {
    if (!CMS_CONFIG.USE_NOTION) {
        return <ProjectClient />;
    }

    try {
        const products = await getNotionProducts();
        return <ProjectClient initialProducts={products} />;
    } catch (error) {
        console.error('[ProjectDataLoader] Failed to fetch products:', error);
        return <ProjectClient />;
    }
}