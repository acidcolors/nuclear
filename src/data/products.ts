// src/data/products.ts

export interface Product {
    id: string;
    folderId: string;
    title: string;
    price: string;
    description: string;
    galleryImagesCount: number;
    year: string;
    size: string;
    material: string;
    role: string;
    illustrator?: string; // Сделаем необязательным, если нужно
    tags: string[]; // <-- Добавили массив хэштегов
}

export const products: Product[] = [
    {
        id: 'prj_01',
        folderId: 'prod_01',
        title: 'Открытки',
        price: '2000 ₽',
        description: 'Коллекция открыток «Горит сарай — гори и хата». В наборе 10 штук формата 10х15 см. Всё уже упаковано и ready to gift: можно подарить весь сет целиком или раздарить поштучно.',
        galleryImagesCount: 6,
        year: '2025',
        size: '10х15 см',
        material: 'Бумага',
        role: 'катянуёбтвоюмать x kesa.exe',
        tags: ['Открытки'] // <-- Добавили нужные теги
    },
    {
        id: 'prj_02',
        folderId: 'prod_02',
        title: 'Открытки',
        price: '2000',
        description: 'Коллекция открыток «Горит сарай — гори и хата». В наборе 10 штук формата 7х10.5 см. Всё уже упаковано и ready to gift: можно подарить весь сет целиком или раздарить поштучно.',
        galleryImagesCount: 6,
        year: '2024',
        size: '7х10.5 см',
        material: 'Бумага',
        role: 'UI/UX Design',
        tags: ['Открытки'] // <-- Добавили теги
    }
];

// Вспомогательная функция для получения продукта по ID
export const getProductById = (id: string) => {
    return products.find(p => p.id === id);
};

// Хелпер для получения пути к главному фото (для карточки)
export const getPreviewImagePath = (folderId: string) => {
    return `/product/${folderId}/main_${folderId}.jpg`;
};

// Хелпер для получения путей ко всем картинкам галереи
// Обрати внимание: имена файлов в твоих папках не идут по порядку с 1.
// Поэтому для автоматизации лучше переименовать их в image1.png, image2.png и т.д.
// Ниже приведен пример логики, если файлы переименованы по порядку.
export const getGalleryImagePaths = (folderId: string, count: number) => {
    const paths = [];
    for (let i = 1; i <= count; i++) {
        paths.push(`/product/${folderId}/image${i}.jpg`);
    }
    return paths;
};

// НОВЫЙ ХЕЛПЕР: собирает все уникальные теги из всех продуктов
export const getAllTags = () => {
    const tagsSet = new Set<string>();
    products.forEach(product => {
        // Убрали .toUpperCase()
        product.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
};