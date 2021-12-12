import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import cv from '@techstark/opencv-js'
import { Range } from 'rc-slider';
import * as CanvasIO from '../lib/canvasIO'
import type { CanvasWorkerOperation, CanvasWorkerRequest } from '../lib/canvasWorker'
import { WorkerDaemon } from '../lib/WorkerDaemon';
import { usePhoton } from '../lib/usePhoton'
import { LoaderRings } from '../components/SvgComponents'

import 'rc-slider/assets/index.css';
import styles from '../styles/Home.module.css'


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const thresholdCanvas = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<WorkerDaemon>(new WorkerDaemon());
  const worker = workerRef.current;
  const photon = usePhoton();

  const [threshold, setThreshold] = useState({one: 1, two: 255});

  useEffect(() => {
    (async () => {
      console.log('calling LoadOpenCV')
      await worker.LoadOpenCV();
      console.log('finished LoadOpenCV')
    })();
  }, [])

  const runFilters = async () => {
    console.log('processing grayscale')
    // if(workerRef.current === undefined) {
    //   workerRef.current = new Worker(new URL('../lib/canvasWorker.ts', import.meta.url))
    //   //workerRef.current = new Worker('/worker.js');
    // }
    // const worker = workerRef.current
    // worker.onmessage = (event) => {
    //   console.log('message!', event)
    //   if(event.data.msg === 'load') {
    //     worker.postMessage({ msg: 'imageProcessing' });
    //   }
    // };
    // const req: CanvasWorkerRequest = { operation: 'LoadOpenCV', imageData: null as any };
    // worker.postMessage(req);
    //worker.postMessage({ msg: 'load' });


    
    if(outputCanvasRef.current) {
      //const sourceData = CanvasIO.getImageDataFromCanvas(outputCanvasRef.current)!;
      const sourceData = cv.imread(outputCanvasRef.current)
      cv.
      console.log('sourceData?',sourceData)
      // Have the worker do our request for us
      const res = await worker.ConvertToGrayscale(CanvasIO.toImageData(sourceData));
      console.log('outputData?',res)

      // Apply the response to the canvas
      if(res.status === 'success') {
        CanvasIO.writeImageDataIntoCanvas(res.payload, outputCanvasRef.current);
      }
    }
    console.log('finished grayscale')
  }

  /**
   * Once an image file is dropped onto the page
   */
  useEffect(() => {
    (async () => {
      if(file && inputCanvasRef.current && outputCanvasRef.current) {
        setLoading(true);

        // Load image into canvases
        await CanvasIO.loadImageFileIntoCanvas(file, inputCanvasRef.current);
        await CanvasIO.loadImageFileIntoCanvas(file, outputCanvasRef.current);
        //CanvasIO.copyCanvasDataToAnotherCanvas(inputCanvasRef.current, outputCanvasRef.current);
        
        console.log('new image loaded into canvases');
        await runFilters();
        //convertToGrayscale()
        //console.log('filters done!')
      }
    })();
  }, [file])

  /**
   * Once some aspect of the filter settings have been changed.
   */
  //useEffect()

  // converts canvas to data url for use in processing image
  const convertCanvasToImg = () => {
    let canvas = document.getElementById("gs__canvas") as HTMLCanvasElement;
    let img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  // generates histogram
  // reference: https://codepen.io/aNNiMON/pen/OqjGVP
  function processImage(inImg: ImageData) {
    const src = new Uint32Array(inImg.data.buffer);

    let histBrightness = (new Array(256)).fill(0);
    let histR = (new Array(256)).fill(0);
    let histG = (new Array(256)).fill(0);
    let histB = (new Array(256)).fill(0);
    for (let i = 0; i < src.length; i++) {
      let r = src[i] & 0xFF;
      let g = (src[i] >> 8) & 0xFF;
      let b = (src[i] >> 16) & 0xFF;
      histBrightness[r]++;
      histBrightness[g]++;
      histBrightness[b]++;
      histR[r]++;
      histG[g]++;
      histB[b]++;

    }
    
    let maxBrightness = 0;
      for (let i = 1; i < 256; i++) {
        if (maxBrightness < histBrightness[i]) {
          maxBrightness = histBrightness[i]
        }
      }
    
    const canvas = document.getElementById('canvasHistogram') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      let guideHeight = 8;
      let startY = (canvas.height - guideHeight);
      let dx = canvas.width / 256;
      let dy = startY / maxBrightness;
      ctx.lineWidth = dx;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < 256; i++) {
        let x = i * dx;
        // Value
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - histBrightness[i] * dy);
        ctx.closePath();
        ctx.stroke(); 
        
        // Guide
        ctx.strokeStyle = 'rgb(' + i + ', ' + i + ', ' + i + ')';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, canvas.height);
        ctx.closePath();
        ctx.stroke(); 
      }
    }
  }
  
  // retrieve image data for processImage function
  function getImageData() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const img = document.getElementById("gs__image") as HTMLImageElement;
    if (img) {
    canvas.width = img.width;
    canvas.height = img.height;
      if (context) {
        context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, img.width, img.height);
      }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  const updateHistogram = () => {
    processImage(getImageData()!);
  }

  // used to be handleClick; renamed for clarity
  const convertToGrayscale = async () => {
    // Do some safety checks and get a 2D context for the input and output <canvas>es
    if(inputCanvasRef.current && outputCanvasRef.current && photon) {
      const inContext = inputCanvasRef.current.getContext('2d');
      const outContext = outputCanvasRef.current.getContext('2d');
      if(inContext && outContext) {
        // Convert the ImageData found in the canvas to a PhotonImage (so that it can communicate with the core Rust library)
        //const image = photon.open_image(inputCanvasRef.current, inContext);
        const image = cv.imread(inputCanvasRef.current)
        //const image = cv.matFromImageData(CanvasIO.getImageDataFromCanvas(inputCanvasRef.current!)!)

        // Filter the image, the PhotonImage's raw pixels are modified
        // (This is where we modify the image however we desire)
        //photon.filter(image, 'radio')
        //photon.grayscale(image);
        const imgGray = new cv.Mat();
        cv.cvtColor(image, imgGray, cv.COLOR_BGR2GRAY);
        
        // Place the modified image back on the canvas
        //photon.putImageData(outputCanvasRef.current, outContext, image);
        cv.imshow(outputCanvasRef.current, imgGray);
        //cv.
        //CanvasIO.writeImageDataIntoCanvas(cv.toImageData(imgGray), outputCanvasRef.current!)

        convertCanvasToImg();
        let newImg = convertCanvasToImg();
        
        let output = document.getElementById("gs__image") as HTMLImageElement;

        if (output) {
          output.src = newImg.src;
          output.onload = updateHistogram;
        }
      }
    }
  }

  const generateImageThreshold = (e: any) => {
    let img = document.getElementById("gs__image") as HTMLImageElement;
    if (outputCanvasRef.current) {
      let ctx = outputCanvasRef.current.getContext("2d");

      var w = img.width,
          h = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        var d = ctx.getImageData(0, 0, w, h);

        for (var i=0; i<d.data.length; i+=4) { // 4 is for RGBA channels
          // R=G=B=R>T?255:0
          d.data[i] = d.data[i+1] = d.data[i+2] = threshold.one < d.data[i+1] && d.data[i+1] < threshold.two ? 255 : 0;
        }
      
        ctx.putImageData(d, 0, 0);
      }
    }

  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="container-lg">
          <button className="btn btn-primary" onClick={runFilters}>Test</button>
          <div className="d-flex flex-column flex-sm-row g-2">
            {/* Source image */}
            <div className="col-6 float-left">
              <div className="Box Box">
                <div className="Box-header d-flex flex-items-center">
                  <h3 className="Box-title overflow-hidden flex-auto">
                    Source image
                  </h3>
                  <label style={{ height: 30 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                      hidden
                    />
                    <span className="btn btn-primary btn-sm">
                      Select file
                    </span>
                  </label>
                </div>
                <div className="Box-body d-flex flex-justify-center">
                  <canvas id="original" className={styles.canvas} ref={inputCanvasRef} width="300" height="300"></canvas>
                </div>
              </div>
            </div>

            {/* Output image */}
            <div className="col-6 float-left">
              <div className="Box Box">
                <div className="Box-header d-flex flex-items-center">
                  <h3 className="Box-title overflow-hidden flex-auto">
                    Output image
                  </h3>
                  {
                    loading ?
                    <>
                      <span>Processing...</span>
                      <LoaderRings height={30} width={30} />
                    </> :
                    <span className="btn btn-primary btn-sm" style={{ height: 30, visibility: 'hidden' }}>Select file</span>
                  }
                </div>
                <div className="Box-body d-flex flex-justify-center">
                  <canvas id="gs__canvas" className={styles.canvas} ref={outputCanvasRef} width="300" height="300"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="Box Box">
          <div className="Box-header d-flex flex-items-center">
            <h3 className="Box-title overflow-hidden flex-auto">
              Box title
            </h3>
            <label>
              <input type="checkbox" checked={true} />
              Apply Effect
            </label>
          </div>
          <div className="Box-body">
            Box body
          </div>
        </div>

        <div id="histogram" className={styles.histogram}>
          <h3>Histogram</h3>
          <div className={styles.content}>
            <div className="canvasArea">
              <canvas id="canvasHistogram"
              className={styles.canvas}
              width="430" height="220" />
              
              <div className="threshold">
                <Range
                  className="redline"
                  min={1}
                  max={255}
                  defaultValue={[threshold.one, threshold.two]}
                  value={[threshold.one, threshold.two]}
                  onChange={(value) => setThreshold({ one: value[0], two: value[1] })}
                />
                <Range
                  className="thumbs"
                  min={1}
                  max={255}
                  defaultValue={[threshold.one, threshold.two]}
                  value={[threshold.one, threshold.two]}
                  onChange={(value) => setThreshold({ one: value[0], two: value[1] })}
                />
              </div>
            </div>

            <div className="graphData">
              <span className="thresholdLv">
                <label>Threshold 1:</label> { threshold.one }
              </span>
              <span className="thresholdLv">
                <label>Threshold 2:</label> { threshold.two }
              </span>
              <button className="btn" id="thresholdSubmit"
              onClick={generateImageThreshold}>Set Threshold</button>
              </div>
            </div>

          </div>
      </main>
    </div>
  )
}
