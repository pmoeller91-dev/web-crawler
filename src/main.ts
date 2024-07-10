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
    await crawlPage(url, fetch);
  });

await webCrawler.parseAsync();
