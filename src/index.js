import PQueue from "p-queue";
import domains from './config/domain.js';
import crawlWebsite from "./crawlers/index.js";

const queue = new PQueue({ concurrency: 5, intervalCap: 5, interval: 1000 })

const main = async () => {
    try {
        await Promise.all(domains.map(url => queue.add(() => crawlWebsite(url))))
    } catch (error) {
        console.error("Error in main:", error);
    }
};

main();