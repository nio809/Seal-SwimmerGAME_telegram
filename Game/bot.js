const { Telegraf, Markup } = require('telegraf');

// Replace with your bot's token
const bot = new Telegraf('________');

bot.start((ctx) => {
  const userId = ctx.from.id; // Get the user's ID from the context
  const gameUrl = `___your site where you hosted the html(Game)____?userId=${userId}`;  //the site where game is hosted
  ctx.reply(
    "Welcome! Press the button below to play the game.",
    Markup.inlineKeyboard([
      Markup.button.webApp("Play Game", gameUrl)
    ])
  );
});

bot.launch();
