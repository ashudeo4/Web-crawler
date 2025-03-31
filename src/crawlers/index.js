import { crawlWithPuppeteer } from "./puppeteerCrawler.js";
async function crawlWebsite(url) {
    await crawlWithPuppeteer(url, url);
}

export default crawlWebsite;

