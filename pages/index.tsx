import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { readFileAsDataURL } from '../lib/AsyncFileReader'
import { usePhoton } from '../lib/usePhoton'
import Slider from 'react-input-slider';

import styles from '../styles/Home.module.css'

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const photon = usePhoton();

  const [threshold, setThreshold] = useState({one: 1, two: 255});

  /**
   * Once an image file is dropped onto the page
   */
  useEffect(() => {
    (async () => {
      if(file && inputCanvasRef.current) {
        // Use a wrapper of the FileReader API to get the contents of the file
        const contents = await readFileAsDataURL(file);

        if(typeof contents === 'string') {
          /**
           * After the file has been read, we need to create a build-in Image()
           * reference to it so we can draw it to the <canvas> element.
           */
          const img = new Image();
          img.src = contents;
          img.onload = function() {
            if(inputCanvasRef.current && outputCanvasRef.current) {
              // Name some shortcuts
              const icanvas = inputCanvasRef.current;
              const ocanvas = outputCanvasRef.current;

              // Resize <canvas> to fit the original resolution of the image
              // We also account for the screens with a high pixel density (high-end laptops and smartphones)
              // Scale the canvas by window.devicePixelRatio
              icanvas.width = img.naturalWidth * window.devicePixelRatio;
              icanvas.height = img.naturalHeight * window.devicePixelRatio;
              ocanvas.width = img.naturalWidth * window.devicePixelRatio;
              ocanvas.height = img.naturalHeight * window.devicePixelRatio;

              // use css to bring it back to regular size
              // (this is also capped with max-width: 100% in the stylesheet)
              icanvas.style.width = `${img.naturalWidth}px`;
              icanvas.style.height = `${img.naturalHeight}px`;
              ocanvas.style.width = `${img.naturalWidth}px`;
              ocanvas.style.height = `${img.naturalHeight}px`;

              
              // Use a reference to the canvas below and get a 2D context from the canvas
              const context = icanvas.getContext('2d');
              // set the scale of the context
              context?.scale(window.devicePixelRatio, window.devicePixelRatio);

              // Draw the unmodified image to the input <canvas> 
              context?.drawImage(img, 0, 0);
              console.log('the image is drawn');
              // Go ahead and process the image automatically
              
              convertToGrayscale();
            }
            
          }
        }
      }
    })();
  }, [file])


  // converts canvas to data url for use in processing image
  const convertCanvasToImg = () => {
    let canvas = document.getElementById("gs__canvas") as HTMLCanvasElement;
    let img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  // generates histogram
  // reference: https://codepen.io/aNNiMON/pen/OqjGVP
  function processImage(inImg: any) {
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
    processImage(getImageData());
  }

  // used to be handleClick; renamed for clarity
  const convertToGrayscale = async () => {
    // Do some safety checks and get a 2D context for the input and output <canvas>es
    if(inputCanvasRef.current && outputCanvasRef.current && photon) {
      const inContext = inputCanvasRef.current.getContext('2d');
      const outContext = outputCanvasRef.current.getContext('2d');
      if(inContext && outContext) {
        // Convert the ImageData found in the canvas to a PhotonImage (so that it can communicate with the core Rust library)
        const image = photon.open_image(inputCanvasRef.current, inContext);

        // Filter the image, the PhotonImage's raw pixels are modified
        // (This is where we modify the image however we desire)
        //photon.filter(image, 'radio')
        photon.grayscale(image);
        
        // Place the modified image back on the canvas
        photon.putImageData(outputCanvasRef.current, outContext, image);

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

const adjustThreshold = (x: any) => {
  setThreshold({ ...threshold, one: x });
}


  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
          <div className={styles.input}>
            <h3>Input</h3>
            <input type="file" accept="image/*" onChange={handleChange} />
            <canvas id="original" className={styles.canvas} ref={inputCanvasRef} width="300" height="300"></canvas>
          </div>

          <div className={styles.output}>
            <h3>Output</h3>
            <canvas id="gs__canvas" className={styles.canvas} ref={outputCanvasRef} width="300" height="300">
              <img id="gs__image"></img>
            </canvas>
          </div>

          <div id="histogram" className={styles.histogram}>
            <h3>Histogram</h3>
            <div className="canvasArea">
              <canvas id="canvasHistogram"
              className={styles.canvas}
              width="430" height="220" />
              
              <div id="thres1" className="threshold">
                <Slider
                axis="x" x={threshold.one}
                xmin={1} xmax={255}
                styles={{
                  track: { backgroundColor: 'transparent' },
                  active: { backgroundColor: 'transparent' },
                  thumb: {
                    width: 1,
                    height: 100,
                    backgroundColor: 'red'
                  }
                }}
                onChange={ ({ x }) => setThreshold({ ...threshold, one: x }) } />
                
                <Slider
                axis="x" x={threshold.one}
                xmin={1} xmax={255}
                styles={{
                  track: { backgroundColor: 'transparent' },
                  active: { backgroundColor: 'transparent' },
                }}
                onChange={ ({ x }) => setThreshold({ ...threshold, one: x }) } />
              </div>

              <div id="thres1" className="threshold">
                <Slider
                axis="x" x={threshold.two}
                xmin={1} xmax={255}
                styles={{
                  track: { backgroundColor: 'transparent' },
                  active: { backgroundColor: 'transparent' },
                  thumb: {
                    width: 1,
                    backgroundColor: 'red'
                  }
                }}
                onChange={ ({ x }) => setThreshold({ ...threshold, two: x }) } />
                  
                <Slider
                axis="x" x={threshold.two}
                xmin={1} xmax={255}
                styles={{
                  track: { backgroundColor: 'transparent' },
                  active: { backgroundColor: 'transparent' },
                }}
                onChange={ ({ x }) => setThreshold({ ...threshold, two: x }) } />
              </div>

            </div>
          </div>
      </main>
    </div>
  )
}
