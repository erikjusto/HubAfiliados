
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const USER_DATA_DIR = path.join(process.cwd(), '.ml_agent_session');

export class MLAgentService {
  private static instance: MLAgentService;
  private browser: any = null;

  private constructor() {}

  public static getInstance(): MLAgentService {
    if (!MLAgentService.instance) {
      MLAgentService.instance = new MLAgentService();
    }
    return MLAgentService.instance;
  }

  async initBrowser() {
    if (this.browser) return this.browser;

    const isHeadless = process.env.ML_AGENT_HEADLESS !== 'false';
    this.browser = await puppeteer.launch({
      headless: isHeadless,
      userDataDir: USER_DATA_DIR,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    return this.browser;
  }

  async extractAffiliateLink(productUrl: string): Promise<string> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      console.log(`Navigating to product: ${productUrl}`);
      await page.goto(productUrl, { waitUntil: 'networkidle2' });

      // Check if we are on a login page
      if (page.url().includes('login') || (await page.$('input[name="user_id"]'))) {
        console.log('Login required. Attempting to log in...');
        
        const email = process.env.ML_EMAIL || 'erikjusto@gmail.com';
        const password = process.env.ML_PASSWORD || 'Kire230968@!';

        // Enter Email
        await page.waitForSelector('input[name="user_id"]');
        await page.type('input[name="user_id"]', email);
        await page.click('button[type="submit"]');
        
        // Wait for password field
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await page.type('input[name="password"]', password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation back to product or home
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // If it's still on login, might need 2FA
        if (page.url().includes('login')) {
          console.warn('Login failed or 2FA required. Please check the browser window.');
          return 'LOGIN_FAILED_OR_2FA_REQUIRED';
        }

        // Navigate back to product if needed
        if (page.url() !== productUrl) {
          await page.goto(productUrl, { waitUntil: 'networkidle2' });
        }
      }

      // Wait for the affiliate button
      const shareButtonSelector = '[data-testid="generate_link_button"]';
      console.log('Waiting for "Compartilhar" button...');
      await page.waitForSelector(shareButtonSelector, { timeout: 10000 });
      
      console.log('Clicking "Compartilhar"...');
      await page.click(shareButtonSelector);

      // Wait for the modal and the copy button
      const copyButtonSelector = '[data-testid="copy-button__label_link"]';
      console.log('Waiting for "Link do produto" button...');
      await page.waitForSelector(copyButtonSelector, { timeout: 10000 });

      // The link is usually in a text field or we can get it from the button's context
      // Sometimes it's better to just extract the value from the UI if possible
      const linkValue = await page.evaluate(() => {
        const input = document.querySelector('input[aria-label="Link do produto"]') as HTMLInputElement;
        if (input) return input.value;
        
        // Fallback: search for meli.la link in the modal
        const modal = document.body;
        const text = modal.innerText;
        const match = text.match(/https:\/\/meli\.la\/[a-zA-Z0-9]+/);
        return match ? match[0] : null;
      });

      if (!linkValue) {
        // Try clicking the copy button anyway
        await page.click(copyButtonSelector);
        console.log('Clicked copy button. Check clipboard or logs.');
        // Since we can't easily access clipboard in headless, we rely on the evaluate above.
      }

      console.log(`Extracted link: ${linkValue}`);
      return linkValue || 'LINK_NOT_FOUND';

    } catch (error: any) {
      console.error('Error extracting link:', error.message);
      if (page) {
        const screenshotPath = path.join(process.cwd(), `error_screenshot_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to: ${screenshotPath}`);
      }
      return `ERROR: ${error.message}`;
    } finally {
      await page.close();
    }
  }

  async browseCategoryAndExtract(categoryUrl: string = 'https://www.mercadolivre.com.br/c/animais#menu=categories'): Promise<any[]> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    const results: any[] = [];

    try {
      console.log(`Browsing category: ${categoryUrl}`);
      await page.goto(categoryUrl, { waitUntil: 'networkidle2' });

      // Get first 5 products
      const productLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.ui-search-item__title a, .poly-component__title a')) as HTMLAnchorElement[];
        return links.slice(0, 5).map(a => a.href);
      });

      console.log(`Found ${productLinks.length} products. Starting extraction...`);

      for (const url of productLinks) {
        const affiliateUrl = await this.extractAffiliateLink(url);
        results.push({
          originalUrl: url,
          affiliateUrl
        });
      }

      return results;
    } catch (error: any) {
      console.error('Error in category browsing:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const mlAgentService = MLAgentService.getInstance();
