'use server';

import { getLocale } from 'next-intl/server';

const NOTION_SECRET = process.env.NOTION_SECRET;

/**
 * Обертка над fetch с таймаутом для предотвращения зависания SSR
 */
async function fetchWithTimeout(url: string, options: any, timeout = 7000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            console.error(`[Notion] Request timed out for: ${url}`);
        }
        throw error;
    }
}

export async function getNotionProducts() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_DATABASE_EN_ID : process.env.NOTION_DATABASE_ID;

    console.log('getNotionProducts: fetching all products for DB:', databaseId);
    
    if (!NOTION_SECRET || !databaseId) return [];

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

        const data = await response.json();
        if (!data.results) return [];

        const getText = (prop: any) => {
            if (!prop) return '';
            const list = prop.title || prop.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };
        const getNumber = (prop: any) => prop?.number?.toString() || '';
        const getMultiSelect = (prop: any) => prop?.multi_select?.map((s: any) => s.name) || [];

        const getSortNumber = (properties: any) => {
            if (!properties) return null;
            const keys = Object.keys(properties);
            // Приоритет отдаем index, order или решетке, и только в конце - id
            const sortKey = keys.find(key => {
                const lowerKey = key.toLowerCase();
                return lowerKey.includes('index') || lowerKey.includes('order') || lowerKey.includes('#');
            }) || keys.find(key => key.toLowerCase() === 'id');
            
            if (!sortKey) return null;
            const prop = properties[sortKey];
            if (prop.type === 'number') return prop.number;
            
            const text = prop.title?.[0]?.plain_text || prop.rich_text?.[0]?.plain_text || '';
            // Вытаскиваем только цифры (чтобы prj_01 превратилось в 1)
            const digits = text.replace(/\D/g, '');
            if (!digits) return null;
            const num = parseInt(digits, 10);
            return isNaN(num) ? null : num;
        };

        const items = data.results
            .filter((page: any) => {
                if (page.properties.Checkbox) {
                    return page.properties.Checkbox.checkbox === true;
                }
                return true;
            })
            .map((page: any) => {
                const props = page.properties;
                const galleryFiles = props.Gallery?.files || props.main?.files || [];
                const imageUrls = galleryFiles.map((f: any) => f.file?.url || f.external?.url).filter(Boolean);

                return {
                    id: getText(props.id) || page.id,
                    notionId: page.id,
                    title: getText(props.Title) || getText(props.Name) || '',
                    description: getText(props.Description),
                    price: props.Price?.type === 'number' ? getNumber(props.Price) : getText(props.Price),
                    year: props.Year?.type === 'number' ? getNumber(props.Year) : getText(props.Year),
                    size: getText(props.Size),
                    material: getText(props.Material),
                    role: getText(props.Role),
                    tags: getMultiSelect(props.Tags),
                    notionImages: imageUrls,
                    sortOrder: getSortNumber(props),
                    edition: getText(props['Тираж']) || getText(props.Edition) || ''
                };
            });

        // Сортируем: по возрастанию sortOrder
        items.sort((a: any, b: any) => {
            if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
            if (a.sortOrder !== null) return -1;
            if (b.sortOrder !== null) return 1;
            return 0;
        });

        return items;
    } catch (error: any) {
        console.error('Error in getNotionProducts:', error.message);
        return [];
    }
}

export async function getNotionMainPageData() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_MAIN_EN_PAGE_DATABASE_ID : process.env.NOTION_MAIN_PAGE_DATABASE_ID;

    if (!NOTION_SECRET || !databaseId) return null;

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                page_size: 1
            }),
            next: { revalidate: 5 }
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

        const data = await response.json();
        const page = data.results[0];
        if (!page) return null;

        const props = page.properties;
        const getText = (prop: any) => {
            if (!prop) return '';
            const list = prop?.title || prop?.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };
        const getMultiSelect = (prop: any) => prop?.multi_select?.map((s: any) => s.name) || [];

        return {
            title: getText(props.Title),
            description: getText(props.Description),
            tags: getMultiSelect(props.Tags)
        };
    } catch (error: any) {
        console.error('Error in getNotionMainPageData:', error.message);
        return null;
    }
}

export async function getNotionContactData() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_CONTACT_EN_DATABASE_ID : process.env.NOTION_CONTACT_DATABASE_ID;

    if (!NOTION_SECRET || !databaseId) return [];

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            next: { revalidate: 5 }
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

        const data = await response.json();
        const getText = (prop: any) => {
            if (!prop) return '';
            if (prop?.type === 'url') return prop.url || '';
            const list = prop?.title || prop?.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };

        return data.results.map((page: any) => {
            const props = page.properties;
            const title = getText(props.Title) || getText(props.Name) || getText(props.title) || getText(props.name);
            const desc = getText(props.Discription) || getText(props.Description) || getText(props.discription) || getText(props.description) || getText(props.Text);
            const url = getText(props.URL) || getText(props.Url) || getText(props.url) || getText(props.Link) || getText(props.link);
            
            return {
                id: page.id,
                title: title,
                description: desc,
                url: url
            };
        });
    } catch (error: any) {
        console.error('Error in getNotionContactData:', error.message);
        return [];
    }
}

export async function getNotionFriendsData() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_FRIENDS_EN_DATABASE_ID : process.env.NOTION_FRIENDS_DATABASE_ID;

    if (!NOTION_SECRET || !databaseId) return [];

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            next: { revalidate: 5 }
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

        const data = await response.json();
        const getText = (prop: any) => {
            if (!prop) return '';
            if (prop?.type === 'url') return prop.url || '';
            const list = prop?.title || prop?.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };
        const getNumber = (properties: any) => {
            if (!properties) return null;
            const keys = Object.keys(properties);
            const sortKey = keys.find(key => {
                const lowerKey = key.toLowerCase();
                return lowerKey.includes('index') || 
                       lowerKey.includes('order') || 
                       lowerKey.includes('id') || 
                       lowerKey.includes('#');
            });
            
            if (!sortKey) return null;
            const prop = properties[sortKey];
            if (prop.type === 'number') return prop.number;
            
            // Если это текст, пробуем распарсить число
            const text = prop.title?.[0]?.plain_text || prop.rich_text?.[0]?.plain_text || '';
            const num = parseInt(text, 10);
            return isNaN(num) ? null : num;
        };

        const items = data.results.map((page: any) => {
            const media = page.properties['Files & media']?.files || [];
            const imageUrl = media[0]?.file?.url || media[0]?.external?.url || '';

            return {
                id: page.id,
                name: getText(page.properties.Name) || getText(page.properties.Title),
                text: getText(page.properties.Text),
                image: imageUrl,
                url: getText(page.properties.url_f) || getText(page.properties.URL) || getText(page.properties.Link) || '',
                sortOrder: getNumber(page.properties)
            };
        });

        // Сортируем: сначала элементы с указанным порядком (по возрастанию), затем без порядка
        items.sort((a: any, b: any) => {
            if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
            if (a.sortOrder !== null) return -1;
            if (b.sortOrder !== null) return 1;
            return 0;
        });

        return items;
    } catch (error: any) {
        console.error('Error in getNotionFriendsData:', error.message);
        return [];
    }
}

export async function getNotionHomePageMain() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_HOME_EN_MAIN_DB_ID : process.env.NOTION_HOME_MAIN_DB_ID;

    if (!NOTION_SECRET || !databaseId) return null;

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ page_size: 20 }),
            next: { revalidate: 5 }
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);
        const data = await response.json();
        
        const results = data.results;
        console.log('[Notion Debug] Found pages in Home Main DB:', results?.map((p: any) => {
            const list = p.properties.Title?.title || p.properties.Name?.title || p.properties.Title?.rich_text || p.properties.Name?.rich_text || [];
            return list[0]?.plain_text || 'No Title';
        }));

        if (!results || results.length === 0) return null;

        const getText = (prop: any) => {
            if (!prop) return '';
            const list = prop?.title || prop?.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };

        // Ищем основные данные (обычно первая запись, которая НЕ бегущая строка)
        const mainPage = results.find((p: any) => !getText(p.properties.Title).includes('Бегущая Строка')) || results[0];
        
        // Ищем данные бегущей строки (гибкий поиск)
        const marqueePage = results.find((p: any) => {
            const t = (getText(p.properties.Title) || getText(p.properties.Name)).toLowerCase();
            return t.includes('бегущая строка');
        });

        const mainData = {
            title: getText(mainPage.properties.Title) || getText(mainPage.properties.Name),
            description: getText(mainPage.properties.Discription) || getText(mainPage.properties.Description)
        };

        let marqueeData = null;
        if (marqueePage) {
            console.log('[Notion Debug] Found Marquee Page properties:', Object.keys(marqueePage.properties));
            marqueeData = {
                isActive: marqueePage.properties.Checkbox?.checkbox === true,
                text: getText(marqueePage.properties.Description) || getText(marqueePage.properties.Discription) || getText(marqueePage.properties.Text) || "ДРОП ОТКРЫТОК 10x15 ✧",
                link: marqueePage.properties.URL?.url || getText(marqueePage.properties.URL) || marqueePage.properties.Link?.url || getText(marqueePage.properties.Link)
            };
        }

        return { mainData, marqueeData };
    } catch (error: any) {
        console.error('Error in getNotionHomePageMain:', error.message);
        return null;
    }
}

export async function getNotionHomePageLinks() {
    const locale = await getLocale();
    const databaseId = locale === 'en' ? process.env.NOTION_HOME_EN_LINKS_DB_ID : process.env.NOTION_HOME_LINKS_DB_ID;

    if (!NOTION_SECRET || !databaseId) return [];

    try {
        const response = await fetchWithTimeout(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            next: { revalidate: 5 }
        });

        if (!response.ok) throw new Error(`Notion API error: ${response.status}`);
        const data = await response.json();
        const getText = (prop: any) => {
            if (!prop) return '';
            if (prop?.type === 'url') return prop.url || '';
            const list = prop?.title || prop?.rich_text || [];
            return list.map((item: any) => item?.plain_text || '').join('');
        };

        return data.results
            .filter((page: any) => page.properties.Checkbox?.checkbox === true)
            .map((page: any) => {
                const props = page.properties;
                return {
                    id: page.id,
                    name: getText(props.Name) || getText(props.Title),
                    url: getText(props.url_h) || getText(props.URL) || getText(props.Link)
                };
            });
    } catch (error: any) {
        console.error('Error in getNotionHomePageLinks:', error.message);
        return [];
    }
}