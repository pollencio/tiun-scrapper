/**
* Responds to any HTTP request.
*
* @param {!express:Request} req HTTP request context.
* @param {!express:Response} res HTTP response context.
*/

exports.tiun_data = (req, res) => {
  const puppeteer = require('puppeteer');
  const id = req.query.id

  function run () {
    const url = 'http://tarjetainteligente.unal.edu.co/valide-aqui-datos-de-usuario/'
    return new Promise(async (resolve, reject) => {
      try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(url);

        // Login
        await page.type('#identi', id)
        await page.click('.send')
        await page.waitForSelector('.VerTarUniNal')
        const info = await page.evaluate(getDataFromPage)

        browser.close();
        return resolve(info);
      } catch (e) {
        return reject(e);
      }
    })
  }

  run()
  .then(info => {
    res.set('Content-Type', 'application/json');
    res.status(200).send(info);
  })
  .catch(err => {
    console.error(err);
    res.status(500).send("An Error occured" + err);
  })
};

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
