// NOTE: the actual files used to make the object URLs aren't important.
// I used the unsplash API to gather a lot of image URLs to make the
// testing easier, but any sufficiently large list of files would do.
import { imgFileUrls } from './img-file-urls.js'

const logs = document.getElementById('logs')
const checkbox = document.querySelector('input[type=checkbox]')
const slider = document.querySelector('input[type=range]')
const sliderValue = document.getElementById('slider-value')
const es = document.getElementById('es')
const button = document.querySelector('button')
const grid = document.querySelector('ul')
let cid = 0
let cursor = 0
let runs = 0

slider.addEventListener('input', () => {
  sliderValue.innerText = slider.value
  slider.value === '1' ? es.style.display = 'none' : es.style.display = 'inline'
})

button.addEventListener('click', e => {
  e.preventDefault()

  const shouldRenderImages = checkbox.checked
  const times = slider.valueAsNumber

  clearLogs()
  cursor = 0
  runs = 0
  button.disabled = true
  checkbox.disabled = true
  slider.disabled = true

  runTest(times, shouldRenderImages)
    .catch(e => {
      console.error('error running tests', e)
      log('Error running tests')
    })
    .finally(() => {
      button.disabled = false
      checkbox.disabled = false
      slider.disabled = false
    })
})

self.addEventListener('load', () => console.info('Loaded.'))
self.addEventListener('error', e => console.error(e))

async function runTest(times, shouldRenderImages) {
  print('Running... ')

  while (runs < times) {
    const urls = await createOneHundredBlobURLs()
    await wait()

    if (shouldRenderImages) {
      renderImages(urls)
      await wait()
      scrollToTheBottom()
      await wait(1000)
      clearImages()
      await wait()
    }

    revokeURLs(urls)
    advanceCursor()
    print(' . ')
    await wait()
    runs += 1
  }

  log('Done. Succeeded.')
  log(`Loaded ${runs} of ${times} pages which created${shouldRenderImages ? ', displayed, ' : ''} and revoked ${runs * 100} object URLs.`)
}

// test steps

async function createOneHundredBlobURLs() {
  const imageURLs = imgFileUrls.slice(cursor, cursor + 100)
  const blobURLs = []

  for (const url of imageURLs) {
    const file = await fetchPhotoFile(url)
    blobURLs.push(URL.createObjectURL(file))
  }

  return blobURLs
}

function clearImages() {
  grid.innerHTML = ''
}

function renderImages(urls) {
  clearImages()

  let html = ''

  for (const url of urls) {
    html += `<li><img src="${url}"></li>`
  }

  grid.insertAdjacentHTML('beforeend', html)
}



// NOTE: doesn't appear to actually free the memory in the "page" in Safari
function revokeURLs(urls) {
  for (const url of urls) {
    URL.revokeObjectURL(url)
  }
}

function advanceCursor() {
  cursor += 100

  if (cursor > imgFileUrls.length) {
    cursor = 0
  }
}

// helper functions

async function fetchPhotoFile(url) {
  // This emulates a client downloading a file, performing some operation on its bytes, and then assembling a file.
  // An example of wanting to do this would be for E2EE where decryption must happen in the client.
  const response = await fetch(url)
  const bytes = await response.blob()
  return new File([bytes], `${cid++}.jpg`, { type: 'image/jpeg' })
}

function scrollToTheBottom(selector='li:last-child') {
  const last = document.querySelector(selector)
  last?.scrollIntoView({ behavior: "smooth" })
}

function wait(amount = 16) {
  return new Promise(r => setTimeout(() => r(), amount))
}

function log(msg) {
  console.debug('log', msg)
  logs.innerText += msg + '\n'
}

function print(msg) {
  console.debug('print', msg)
  logs.innerText += msg
}

function clearLogs() {
  console.debug('clear logs')
  logs.innerText = ''
}
