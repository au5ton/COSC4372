import { readFileAsDataURL } from '../lib/AsyncFileReader'

export function loadImageFileIntoCanvas(file: File, canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    readFileAsDataURL(file)
      .catch(err => reject(err))
      .then(contents => {
        if(typeof contents === 'string') {
          /**
           * After the file has been read, we need to create a build-in Image()
           * reference to it so we can draw it to the <canvas> element.
           */
          const img = new Image();
          img.src = contents;
          img.onload = function() {
            // Resize <canvas> to fit the original resolution of the image
            // We also account for the screens with a high pixel density (high-end laptops and smartphones)
            // Scale the canvas by window.devicePixelRatio
            canvas.width = img.naturalWidth * window.devicePixelRatio;
            canvas.height = img.naturalHeight * window.devicePixelRatio;
    
            // use css to bring it back to regular size
            // (this is also capped with max-width: 100% in the stylesheet)
            canvas.style.width = `${img.naturalWidth}px`;
            canvas.style.height = `${img.naturalHeight}px`;
    
            
            // Use a reference to the canvas below and get a 2D context from the canvas
            const context = canvas.getContext('2d');
            // set the scale of the context
            context?.scale(window.devicePixelRatio, window.devicePixelRatio);
    
            // Draw the unmodified image to both <canvas>es
            context?.drawImage(img, 0, 0);
            resolve();
          }
        }
      });
  });
}

/**
 * Requires that the canvas be initialized
 * with loadImageFileIntoCanvas() to account for
 * high resolution displays.
 */
export function getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData | null {
  const context = canvas.getContext('2d');
  const width = canvas.width/window.devicePixelRatio;
  const height = canvas.height/window.devicePixelRatio;

  if(context) {
    return context.getImageData(0, 0, width, height);
  }
  else {
    return null;
  }
}

/**
 * Requires that the canvas be initialized
 * with loadImageFileIntoCanvas() to account for
 * high resolution displays.
 */
export function writeImageDataIntoCanvas(data: ImageData, canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if(context) {
    if(data instanceof ImageData) {
      context.putImageData(data, 0, 0);
    }
    else {
      console.log('ANTICIPATED DISCLAIMER')
      const temp = context.createImageData((data as any).width, (data as any).height);
      for(let i = 0; i < temp.data.length; i++) {
        temp.data[i] = (data as any).data[i];
      }
      context.putImageData(temp, 0, 0);
    }
    
  }
}

export function toImageData(mat: any) {
  return {
    data: new Uint8ClampedArray(mat.data),
    width: mat.cols,
    height: mat.rows
  }
}

/**
 * Requires that the canvas be initialized
 * with loadImageFileIntoCanvas() to account for
 * high resolution displays.
 */
export function copyCanvasDataToAnotherCanvas(source: HTMLCanvasElement, destination: HTMLCanvasElement): void {
  const sourceData = getImageDataFromCanvas(source);
  if(sourceData) {
    writeImageDataIntoCanvas(sourceData, destination);
  }
}
