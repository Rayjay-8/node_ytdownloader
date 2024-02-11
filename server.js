import express from 'express';
import path from 'path';
import scdl from 'soundcloud-downloader';
import { fileURLToPath } from 'url';
import ytdl from 'ytdl-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware para servir arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.get('/info/:id', async (req, res) => {
  const { id } = req.params
  const info = await ytdl.getBasicInfo('https://www.youtube.com/watch?v='+id);

  res.setHeader('Access-Control-Allow-Origin','*');
  res.json({info: info.formats})
})

app.get("/yt/:id/:action/:quality", async (req, res) => {
   const { id, action, quality } = req.params;
   // action = 1 = mostra o video
   // action = 2 = faz download do video
   // action = 3 = mostra o audio
   // action = 4 = faz download do audio
   let action_s = action ?? 1
   let stream;

   const normalizedUrl = `https://www.youtube.com/watch?v=`+id
 
   try {
   //   stream = await scdl.default.download(`https://soundcloud.com/${user}/${music}`);
   // { filter: 'audioonly' }
  //  format: 'mp4'
    let options = {quality: quality ?? `18`}
    if(action_s == 3 || action_s == 4){
      options = {filter :'audioonly'}
    }
    stream = ytdl(normalizedUrl, options);
   } catch (error) {
     res.status(500).send("Error downloading audio");
     return;
   }
 
   res.set({
     'Content-Type': (action_s == 1 || action_s == 2) ? 'video/mp4': 'audio/mpeg',
     'Content-Disposition': (action_s == 1 || action_s == 3) ? 'inline' : 'attachment',
     'Transfer-Encoding': 'chunked'
   });
 
   stream.pipe(res);

   stream.on('end', () => {
     res.end();
   });

})

// Rota para reproduzir música do soundcloud
app.get("/play/:user/:music", async (req, res) => {
  const { user, music } = req.params;
  let stream;

  try {
    stream = await scdl.default.download(`https://soundcloud.com/${user}/${music}`);
   //  stream = ytdl(normalizedUrl, { filter: 'audioonly' });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading audio");
    return;
  }

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Disposition': 'inline',
    'Transfer-Encoding': 'chunked'
  });

  stream.pipe(res);
  stream.on('end', () => {
    res.end();
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});