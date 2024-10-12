'use client'
import { useState, useEffect, useCallback } from 'react'
import * as fal from "@fal-ai/serverless-client"
import Image from 'next/image'

fal.config({
  proxyUrl: "/api/fal/proxy",
})

const seed = Math.floor(Math.random() * 100000)
const baseArgs = {
  sync_mode: true, // for synchranisiason
  strength: .99, // increases or decreases the power of the algorithm
  seed
}

//const models = [
 // {"modelname":"AuraFlow","model":"fal-ai/aura-flow","img":"https://v2.fal.media/files/5034adc011ed406c9a4fece36a94aae8_ea99c3d3f7bf45c78b839c831381daf3.png"},
 // {"modelname":"Latent Consistency","model":"fal-ai/fast-lcm-diffusion","img":"https://fal-cdn.batuhan-941.workers.dev/files/rabbit/P322iQXlz2jOOuRFBWK-q.jpeg"},
 // {"modelname":"ControlNet SDXL","model":"fal-ai/fast-sdxl-controlnet-canny","img":"https://storage.googleapis.com/falserverless/gallery/fast-animatediff-t2v.webp"},
  //{"modelname":"AnimateDiff","model":"fal-ai/fast-animatediff/text-to-video","img":"https://fal-cdn.batuhan-941.workers.dev/files/rabbit/P322iQXlz2jOOuRFBWK-q.jpeg"}
//];

export default function Home() {
  const [input, setInput] = useState('masterpice, best quality, A cinematic shot of a baby raccoon wearing an intricate italian priest robe')
  const [image, setImage] = useState(null)
  const [sceneData, setSceneData] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [_appState, setAppState] = useState<any>(null)
  const [excalidrawExportFns, setexcalidrawExportFns] = useState<any>(null)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [Comp, setComp] = useState<any>(null);
  const [model, setModel] = useState<any>('110602490-sdxl-turbo-realtime')
  const [connection, setConnection] = useState<any>(null)

  useEffect(() => {
    import('@excalidraw/excalidraw').then((comp) => setComp(comp.Excalidraw))
  }, [])
  useEffect(() => { setIsClient(true) }, [])
  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) =>
      setexcalidrawExportFns({
        exportToBlob: module.exportToBlob,
        serializeAsJSON: module.serializeAsJSON
      })
    );
  }, []);

  useEffect(() => {
    const newConnection = fal.realtime.connect(model, {
      connectionKey: 'realtime-nextjs-app',
      onResult(result) {
        if (result.error) return
        setImage(result.images[0].url)
      }
    })
    setConnection(newConnection)

    return () => {
      if (newConnection && newConnection.close) {
        newConnection.close()
      }
    }
  }, [model])

  const send = useCallback((args: any) => {
    if (connection && connection.send) {
      connection.send(args)
    }
  }, [connection])

  async function getDataUrl(appState = _appState) {
    const elements = excalidrawAPI.getSceneElements()
    if (!elements || !elements.length) return
    const blob = await excalidrawExportFns.exportToBlob({
      elements,
      exportPadding: 0,
      appState,
      files: excalidrawAPI.getFiles(),
      getDimensions: () => { return {width: 450, height: 450}},
      mimeType: 'image/png'
    })
    return await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then((e:any) => e.target.result)
  }

  const handleImageClick = (model: string) => {
    setModel(model);
  };

  return (
    <main className="p-12">
      <p className="text-xl mb-2">Fal AI Model Seçimi</p>
      <select
        className="border rounded-lg p-2 w-full mb-2"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      >
        <option value="110602490-sdxl-turbo-realtime">SDXL Turbo</option>
        <option value="fal-ai/fast-sdxl-controlnet-canny">ControlNet SDXL</option>
        {/* You can add other model options here.
         connection key can be changed, you need to reconnect the api.*/}
        
      </select>
      <input
        className='border rounded-lg p-2 w-full mb-2'
        value={input}
        onChange={async (e) => {
          setInput(e.target.value)
          let dataUrl = await getDataUrl()
          send({
            ...baseArgs,
            prompt: e.target.value,
            image_url: dataUrl
          })
        }}
      />
      <div className='flex'>
        <div className="w-[550px] h-[570px] touch-action-none">
          {
            isClient && excalidrawExportFns && (
              <Comp
                excalidrawAPI={(api)=> setExcalidrawAPI(api)}
                onChange={async (elements, appState) => {
                  const newSceneData = excalidrawExportFns.serializeAsJSON(
                    elements,
                    appState,
                    excalidrawAPI.getFiles(),
                    'local'
                  )
                  if (newSceneData !== sceneData) {
                    setAppState(appState)
                    setSceneData(newSceneData)
                    let dataUrl = await getDataUrl(appState)
                    send({
                      ...baseArgs,
                      image_url: dataUrl,
                      prompt: input,
                    })
                  }
                }}
              />
            )
          }
        </div>
        {
          image && (
            <Image
              src={image}
              width={550}
              height={550}
              alt='fal image'
            />
          )
        }
      </div>
     
    </main>
  )
}



