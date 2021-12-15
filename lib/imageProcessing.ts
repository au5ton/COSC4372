import cv from '@techstark/opencv-js'
import { reshape } from 'mathjs'
//import * as clustering from 'density-clustering'
import seedColor from 'seed-color'
import * as CanvasIO from '../lib/canvasIO'
import kmeans from './kmeans'

export function ApplyGrayscaleFilter(canvas: HTMLCanvasElement) {
  const image = cv.imread(canvas)
  const imgGray = new cv.Mat();
  cv.cvtColor(image, imgGray, cv.COLOR_BGR2GRAY);
  cv.imshow(canvas, imgGray);
}

// generates histogram
// reference: https://codepen.io/aNNiMON/pen/OqjGVP
export function GenerateAndApplyHistogram(inImg: ImageData, canvas: HTMLCanvasElement) {
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
  
  //const canvas = document.getElementById('canvasHistogram') as HTMLCanvasElement;
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

export function ApplyThreshold(canvas: HTMLCanvasElement, threshold: { one: number, two: number }) {
  const context = canvas.getContext('2d');
  const d = CanvasIO.getImageDataFromCanvas(canvas);
  if(d && context) {
    for (var i=0; i<d.data.length; i+=4) { // 4 is for RGBA channels
      // R=G=B=R>T?255:0
      d.data[i] = d.data[i+1] = d.data[i+2] = threshold.one < d.data[i+1] && d.data[i+1] < threshold.two ? 255 : 0;
    }
    //context.putImageData(d, 0, 0);
    CanvasIO.writeImageDataIntoCanvas(d, canvas);
  }
}

export function ApplyKMeansSegmentation(canvas: HTMLCanvasElement, k: number) {
  // Read in the image
  let image = cv.imread(canvas)

  // Change color to RGB (from RGBA, the canvas default)
  cv.cvtColor(image, image, cv.COLOR_RGBA2RGB)
  
  // Reshaping the image into a 2D array of pixels and 3 color values (RGB)
  const pixel_vals = reshape(Array.from(image.data as Uint8Array).map(e => Number(e)), [-1,3])

  // calculate kmeans
  console.log('computing k-means: timer started')
  console.time('computing k-means');
  const { centroids, labels2 } = kmeans(pixel_vals, k)

  // Use labels to compute ImageData
  const imageData: ImageData = {
    data: new Uint8ClampedArray((labels2 as number[])
    .map(c => ([
      Math.round(centroids[c][0]),
      Math.round(centroids[c][1]),
      Math.round(centroids[c][2]),
      255
    ]))
    .flat()),
    width: image.cols,
    height: image.rows,
  };

  console.timeEnd('computing k-means');

  // Write ImageData back to canvas
  CanvasIO.writeImageDataIntoCanvas(imageData, canvas);
}

export function ApplyDBSCANSegmentation(inputFile: File, outputCanvas: HTMLCanvasElement, neighborhoodRadius: number, minPointsPerCluster: number, overwriteNoise: boolean): Promise<void> {
  console.time('doing dbscan')
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', inputFile);
    formData.append('eps', `${neighborhoodRadius}`);
    formData.append('min_samples', `${minPointsPerCluster}`);
    // upload image for processing
    const SERVER = 'https://phobos.soot.dev/fuckthisproject'
    const outputImageUrl = `${SERVER}/uploads/${inputFile.name}`
    fetch(`${SERVER}/dbscan`, {
      method: 'POST',
      body: formData
    }).then(() => {
      // once done, download image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = outputImageUrl;
      img.onload = function() {
        // Resize <canvas> to fit the original resolution of the image
        // We also account for the screens with a high pixel density (high-end laptops and smartphones)
        // Scale the canvas by window.devicePixelRatio
        outputCanvas.width = img.naturalWidth * window.devicePixelRatio;
        outputCanvas.height = img.naturalHeight * window.devicePixelRatio;

        // use css to bring it back to regular size
        // (this is also capped with max-width: 100% in the stylesheet)
        outputCanvas.style.width = `${img.naturalWidth}px`;
        outputCanvas.style.height = `${img.naturalHeight}px`;

        
        // Use a reference to the canvas below and get a 2D context from the canvas
        const context = outputCanvas.getContext('2d');
        // set the scale of the context
        context?.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Draw the unmodified image to both <canvas>es
        context?.drawImage(img, 0, 0);
        console.timeEnd('doing dbscan')
        resolve();
      }
    });
  });
}