import '@primer/css/dist/primer.css'
import '../styles/primer-gap.css'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {

  // Enables automatic dark/light mode in Primer
  useEffect(() => {
    document.body.setAttribute('data-color-mode','auto');
    document.body.setAttribute('data-light-theme','light');
    document.body.setAttribute('data-dark-theme','dark');
  });

  return <Component {...pageProps} />
}
export default MyApp
