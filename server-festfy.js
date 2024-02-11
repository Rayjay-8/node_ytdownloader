
import fs from 'fs'
import ytdl from 'ytdl-core'
import Fastify from 'fastify'
import path from 'path'
import estatico from '@fastify/static'
import { YouTube } from 'youtube-sr'
import { fileURLToPath } from 'url';
import soundcloud from "soundcloud-scraper"
import scdl from 'soundcloud-downloader'
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const fastify = Fastify({
  logger: true
})

const client = new soundcloud.Client();

fastify.register(estatico, {
   root: path.join(__dirname, 'public'),
   prefix: '/public/', // optional: default '/'
 })

// Declare a route
fastify.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})


fastify.get("/play/:user/:music", async function handler (rec, res) {
   const {user, music} = rec.params
   // console.log(scdl)

   // const a = scdl.default.isValidUrl(`https://soundcloud.com/${user}/${music}`)
   // console.log(`https://soundcloud.com/${user}/${music}`, a)
   // return 1
   let stream;
   stream = await scdl.default.download(`https://soundcloud.com/${user}/${music}`);

   res.headers({
      'Content-Type':'audio/mpeg',
      'Content-disposition': 'inline',
      'Transfer-Encoding': 'chunked'
   });
   
   console.log(stream)
   stream.pipe(res);
   stream.on('end', () => {
      res.send();
  });
   // return {user, music}
})

fastify.post("/soundcloud", async function handler (rec, rep) {
   const { st: searchvalue} = rec.body
   // const chave = await soundcloud.keygen()
   console.log(client)
   const busca = await client.search(searchvalue)
   // const song = await client.getSongInfo("https://soundcloud.com/mishashi-sensei/smooth")
   // console.log(song)
   return busca
})

fastify.post("/findyt", async function handler (rec, rep) {
   // console.log(rec.body, YouTube)
   const { st: searchvalue} = rec.body
   const videosfinded = await YouTube.search(searchvalue, { limit: 3 })
   return videosfinded
})

// função que faz download do video
fastify.get('/download/:url', async function handler (request, reply) {
   console.log(">>>", request.params)
   const { url } = request.params

   try {
      const urlcomplete = "https://www.youtube.com/watch?v="+url
      if(!url || !ytdl.validateURL(urlcomplete)){
         return reply.status(500).send("url invalido!")
      }

      const options = {}

      // const info = await ytdl.getInfo(urlcomplete)

      const title = url+".mp4"

      
      const videoPath = path.join(__dirname, "public", title)
      if(fs.existsSync(videoPath)){
         console.log("ja existe")
         reply.status(200).send('public/'+title)
      }
      const videowritestream = fs.createWriteStream(videoPath)



      ytdl(urlcomplete, options).pipe(videowritestream)

      videowritestream.on('finish' , () => {
         //fs.unlinkSync(videoPath) // deleta assim que é feito download
         return videoPath
      })

      reply.status(200).send('public/'+title)
   
   } catch (error) {
      console.log(error)
      reply.status(500).send("erro interno!")
   }


//   return { url }
})

try {
   await fastify.listen({ port: 3000 })
 } catch (err) {
   fastify.log.error(err)
   process.exit(1)
 }

// ytdl('https://www.youtube.com/watch?v=XKnUWmZ0LLw')
//   .pipe(fs.createWriteStream('video.mp4'));