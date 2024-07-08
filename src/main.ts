import { Command } from "commander";

const version = "0.1.0";

const webCrawler = new Command();

webCrawler
  .name("crawl")
  .description("CLI utility to extract links from a target URL")
  .version(version)
  .argument("<url>", "Base URL to crawl for links")
  .showHelpAfterError()
  .action((url: string) => {
    console.log(`Crawler is starting using a base URL of "${url}"...`);
  });

webCrawler.parse();
