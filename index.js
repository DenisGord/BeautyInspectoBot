const TelegramBot = require('node-telegram-bot-api');
const { getProductIngredients, photoAnalyze, textAnalyze } = require('./helpers')

require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

//Обрбаботчик команд
bot.onText(/\/start/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `🌟 *${msg.from.first_name} добро пожаловать в бот для анализа косметики! *🌟
  
__Ты можешь прислать мне:__

🍏 ссылку на продукт из золотого яблока

📝 список ингредиентов косметического средства 

📸 фотогравию состава, и я их проанализирую.`, { parse_mode: 'Markdown' })
})

bot.onText(/\/analyze_text/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `Пришли мне ссылку список ингредиентов косметического средства и я их проанализирую.`);
})

bot.onText(/\/analyze_photo/, (msg) => {
  const { id } = msg.chat
  bot.sendMessage(id, `Пришли мне фотографию состава косметического средства и я их проанализирую.`);
})

// Обработчик текстовых сообщений
bot.on('message', async (msg) => {
  const { id } = msg.chat;
  const text = msg.text;
  const photo = msg.photo
  if ((text && text[0] !== '/') || photo) {
    bot.sendMessage(id, "Выполняем анализ вашего средства ✅", { parse_mode: 'Markdown' })
    switch (true) {
      case Boolean(photo):
        photoAnalyze(msg, bot)
        break;
      case text.includes('https://goldapple.ru'):
        const findUrl = text.split(' ').find(i => i.startsWith('https://goldapple.ru'))
        const { ingredients, brand, name } = await getProductIngredients(findUrl, id, bot)
        textAnalyze(ingredients.replace(/[^a-zA-Zа-яА-Я0-9\s,.]/g, ''), bot, id, (brand.trim() + ' ' + name.trim()).replace(/[^a-zA-Zа-яА-Я0-9\s,.]/g, ''))
        break;
      case text && text?.[0] !== '/':
        textAnalyze(text.replace(/[^a-zA-Zа-яА-Я0-9\s,.]/g, ''), bot, id)
        break;
    }
  }
});




console.log('Бот запущен...');