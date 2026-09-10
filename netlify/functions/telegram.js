exports.handler = async function(event) {

    if (event.httpMethod !== "POST") {

        return {
            statusCode: 200,
            body: "Telegram bot is working"
        };

    }

    try {

        const update =
            JSON.parse(event.body);

        if (update.message) {

            const chatId =
                update.message.chat.id;

            const text =
                update.message.text || "";

            if (text === "/start") {

                await sendMessage(
                    chatId,
                    "📖 Електронний журнал\n\nНатисніть кнопку нижче, щоб відкрити журнал."
                );

            }

        }

        return {
            statusCode: 200,
            body: "ok"
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,
            body: "error"
        };

    }

};


async function sendMessage(chatId, text) {

    const token =
        process.env.TELEGRAM_BOT_TOKEN;

    const url =
        `https://api.telegram.org/bot${token}/sendMessage`;

    await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            chat_id: chatId,

            text: text,

            reply_markup: {

                inline_keyboard: [

                    [
                        {
                            text: "📖 Відкрити журнал",
                            web_app: {
                                url: process.env.JOURNAL_URL
                            }
                        }
                    ]

                ]

            }

        })

    });

}
