import { Command } from "commander";
import { crawlPage } from "./crawl.js";

const version = "0.1.0";

const webCrawler = new Command();

webCrawler
  .name("crawl")
  .description("CLI utility to extract links from a target URL")
  .version(version)
  .argument("<url>", "Base URL to crawl for links")
  .showHelpAfterError()
  .action(async (url: string) => {
    console.log(`Crawler is starting using a base URL of "${url}"...`);
    const crawledPages = await crawlPage(url, fetch);
    console.log(crawledPages);
    console.log(`Done crawling pages with base URL of "${url}"!`);
    console.log(`Fetched ${crawledPages.size} pages.`);
  });

await webCrawler.parseAsync();
