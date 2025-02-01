const TelegramBot = require('node-telegram-bot-api');
const { analyzeIngredientsOnText, sendLongMessage, splitMessage } = require('./helpers')
const { createWorker } = require('tesseract.js');
const Tesseract = require('tesseract.js');
const axios = require('axios');

require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const worker = createWorker();
//Обрбаботчик команд
bot.onText(/\/start/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `Привет ${msg.from.first_name}! Пришли мне список ингредиентов косметического средства или фотогравию состава, и я их проанализирую.`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "текст 💬",
            callback_data: 'text'
          },
          {
            text: "фото 📸",
            callback_data: 'img'
          }
        ]
      ]
    }
  })
})

bot.onText(/\/analyze_text/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `Пришли мне список ингредиентов косметического средства и я их проанализирую.`);
})

bot.onText(/\/analyze_photo/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `Пришли мне фотографию состава косметического средства и я их проанализирую.`);
})

bot.on('photo', async (msg) => {
  const { id } = msg.chat;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    bot.sendMessage(id, "Выполняем анализ вашего средства ✅", { parse_mode: 'Markdown' })

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
    // sendLongMessage(analysis, bot, id)

  } catch (error) {
    console.error('Ошибка:', error);
    bot.sendMessage(id, 'Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.');
  }
});

//Обработчик квери команд

bot.on('callback_query', query => {
  const { id } = query.message.chat

  switch (query.data) {
    case 'text':
      break;
    case "img":
      break;
  }
})

// Обработчик текстовых сообщений
bot.on('message', async (msg) => {
  const { id } = msg.chat;
  const text = msg.text;
  //костыль чтобы не реагировать на команды
  if (text && text?.[0] !== '/') {
    bot.sendMessage(id, "Выполняем анализ вашего средства ✅", { parse_mode: 'Markdown' })

    try {
      const analysis = await analyzeIngredientsOnText(text);
      sendLongMessage(analysis, bot, id)
    } catch (error) {
      console.error('Ошибка:', error);
      bot.sendMessage(id, 'Произошла ошибка при анализе. Попробуйте позже.');
    }
  }

});

// async function addImg(file) {
//   const client = new GigaChat(GIGACHAT_API_KEY);
//   await client.createToken()

//   const response = await client.completion({
//     model: "GigaChat:latest",
//     messages: [
//       {
//         role: "user",
//         content: 'определи состав косметологического средства на изображении и опиши ингридиенты',
//         file,
//         image: file
//       }
//     ]
//   })

//   console.log(response.choices[0].message.content, 'content')
// }


console.log('Бот запущен...');