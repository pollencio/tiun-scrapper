t/**
* Responds to any HTTP request.
*
* @param {!express:Request} req HTTP request context.
* @param {!express:Response} res HTTP response context.
*/

exports.tiun_data = (req, res) => {

  const puppeteer = require('puppeteer');

  function run () {
    const url = 'http://tarjetainteligente.unal.edu.co/valide-aqui-datos-de-usuario/'
    return new Promise(async (resolve, reject) => {
      try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(url);
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
