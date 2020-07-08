const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

// Endpoints
app.get('/', function (req, res) {
  const id = req.query.id
  getInfo(id)
    .then(info => res.status(200).send(info))
    .catch((error) =>  res.status(500).send('There was an error: ' + error))
})

// Run app!
const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log('Listening on port ' + PORT + '!')
  console.log('Start making a GET request to /?id=...');
})

// The beautiful scrapper
function getInfo(id) {
  const url = 'http://tarjetainteligente.unal.edu.co/valide-aqui-datos-de-usuario/'

  return new Promise(async (resolve, reject) => {
    try {
      // Initialize
      const browser = await puppeteer.launch({args: ['--no-sandbox']})
      const page = await browser.newPage()

      // Navigate
      await page.goto(url)

      // Login
      await page.type('#identi', id)
      await page.click('.send')
      await page.waitForSelector('.VerTarUniNal')
      const info = await page.evaluate(getDataFromPage)

      // Close
      browser.close()

      return resolve(info)
    }

    catch (error) {
      console.log('Error login', error)
      return reject(e)
    }
  })
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
