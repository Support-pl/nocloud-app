/* eslint-disable no-console */

import store from './store/index.js'
import config from '../public/config.json'

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
	navigator.serviceWorker.register(`${process.env.BASE_URL}service-worker.js`)
		.then ((worker) => {
			console.log('Service worker has been registered.')

      if (worker.waiting) {
        console.log('New content is available; please refresh.')
        store.commit('app/setUpdate', { worker, status: true })
        localStorage.setItem('globalConfig', JSON.stringify(config));
      }

      worker.addEventListener('updatefound', () => {
        const newWorker = worker.installing

			  console.log('New content is downloading.')

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.')

              store.commit('app/setUpdate', { worker, status: true })
              localStorage.setItem('globalConfig', JSON.stringify(config));
            } else {
			        console.log('Content has been cached for offline use.')
            }
          }
        });
      });
		})
		.catch ((error) => {
			if (navigator.onLine) {
        console.error('Error during service worker registration:', error)
      } else {
        console.log('No internet connection found. App is running in offline mode.')
      }
		})
}
