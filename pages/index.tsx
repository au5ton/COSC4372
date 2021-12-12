import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { Range } from 'rc-slider'
import * as CanvasIO from '../lib/canvasIO'
import { ApplyGrayscaleFilter, ApplyThreshold, GenerateAndApplyHistogram } from '../lib/imageProcessing'
import { LoaderRings } from '../components/SvgComponents'

import 'rc-slider/assets/index.css'
import styles from '../styles/Home.module.css'


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);

  const [threshold, setThreshold] = useState({one: 1, two: 255});

  // Processing
  const optionsDisabled = file === null
  const [shouldProcessGrayscale, setShouldProcessGrayscale] = useState(true);
  const [shouldProcessThreshold, setShouldProcessThreshold] = useState(false);
  

  const runFilters = () => {
    if(inputCanvasRef.current && outputCanvasRef.current && histogramCanvasRef.current) {
      // restore original image into output canvas
      CanvasIO.copyCanvasDataToAnotherCanvas(inputCanvasRef.current, outputCanvasRef.current);
      const output = outputCanvasRef.current
    
      // Always generate histogram
      GenerateAndApplyHistogram(CanvasIO.getImageDataFromCanvas(outputCanvasRef.current)!, histogramCanvasRef.current)

      // Apply filters
      if(shouldProcessGrayscale) ApplyGrayscaleFilter(output);
      if(shouldProcessThreshold) ApplyThreshold(output, threshold);
    }
  }

  // Once an image file is dropped onto the page
  useEffect(() => {
    (async () => {
      if(file && inputCanvasRef.current && outputCanvasRef.current) {
        setLoading(true);

        // Load image into canvases
        await CanvasIO.loadImageFileIntoCanvas(file, inputCanvasRef.current);
        await CanvasIO.loadImageFileIntoCanvas(file, outputCanvasRef.current);
        
        console.log('new image loaded into canvases');
        runFilters()
        setLoading(false);
      }
    })();
  }, [file])

  // Used once a filter option is changed
  useEffect(() => {
    (async () => {
      if(file && inputCanvasRef.current && outputCanvasRef.current) {
        setLoading(true);
        runFilters()
        console.log('filters done')
        setLoading(false);
      }
    })();
  }, [shouldProcessGrayscale, shouldProcessThreshold, threshold])

  

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
          {/* <button className="btn btn-primary" onClick={runFilters}>Test</button> */}
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
                      onChange={handleFileChange}
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
                  <canvas className={styles.canvas} ref={outputCanvasRef} width="300" height="300"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-lg py-2">
          <div className="Box">
            <div className="Box-header">
              <strong>Processing options</strong>
            </div>
            <ul>
              <li className="Box-row">
                <label>
                  <input className="mr-2" type="checkbox" disabled={optionsDisabled} checked={shouldProcessGrayscale} onChange={(e) => setShouldProcessGrayscale(e.target.checked)} />
                  Grayscale
                </label>
              </li>
              <li className="Box-row">
                <label>
                  <input className="mr-2" type="checkbox" disabled={optionsDisabled} checked={shouldProcessThreshold} onChange={(e) => setShouldProcessThreshold(e.target.checked)} />
                  Apply Threshold
                </label>
                <div id="histogram" className={styles.histogram}>
                  <h3>Histogram</h3>
                  <div className={styles.content}>
                    <div className="canvasArea">
                      <canvas ref={histogramCanvasRef}
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
                      {/* <button className="btn" id="thresholdSubmit" onClick={generateImageThreshold}>Set Threshold</button> */}
                    </div>
                  </div>
                </div>
              </li>
              <li className="Box-row">
                Box row three
              </li>
              <li className="Box-row">
                Box row four
              </li>
            </ul>
            <div className="Box-footer">
              Box footer
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
