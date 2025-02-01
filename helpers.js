const GigaChat = require('gigachat-node').GigaChat;

const analyzeIngredientsOnText = async (ingredients) => {
    const prompt = `
    Ты — помощник для анализа косметических средств. Твоя задача — проанализировать состав косметического продукта и выдать результат в следующем формате:

    1. Название продукта:  
       - Укажи название продукта, если оно есть во входящем сообщении. Если нет, напиши: "Название продукта не указано."
    
    2. Описание продукта:  
       - Кратко опиши, для чего предназначен продукт (например, "Энзимная пудра с древесным углём для жирной кожи").
    
    3. Компоненты:  
       - Перечисли все ингредиенты из состава.  
       - Для каждого ингредиента добавь краткое описание его функции (например, "Для глубокого очищения и отшелушивания").  
    
    4. Плюсы ✅:  
       - Перечисли полезные ингредиенты, используя эмоджи зеленой галочки ✅.  
       - Добавь пояснение, почему они полезны (например, "Помогает балансировать микробиом кожи").  
    
    5. Минусы ❌:  
       - Перечисли потенциально вредные или раздражающие ингредиенты, используя эмоджи красного крестика ❌.  
       - Добавь пояснение, почему они могут быть вредны (например, "Может вызывать раздражение у чувствительной кожи").  
    
    6. Вывод:  
       - Сделай общий вывод о продукте.  
       - Укажи, для какого типа кожи он подходит.  
       - Добавь рекомендации (например, "Рекомендуется провести тест на небольшом участке кожи перед использованием").  
    
       
    Формат ответа:  
       - Ответ должен быть структурированным (пометь каждый этап проверки цифрой) и легко читаемым (после каждого ингридиента должен быть перенос строки). Используй маркированные списки (не используй ###)  
      
  Теперь проанализируй входящее сообщение и выполни задачу ${ingredients}
    `

    const client = new GigaChat(process.env.GIGACHAT_API_KEY);
    await client.createToken()

    const response = await client.completion({
        model: "GigaChat:latest",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    })
    return response.choices[0].message.content
}

const sendLongMessage = async (text, bot, chatId) => {
    const length = text.length % 4095 ? text.length / 4095 + 1 : text.length / 4095

    for (let i = 0; i < length; i++) {
        const sendText = text.slice(i * 4095, i * 4095 + 4095)
        sendText && await bot.sendMessage(chatId, sendText, { parse_mode: "Markdown" })
    }
}

const splitMessage = (text, maxLength = 4096) => {
    const messages = [];
    while (text.length > 0) {
        messages.push(text.substring(0, maxLength));
        text = text.substring(maxLength);
    }
    return messages;
};

module.exports = { analyzeIngredientsOnText, sendLongMessage, splitMessage }