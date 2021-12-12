// Lots of help from: https://github.com/vinissimus/opencv-js-webworker/blob/master/public/js/cv.worker.js

import { toImageData } from "./canvasIO";

//import { toImageData } from '@techstark/opencv-js'
//const cv = {} as any;

// cv['onRuntimeInitialized'] = ()=>{
//   console.log('runtime initialized!!')
// };

export type CanvasWorkerOperation = 'LoadOpenCV' | 'ConvertToGrayscale';

export interface CanvasWorkerRequest<T> {
  uuid?: string;
  operation: CanvasWorkerOperation;
  payload: T;
}

export interface CanvasWorkerResponse<T> {
  uuid: string;
  status: 'success' | 'error';
  payload: T;
}

// src/webworker/example.worker.ts
const ctx: Worker = self as any

ctx.onmessage = async (event: MessageEvent<CanvasWorkerRequest<any>>) => {
  //console.log(self)
  try {
    if(event.data && event.data.operation) {
      switch(event.data.operation) {
        case 'LoadOpenCV':
          //console.log('LoadOpenCV called')
          self.importScripts('https://docs.opencv.org/4.5.4/opencv.js');
          ctx.postMessage({ uuid: event.data.uuid, status: 'success', payload: await WaitForOpenCV() })
          break
        case 'ConvertToGrayscale':
          ctx.postMessage({ uuid: event.data.uuid, status: 'success', payload: await ConvertToGrayscale(event.data.payload) });
          break;
        default:
          console.warn(`A CanvasWorkerOperation could not be found with: ${event.data.operation}`);
          ctx.postMessage({ uuid: event.data.uuid, status: 'error', payload: null });
          break;
      }
    }
    else {
      console.warn('CanvasWorkerRequest was oddly shaped.');
      ctx.postMessage({ uuid: event.data.uuid, status: 'error', payload: null });
    }
  }
  catch(err) {
    console.error('yo wtf happened here??', err);
    ctx.postMessage({ uuid: event.data.uuid, status: 'error', payload: null });
  }
}

// Use OpenCV to convert to grayscale
async function ConvertToGrayscale(sourceData: ImageData): Promise<ImageData> {
  const img = cv.matFromImageData(sourceData);
  const imgGray = new cv.Mat();
  cv.cvtColor(img, imgGray, cv.COLOR_BGR2GRAY);
  //const response = cv.toImageData(imgGray);
  const response = toImageData(imgGray);
  return response;
}

// Creates an CV ImageData object from given image.
// function toImageData(img: any) {
//   return {
//     data: new Uint8ClampedArray(img.data),
//     width: img.cols,
//     height: img.rows
//   }
// }

function WaitForOpenCV(waitTimeMs = 30000, stepTimeMs = 100): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (cv.Mat) resolve(true)

    let timeSpentMs = 0
    const interval = setInterval(() => {
      const limitReached = timeSpentMs > waitTimeMs
      if (cv.Mat || limitReached) {
        clearInterval(interval)
        return resolve(!limitReached)
      } else {
        timeSpentMs += stepTimeMs
      }
    }, stepTimeMs)
  });
}

export default ctx