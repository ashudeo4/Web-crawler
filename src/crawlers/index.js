import { crawlWithPuppeteer } from "./puppeteerCrawler.js";
async function crawlWebsite(domain) {
    await crawlWithPuppeteer(domain, domain);
}

export default crawlWebsite;

