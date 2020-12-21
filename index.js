const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.get('/webhook', (req, res) => {
  res.end('I am listening. Please access with POST.');
});

// webhook callback
app.post('/webhook', line.middleware(config), (req, res) => {
  if (req.body.destination) {
    console.log('Destination User ID: '+ req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((error) => {
      console.error(error.message);
      res.status(500).end();
    });
});

const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text })),
  );
};

const createCarouselItems = (data) => {
  const carouselItems = data.map((item) => {
    return {
      thumbnailImageUrl: item.image_url,
      title: (item.title.length > 40) ? `${item.title.slice(0, 37)}...` : item.title,
      text: `${item.rank ? `Rank: #${item.rank} - `: ''} Score: ${item.score}`,
      actions: [
        { label: 'Details', type: 'uri', uri: item.url },
      ],
    };
  });

  return carouselItems;
};

const getTopAiringAnime = async () => {
  try {
    const response = await fetch('https://api.jikan.moe/v3/top/anime/1/airing');
    const data = await response.json();
    return data.top.slice(0, 10);
  } catch (error) {
    console.error(error.message);
  }
};

const getTopAnimeMovies = async () => {
  try {
    const response = await fetch('https://api.jikan.moe/v3/top/anime/1/movie');
    const data = await response.json();
    return data.top.slice(0, 10);
  } catch (error) {
    console.error(error.message);
  }
};

const getTopUpcomingAnime = async () => {
  try {
    const response = await fetch('https://api.jikan.moe/v3/top/anime/1/upcoming');
    const data = await response.json();
    return data.top.slice(0, 10);
  } catch (error) {
    console.error(error.message);
  }
};

const getTopAnimeByPopularity = async () => {
  try {
    const response = await fetch('https://api.jikan.moe/v3/top/anime/1/bypopularity');
    const data = await response.json();
    return data.top.slice(0, 10);
  } catch (error) {
    console.error(error.message);
  }
};

const getTopFavoritedAnime = async () => {
  try {
    const response = await fetch('https://api.jikan.moe/v3/top/anime/1/favorite');
    const data = await response.json();
    return data.top.slice(0, 10);
  } catch (error) {
    console.error(error.message);
  }
};

const getAnimeByTitle = async (title) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v3/search/anime?q=${title}&page=1`);
    const data = await response.json();
    if (typeof data.results !== 'undefined') {
      return data.results.slice(0, 10);
    } else {
      return 0;
    }
  } catch (error) {
    console.error(error.message);
  }
};

const handleEvent = (event) => {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log('Test hook recieved: '+ JSON.stringify(event.message));
  }

  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
      return client.getProfile(event.source.userId)
        .then((profile) => replyText(
          event.replyToken,
          [
            `Hello, ${profile.displayName} ${String.fromCodePoint(0x100084)}. Nimobot disini. Nimubot akan membantumu untuk mendapatkan informasi Anime yang kamu inginkan. Silahkan ketikkan judul Anime yang ingin kamu cari..`,
            `Atau kamu bisa memilih menu dibawah ini untuk menampilkan daftar Anime (Ketik 1/2/3/4/5):\n1. Top Anime Airing\n2. Top Anime Movies\n3. Top Upcoming Anime\n4. Top Anime by Popularity\n5. Top Favorited Anime
            `,
          ],
        ));
  }
};

const handleText = async (message, replyToken, source) => {
  try {
    switch (message.text.toLowerCase()) {
      case 'hello':
        if (source.userId) {
          const profile = await client.getProfile(source.userId);
          return replyText(
            replyToken,
            [
              `Hello ${profile.displayName} ${String.fromCodePoint(0x100084)}, Nimobot disini. Nimubot akan membantumu untuk mendapatkan informasi Anime yang kamu inginkan. Silahkan ketikkan judul Anime yang ingin kamu cari..`,
              `Atau kamu bisa memilih menu dibawah ini untuk menampilkan daftar Anime (Ketik 1/2/3/4/5):\n1. Top Anime Airing\n2. Top Anime Movies\n3. Top Upcoming Anime\n4. Top Anime by Popularity\n5. Top Favorited Anime
              `
            ],
          );
        } else {
          return replyText(replyToken, 'Bot can\'t use profile API without user ID');
        }

      case '1':
        const topAiringAnime = await getTopAiringAnime();
        return client.replyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: '#Top Airing Anime', 
            },
            {
              type: 'template',
              altText: 'Top Airing Anime Carousel',
              template: {
                type: 'carousel',
                columns: createCarouselItems(topAiringAnime),
              },
            },
          ],
        );

      case '2':
        const topAnimeMovies = await getTopAnimeMovies();
        return client.replyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: '#Top Anime Movies', 
            },
            {
              type: 'template',
              altText: 'Top Anime Movies Carousel',
              template: {
                type: 'carousel',
                columns: createCarouselItems(topAnimeMovies),
              },
            },
          ],
        );

      case '3':
        const topUpcomingAnime = await getTopUpcomingAnime();
        return client.replyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: '#Top Upcoming Anime', 
            },
            {
              type: 'template',
              altText: 'Top Upcoming Anime Carousel',
              template: {
                type: 'carousel',
                columns: createCarouselItems(topUpcomingAnime),
              },
            },
          ],
        );

      case '4':
        const topAnimeByPopularity = await getTopAnimeByPopularity();
        return client.replyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: '#Top Anime By Popularity', 
            },
            {
              type: 'template',
              altText: 'Top Anime By Popularity Carousel',
              template: {
                type: 'carousel',
                columns: createCarouselItems(topAnimeByPopularity),
              },
            },
          ],
        );

      case '5':
        const topFavoritedAnime = await getTopFavoritedAnime();
        return client.replyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: '#Top Favorited Anime', 
            },
            {
              type: 'template',
              altText: 'Top Favorite Anime Carousel',
              template: {
                type: 'carousel',
                columns: createCarouselItems(topFavoritedAnime),
              },
            },
          ],
        );

      default:
        // Search anime
        const results = await getAnimeByTitle(message.text.toLowerCase());
        
        if (results) {
          return client.replyMessage(
            replyToken,
            [
              {
                type: 'text',
                text: `#Search Results: "${message.text}"`, 
              },
              {
                type: 'template',
                altText: 'Search Anime Carousel',
                template: {
                  type: 'carousel',
                  columns: createCarouselItems(results),
                },
              },
            ],
          );
        } else {
          return client.replyMessage(
            replyToken,
            [
              {
                type: 'text',
                text: `Judul Anime "${message.text}" tidak ditemukan!`,
              },
              {
                type: 'sticker',
                packageId: 11537,
                stickerId: 52002770,
              },
              {
                type: 'text',
                text: `Kamu bisa memilih menu dibawah ini untuk menampilkan daftar Anime (Ketik 1/2/3/4/5):\n1. Top Anime Airing\n2. Top Anime Movies\n3. Top Upcoming Anime\n4. Top Anime by Popularity\n5. Top Favorited Anime`,
              },
            ],
          );
        }
    }
  } catch (error) {
    console.error(error.message);
  }
};

// listen on port
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Running on server: https://nimubot-server.herokuapp.com/webhook`);
  console.log(`Running on local: http://localhost:3000/webhook`);
});
