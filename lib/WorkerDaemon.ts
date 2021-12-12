// Lots of help from: https://github.com/vinissimus/opencv-js-webworker/blob/master/services/cv.js
import { v4 as uuid } from 'uuid';
import type { CanvasWorkerRequest, CanvasWorkerResponse } from './canvasWorker';

interface EventState {
  status: 'loading' | 'success' | 'error';
  payload: any;
}

export class WorkerDaemon {
  #worker: Worker;
  #status: Map<string, EventState>;
  constructor() {
    this.#status = new Map<string, EventState>();
    if(typeof window !== 'undefined') {
      this.#worker = new Worker(new URL('./canvasWorker.ts', import.meta.url));
      this.#worker.addEventListener('message', (event: MessageEvent<CanvasWorkerResponse<any>>) => {
        //console.log('response event!', event)
        this.#status.set(event.data.uuid, { status: event.data.status, payload: event.data.payload });
      });
    }
    else {
      this.#worker = undefined as any;
    }
  }
  
  #dispatch<T>(event: CanvasWorkerRequest<T>): Promise<CanvasWorkerResponse<T>> {
    event.uuid = uuid();
    this.#status.set(event.uuid, { status: 'loading', payload: null });
    this.#worker.postMessage(event);
    return new Promise((resolve, reject) => {
      let interval = setInterval(() => {
        const state = this.#status.get(event.uuid!);
        //console.log('interval checking: ',state)
        if(state) {
          if(state.status === 'success') {
            const response: CanvasWorkerResponse<T> = {
              uuid: event.uuid!,
              status: state?.status,
              payload: state.payload,
            }
            resolve(response);
          }
          if(state.status === 'error') reject(state.payload)
          if(state.status !== 'loading') { 
            //this.#status.delete(event.uuid!);
            clearInterval(interval)
          }
        }
      }, 50)
    });
  }

  async LoadOpenCV() {
    return await this.#dispatch<null>({ operation: 'LoadOpenCV', payload: null });
  }

  async ConvertToGrayscale(sourceImage: ImageData) {
    return await this.#dispatch<ImageData>({ operation: 'ConvertToGrayscale', payload: sourceImage })
  }
}

// export function sendWorkerRequest(request: CanvasWorkerRequest): Promise<CanvasWorkerResponse> {
//   return new Promise((resolve) => {
//     const worker = new Worker(new URL('./canvasWorker.ts', import.meta.url));
//     worker.onmessage = (event: MessageEvent<CanvasWorkerResponse>) => {
//       worker.terminate();
//       resolve(event.data);
//     };
//     worker.postMessage(request);
//   });
// }
