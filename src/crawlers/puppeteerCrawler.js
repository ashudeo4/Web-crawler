import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import 'dotenv/config'
import { isProductURL, isCollectionURL, logMessage } from "../utils/helpers.js";
import { saveToJsonFile } from "../utils/storage.js";
const crawledUrls = new Set();
let productUrls = new Set();
const nextCrawlQueue = [];
const MAX_CONCURRENT_CRAWLS = parseInt(process.env.MAX_CONCURRENT_CRAWLS);
const DISTANCE_SCROLL = parseInt(process.env.DISTANCE_SCROLL);
const AUTO_SCROLL_TIMEOUT = parseInt(process.env.AUTO_SCROLL_TIMEOUT);
let activeCrawls = 0

async function crawlWithPuppeteer(domain, baseUrl) {
    nextCrawlQueue.push({ url: domain, baseUrl: baseUrl })
    processQueue()
}

async function processQueue() {

    while (nextCrawlQueue.length > 0 && activeCrawls < MAX_CONCURRENT_CRAWLS) {
        const { url, baseUrl } = nextCrawlQueue.shift()
        activeCrawls++;

        try {
            const html = await fetchWithPuppeteer(url, baseUrl);
            await extractcrawlUrls(html, url, baseUrl)
           
        } catch (error) {
            logMessage(`Error processing ${url}: ${error.message}`);
        }
        activeCrawls--;
    }

    if (nextCrawlQueue.length > 0) {
        setTimeout(processQueue, 1000)
    }
}

async function fetchWithPuppeteer(url, baseUrl) {
    try {
        if (crawledUrls.has(url)) return

        const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 6000000 });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        await autoScroll(page, DISTANCE_SCROLL, AUTO_SCROLL_TIMEOUT);
        if (url != baseUrl) {
            await handlePagination(page, baseUrl);
        }
        const content = await page.content();
        await browser.close();
        return content;
    } catch (error) {
        logMessage(`Puppeteer failed for ${url}: ${error.message}`);
        return null;
    }
}

async function extractcrawlUrls(html, domain, baseUrl) {
    productUrls = new Set()

    logMessage(`Crawling (Puppeteer): ${domain}`);

    const $ = cheerio.load(html);
    $("a").each((_, element) => {

        let href = $(element).attr("href");
        
        if (href && !href.startsWith("http")) {
            href = `${baseUrl}${href}`
        }
        
        if (isProductURL(href)) {
            productUrls.add(href)
        }
        if (isCollectionURL(href)) {
            nextCrawlQueue.push({ url: href, baseUrl })
        }
    });
    crawledUrls.add(domain);
    if (Array.from(productUrls).length > 0 ) {
    await saveToJsonFile(productUrls, domain)
    }
    logMessage(`File saved for url: ${domain}`)
}

async function autoScroll(page, DISTANCE_SCROLL, AUTO_SCROLL_TIMEOUT) {
    await page.evaluate(async (DISTANCE_SCROLL, AUTO_SCROLL_TIMEOUT) => {

        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = DISTANCE_SCROLL;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, AUTO_SCROLL_TIMEOUT);
        });
    }, DISTANCE_SCROLL, AUTO_SCROLL_TIMEOUT);
}

async function handlePagination(page, baseUrl) {
        while (true) {
            const nextButton = await page.$('button[aria-label="Next Page"], img[alt="right_arrow"], div.pagination-next');
            if (nextButton) {
                const isClickable = await page.evaluate(button => {
                    if (!button) return false;
                    const style = window.getComputedStyle(button);
                    return style.visibility !== 'hidden' && style.display !== 'none' && !button.disabled;
                }, nextButton);
                if (isClickable) {
                    try {
                        await nextButton.click();
                        const oldUrl = page.url();
                        await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 });
                        await autoScroll(page, DISTANCE_SCROLL, AUTO_SCROLL_TIMEOUT);
                        
                        const content = await page.content()
                        await extractcrawlUrls(content, oldUrl, baseUrl)

                    } catch (err) {
                        console.log(err);
                        break
                    }
                } else {
                    break
                }
            } else {
                break
            }
        }
}


export { crawlWithPuppeteer };
