import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { normalizeContact } from '@/lib/telegram';

// 1. Инициализация Notion
const notion = new Client({ auth: process.env.NOTION_SECRET });

// 3. Функция для создания заказа в Notion
async function createNotionOrder(
    orderNumber: number,
    items: any[],
    totalPrice: number,
    customerInfo: string,
    tgUser?: any,
    contactType?: 'email' | 'telegram'
) {
    const databaseId = process.env.NOTION_ORDERS_DB_ID;

    if (!databaseId) {
        console.warn('NOTION_ORDERS_DB_ID is not configured');
        return;
    }

    try {
        const personText = tgUser?.username
            ? `${customerInfo} (@${tgUser.username})`
            : customerInfo;

        const itemsText = items
            .map((item: any) => `${item.title} (x${item.quantity})`)
            .join('\n');

        const telegramId = tgUser?.id ? String(tgUser.id) : "Нет ID";

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Title": {
                    title: [
                        {
                            text: {
                                content: `Заказ #${orderNumber}`,
                            },
                        },
                    ],
                },
                "Person": {
                    rich_text: [
                        {
                            text: {
                                content: personText,
                            },
                        },
                    ],
                },
                "Price": {
                    number: Number(totalPrice),
                },
                "items": {
                    rich_text: [
                        {
                            text: {
                                content: itemsText,
                            },
                        },
                    ],
                },
                "Telegram ID": {
                    rich_text: [
                        {
                            text: {
                                content: telegramId,
                            },
                        },
                    ],
                },
            },
        });
    } catch (error) {
        // Ошибка в Notion не должна прерывать выполнение основного роута
        console.error('[Notion] order creation error:', error);
    }
}

// 4. Функция для отправки Email подтверждения
async function sendEmailConfirmation(
    orderNumber: number,
    items: any[],
    totalPrice: number,
    email: string
) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('[Email] EMAIL_USER or EMAIL_PASS is not configured');
            return;
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.yandex.ru',
            port: 587,
            secure: false, // true только для 465 порта
            family: 4,     // Принудительно используем IPv4
            connectionTimeout: 5000,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const itemsHtml = items
            .map(item => `<li>${item.title} (x${item.quantity})</li>`)
            .join('');

        const mailOptions = {
            from: '"Nuclear Garden" <info@nucleargarden.ru>',
            to: email,
            subject: 'Ваш заказ оформлен | Nuclear Garden',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; border: 1px solid #eee;">
                    <h2 style="text-transform: uppercase; letter-spacing: -1px; color: #111; margin-bottom: 20px;">Ваш заказ оформлен!</h2>
                    <p style="margin-bottom: 20px;">Спасибо, мы получили информацию о вашем заказе!</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <p style="margin: 0 0 10px 0;"><strong>Номер заказа:</strong> #${orderNumber}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Товары:</strong></p>
                        <ul style="margin: 0; padding-left: 20px; color: #333;">
                            ${itemsHtml}
                        </ul>
                        <p style="margin: 15px 0 0 0; font-size: 18px;"><strong>Итоговая сумма:</strong> ${totalPrice} ₽</p>
                    </div>

                    <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; pt: 20px;">
                        Вы можете написать нам в <a href="https://t.me/mynuclear" style="color: #111; font-weight: bold; text-decoration: underline;">Telegram-группу</a> для уточнения деталей и узнать статус заказа.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email] Confirmation sent to ${email}`);
    } catch (error) {
        console.error('[Email] Failed to send confirmation:', error);
    }
}

async function sendTelegramMessage(
    orderNumber: number,
    items: any[],
    totalPrice: number,
    customerInfo: string,
    userMessage?: string,
    baseUrl?: string,
    tgUser?: any
) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = "-1003811463175";
    const threadId = 3; // Фиксированный топик "Новый заказ"

    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        throw new Error('Telegram credentials not configured');
    }

    const contact = normalizeContact(customerInfo);
    const contactType = customerInfo.includes('@') && customerInfo.includes('.') ? 'email' : 'telegram';
    
    // Формируем текст сообщения в едином стиле
    let messageText = `— <b>новый заказ #${orderNumber}</b>\n\n`;
    
    const contactValue = tgUser?.username ? `@${tgUser.username}` : contact.value;
    messageText += `<b>Контакт:</b> ${contactValue}\n`;
    
    if (tgUser?.id) {
        messageText += `<b>ID:</b> <code>${tgUser.id}</code>\n`;
    } else {
        messageText += `<b>ID:</b> нет\n`;
    }

    if (totalPrice > 0) {
        messageText += `<b>Итог:</b> ${totalPrice} ₽\n`;
    }

    if (userMessage) {
        messageText += `\n<b>Сообщение:</b> ${userMessage}\n`;
    }

    if (items && items.length > 0) {
        messageText += `\n<b>Товары:</b>\n`;
        messageText += items.map((item: any) => {
            const escapedTitle = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `— ${escapedTitle} (x${item.quantity})`;
        }).join('\n');
    }

    // Умный прокси: только в продакшене
    const agent = process.env.NODE_ENV === 'production' 
        ? new HttpsProxyAgent(process.env.PROXY_URL || 'http://103.75.126.30:8888') 
        : undefined;

    const axiosConfig = { 
        httpsAgent: agent, 
        proxy: false as const,
        timeout: 10000
    };

    try {
        console.log(`[Telegram] Sending admin notification. Mode: ${process.env.NODE_ENV}`);
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            message_thread_id: threadId,
            text: messageText.trim(),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }, axiosConfig);

        // Отправка подтверждения пользователю в личку (только для Telegram)
        if (contactType === 'telegram' && tgUser?.id) {
            const customerMessage = `Спасибо, мы получили информацию о вашем заказе!\nНомер вашего заказа: #${orderNumber}\nИтого: ${totalPrice} ₽\n\nНапишите нам в <a href="https://t.me/mynuclear">группу</a> для уточнения деталей и узнать статус заказа.`;
            
            console.log(`[Telegram] Sending private message to user ${tgUser.id}`);
            try {
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    chat_id: tgUser.id,
                    text: customerMessage,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }, axiosConfig);
            } catch (userErr: any) {
                console.warn('[Telegram] Could not send private message to user:', userErr.response?.data || userErr.message);
            }
        }
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error('[Telegram] API error:', errorData || error.message);
        throw new Error(`Telegram API Error: ${errorData?.description || error.message}`);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, totalPrice, customerInfo, message: userMessage, tgUser } = body;

        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const origin = host ? `${protocol}://${host}` : undefined;

        const orderNumber = Math.floor(10000 + Math.random() * 90000);
        
        // Определяем тип контакта
        const contactType = customerInfo.includes('@') && customerInfo.includes('.') ? 'email' : 'telegram';
        console.log(`[Checkout] New order #${orderNumber}. Contact type: ${contactType}`);

        // 1. Сохранение в Notion
        await createNotionOrder(orderNumber, items, totalPrice || 0, customerInfo, tgUser, contactType);

        // 2. Отправка уведомлений в Telegram (админу и клиенту, если TG)
        await sendTelegramMessage(orderNumber, items, totalPrice || 0, customerInfo, userMessage, origin, tgUser);

        // 3. Отправка Email-подтверждения (если Email)
        if (contactType === 'email') {
            // Не дожидаемся (await), чтобы не задерживать ответ пользователю, 
            // либо дожидаемся внутри try/catch в функции
            await sendEmailConfirmation(orderNumber, items, totalPrice || 0, customerInfo);
        }

        return NextResponse.json({ success: true, orderNumber });
    } catch (error: any) {
        console.error('[Checkout] Fatal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}