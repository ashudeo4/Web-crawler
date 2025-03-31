import fs from "fs-extra";

function logMessage(message) {
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync("logs/crawler.log", log);
  console.log(message);
}

function isCollectionURL(text) {
  const regex = /collections|c-msh|c-|-c/i;
  const regex1 = /\/c\/\d+/
  return regex.test(text) || regex1.test(text);
}

function isProductURL(text) {
  const regex = /product|products|p-mp|-p|p-/i;
  const regex1 = /\/p\/\d+/
  return regex.test(text) || regex1.test(text);
}

export  { isProductURL, isCollectionURL, logMessage };
