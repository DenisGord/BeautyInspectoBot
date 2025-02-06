const GigaChat = require('gigachat-node').GigaChat;
const axios = require('axios');
const cheerio = require('cheerio');
const Tesseract = require('tesseract.js');

const analyzeIngredientsOnText = async (ingredients) => {
  const prompt = `
  Ты — эксперт в области косметологии и химии. Проанализируй состав косметического средства, которое я предоставлю. Состав представлен в виде списка ингредиентов. Твоя задача:

    1. *Название продукта:*  
       - Укажи название продукта, если оно есть во входящем сообщении. Если нет, напиши: "Название продукта не указано."
    
    2. *Описание продукта:*  
       - Кратко опиши, для чего предназначен продукт (например, "Энзимная пудра с древесным углём для жирной кожи").
    
    3. *Компоненты:*  
       - Перечисли все ингредиенты из состава.  
       - Обящательно для каждого ингредиента добавь краткое описание его функции (например, "Для глубокого очищения и отшелушивания").  
    
    4. *Плюсы ✅:*  
       - Перечисли полезные ингредиенты, используя эмоджи зеленой галочки ✅.  
       - Добавь пояснение, почему они полезны (например, "Помогает балансировать микробиом кожи").  
    
    5. *Минусы ❌:*  
       - Перечисли потенциально вредные или раздражающие ингредиенты, используя эмоджи красного крестика ❌.  
       - Добавь пояснение, почему они могут быть вредны (например, "Может вызывать раздражение у чувствительной кожи").  
    
    6. Вывод:  
       - Сделай общий вывод о продукте.  
       - Укажи, для какого типа кожи он подходит.  
       - Добавь рекомендации (например, "Рекомендуется провести тест на небольшом участке кожи перед использованием").  
    
       
    Формат ответа:  
       - Ответ должен быть структурированным (пометь каждый этап проверки цифрой) и легко читаемым (после каждого ингридиента должен быть перенос строки). Используй маркированные списки помечай заголовки жирным текстом оборачивая его в *загловок*, не используй ###
      
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

const splitMessage = (text, maxLength = 4096) => {
  const messages = [];
  while (text.length > 0) {
    messages.push(text.substring(0, maxLength));
    text = text.substring(maxLength);
  }
  return messages;
};

const getProductIngredients = async (url, id, bot) => {
  try {
    // Загружаем HTML-код страницы
    const { data: html } = await axios.get(url);

    // Парсим HTML с помощью Cheerio
    const $ = cheerio.load(html);

    // Ищем блок с составом (пример для «Золотое Яблоко»)
    const ingredients = $('[text="состав"] > div').text() // Уточните селектор для состава
    const brand = $('h1 > a').text()
    const name = $('h1 > [itemprop="name"]').text()
    if (!ingredients) {
      throw new Error('Состав не найден на странице');
    }

    return { ingredients, brand, name };
  } catch (error) {
    bot.sendMessage(id, 'Произошла ошибка при получении состава');
    throw error;
  }
}

const photoAnalyze = async (msg, bot) => {
  const { id } = msg.chat;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    // Скачивание фото
    const fileLink = await bot.getFileLink(fileId);
    const imageResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });

    // Распознавание текста с помощью Tesseract
    const { data: { text } } = await Tesseract.recognize(
      imageResponse.data, // Буфер изображения
      'rus+eng', // Языки для распознавания
    );

    if (!text) {
      throw new Error('Текст не распознан');
    }

    // Анализ текста с помощью GigaChat
    const analysis = await analyzeIngredientsOnText(text);
    const messages = splitMessage(analysis);
    for (const message of messages) {
      await bot.sendMessage(id, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    bot.sendMessage(id, 'Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.');
  }
}

const textAnalyze = async (text, bot, id, name) => {
  try {
    const analysis = await analyzeIngredientsOnText(`название ${name} ингридиенты ${text}`);
    const messages = splitMessage(analysis);
    for (const message of messages) {
      await bot.sendMessage(id, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    bot.sendMessage(id, 'Произошла ошибка при анализе. Попробуйте позже.');
  }
}

module.exports = { analyzeIngredientsOnText, splitMessage, getProductIngredients, photoAnalyze, textAnalyze }