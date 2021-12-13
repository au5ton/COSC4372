import cv from '@techstark/opencv-js'
import { reshape } from 'mathjs'
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

export function ApplySegmentation(canvas: HTMLCanvasElement, k: number) {
  // Read in the image
  let image = cv.imread(canvas)

  // Change color to RGB (from RGBA, the canvas default)
  cv.cvtColor(image, image, cv.COLOR_RGBA2RGB)
  //console.log('image.data',image.data)
  
  // Reshaping the image into a 2D array of pixels and 3 color values (RGB)
  const pixel_vals = reshape(Array.from(image.data as Uint8Array).map(e => Number(e)), [-1,3])

  // calculate kmeans
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