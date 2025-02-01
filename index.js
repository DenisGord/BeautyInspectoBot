const GigaChat = require('gigachat-node').GigaChat;
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Пришли мне список ингредиентов косметического средства, и я их проанализирую.');
});

// Обработчик текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  //TODO надо разобраться как отправлять фото в гигачат

  // if(msg?.photo){
  //   await addImg(msg.photo[0].file_id)
  // }

  try {
    const analysis = await analyzeIngredients(text);
    analysis.length && bot.sendMessage(chatId, "Выполняем анализ вашего средства ✅", { parse_mode: 'Markdown' })
    const length = analysis.length % 4095 ? analysis.length / 4095 + 1 : analysis.length / 4095


    for (let i = 0; i < length; i++) {
      const sendText = analysis.slice(i * 4095, i * 4095 + 4095)
      sendText && await bot.sendMessage(chatId, sendText, { parse_mode: 'Markdown' })
    }
  } catch (error) {
    console.error('Ошибка:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при анализе. Попробуйте позже.');
  }
});

async function addImg(file){
  const client = new GigaChat(GIGACHAT_API_KEY);
  await client.createToken()

  const response = await client.completion({
    model: "GigaChat:latest",
    messages: [
      {
        role: "user",
        content: 'определи состав косметологического средства на изображении и опиши ингридиенты',
        file
      }
    ]
  })

  console.log(response.choices[0].message.content, 'content')
}

//TODO надо поправить данную функцию перывым делом надо проверить что запрос соответствует анализу кос.средства  

async function analyzeIngredients(ingredients) {
  const prompt = `Проанализируй состав косметического средства. Для каждого ингредиента:
1. Определи тип компонента
2. Оцени потенциальную опасность
3. Отметь полезные ингридиенты зеленой галочкой ✅ а вредные красным крестом ❌
4. Дай краткое пояснение

Состав: ${ingredients}`;

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

console.log('Бот запущен...');