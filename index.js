const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

// Endpoints
app.get('/', function (req, res) {
  const id = req.query.id
  getInfo(id)
    .then(info => res.send(info))
    .catch((error) => res.send('There was an error: ' + error))
})

// Run app!
app.listen(3000, function () {
  console.log('Listening on port 3000!')
  console.log('Start making a GET request to /?id=...');
})

// The beautiful scrapper
const getInfo = async function(id) {
  const url = 'http://tarjetainteligente.unal.edu.co/valide-aqui-datos-de-usuario/'

  // Initialize
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Navigate
  await page.goto(url, {waitUntil: 'networkidle2'})

  // Login
  try {
    await page.type('#identi', id)
    await page.click('.send')
    await page.screenshot({path: './screenshots/login.jpg'})
    await page.waitForSelector('.VerTarUniNal')
    return await page.evaluate(getDataFromPage)
  }

  catch (error) {
    console.log('Error login', error)
    await page.screenshot({path: './screenshots/error.jpg'})
  }

  // Close
  await browser.close()
}

// The function that gets all data from HTML like magic!
const getDataFromPage = () => {
  const info = document.querySelector('.VerTarUniNal .row')
  const rows = info.querySelectorAll('.col-xs-12.col-sm-12.col-md-9.col-lg-9 .row')
  const image = info.querySelector('.col-xs-12.col-sm-12.col-md-3.col-lg-3 img')

  const castData = {
    'Nombres:': 'name',
    'Apellidos:': 'lastname',
    'Identificación:': 'id',
    'Número Tarjeta:': 'tiun',
    'Estado Tarjeta:': 'tiun_state',
  }

  const data = {}
  rows.forEach((item) => {
    const getText = (div) => div.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim()
    const getCapitalized = (text) => text.replace(/(^\w|\s\w)(\S*)/g, (_,m1,m2) => m1.toUpperCase()+m2.toLowerCase())
    const divs = item.querySelectorAll('div')
    let [key, value] = [castData[getText(divs[0])], getText(divs[1])]

    if(key == 'name' || key == 'lastname' || key == 'tiun_state')
      value = getCapitalized(value)

    data[key] = value
  })

  return { imageUrl: image.src, ...data }
}
