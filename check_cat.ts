import * as cheerio from 'cheerio';

async function check() {
  try {
    const res = await fetch('https://www.mercadolivre.com.br/notebook-dell-inspiron-i15-i1300-a30p-156-i5-8gb-512gb-w11-preto/p/MLB54247265', { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const breadcrumbs: string[] = [];
    $('.ui-pdp-breadcrumb a, .andes-breadcrumb__link, .breadcrumb a, .breadcrumb span, .andes-breadcrumb a').each((i, el) => {
      breadcrumbs.push($(el).text().trim());
    });
    console.log("Breadcrumbs found:", breadcrumbs);
  } catch (e) {
    console.error(e);
  }
}

check();
