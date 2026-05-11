const cheerio = require('cheerio');

async function check() {
  try {
    const res = await fetch('https://meli.la/2sosU7b', { redirect: 'follow' });
    const html = await res.text();
    const $ = cheerio.load(html);
    const breadcrumbs = [];
    $('.ui-pdp-breadcrumb a, .andes-breadcrumb__link').each((i, el) => {
      breadcrumbs.push($(el).text().trim());
    });
    console.log("Breadcrumbs found:", breadcrumbs);
  } catch (e) {
    console.error(e);
  }
}

check();
