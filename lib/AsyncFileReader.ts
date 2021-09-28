export type FileReaderMode = 'text' | 'dataURL' | 'binaryString' | 'arrayBuffer';
export type FileReaderResult = string | ArrayBuffer | null;

export function readFile(file: File, mode: FileReaderMode): Promise<FileReaderResult> {
  return new Promise<FileReaderResult>((resolve, reject) => {
    // make file reader
    const reader = new FileReader();
    
    // setup callbacks
    reader.onabort = (err) => reject(err)
    reader.onerror = (err) => reject(err)
    reader.onload = () => {
      // Do whatever you want with the file contents
      resolve(reader.result)
    }

    if(mode === 'text') {
      reader.readAsText(file);
    }
    else if(mode === 'dataURL') {
      reader.readAsDataURL(file);
    }
    else if(mode === 'binaryString') {
      reader.readAsBinaryString(file);
    }
    else if(mode === 'arrayBuffer') {
      reader.readAsArrayBuffer(file);
    }
  });
}

export const readFileAsText = (file: File) => readFile(file, 'text');
export const readFileAsDataURL = (file: File) => readFile(file, 'dataURL');
export const readFileAsBinaryString = (file: File) => readFile(file, 'binaryString');
export const readFileAsArrayBuffer = (file: File) => readFile(file, 'arrayBuffer');