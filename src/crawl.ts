import { JSDOM } from "jsdom";
import { CRAWL_ERROR_CODE, CrawlError } from "./CrawlError.js";

/**
 * Normalizes a URL by stripping the protocol, trailing slashes, and so on
 * @param urlString - The URL to normalize
 * @returns - The normalized URL
 */
const normalizeURL = (urlString: string): string => {
  const url = new URL(urlString);
  return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
};

/**
 * Extracts the URLs from any anchor tag in a document.
 * @param htmlBody - A string representing an HTML document
 * @param baseURL - The base URL of the document, to resolve relative links
 * @returns - An array of absolute URLs, as strings
 */
const getURLsFromHTML = (htmlBody: string, baseURL: string): string[] => {
  const dom = new JSDOM(htmlBody, { url: baseURL });
  const anchorElements = dom.window.document.querySelectorAll<HTMLAnchorElement>("a[href]");
  const urls = Array.from(anchorElements, (anchorElement) => anchorElement.href);
  return urls;
};

/**
 * Compare if the URLs share the same hostname. True if they do, false otherwise.
 * @param url - A URL as a string
 * @param otherUrl  - A second URL as a string.
 * @returns - Whether the URLs share the same hostname
 */
const isSameDomain = (url: string, otherUrl: string) => {
  return new URL(url).hostname === new URL(otherUrl).hostname;
};

type FetchLike = (url: string) => Promise<Response>;

type PagesMap = Map<string, number>;

/**
 * Crawls a URL and returns a list of all site-local URLs accessible from the page.
 * @param url - The URL to crawl
 * @returns A list of all normalized URLs crawled and how many times each appeared.
 */
const crawlPage = async (url: string, fetchLike: FetchLike): Promise<PagesMap> => {
  const crawledPagesMap = new Map<string, number>();
  const toCrawl: string[] = [url];
  while (toCrawl.length > 0) {
    const currentUrl = toCrawl.pop() as string;
    const normalizedUrl = normalizeURL(currentUrl);
    if (crawledPagesMap.has(normalizedUrl)) {
      const currentCount = crawledPagesMap.get(normalizedUrl) ?? 0;
      crawledPagesMap.set(normalizedUrl, currentCount + 1);
      continue;
    }
    crawledPagesMap.set(normalizedUrl, 1);
    console.log(`Fetching ${currentUrl}...`);
    try {
      const pageBody = await fetchPage(currentUrl, fetchLike);
      const newUrls = getURLsFromHTML(pageBody, currentUrl);
      const sameDomainUrls = newUrls.filter((newUrl) => isSameDomain(newUrl, url));
      toCrawl.push(...sameDomainUrls);
    } catch (e) {
      if (e instanceof CrawlError) {
        if (e.cause.code === CRAWL_ERROR_CODE.unexpectedContentType) {
          const unexpectedContentTypeError = e as CrawlError<
            (typeof CRAWL_ERROR_CODE)["unexpectedContentType"]
          >;
          console.log(
            `Skipping crawling ${currentUrl} due to invalid content type: "${unexpectedContentTypeError.cause.data.contentType}"`,
          );
        } else {
          console.log(`Skipping crawling ${currentUrl} due to crawl error: "${e.message}"`);
        }
      } else {
        throw e;
      }
    }
  }
  return crawledPagesMap;
};

/**
 * Fetches a single URL and returns the HTML content of the page as a string.
 * @param url - The URL to crawl
 * @returns - A string containing the HTML contents of the page
 */
const fetchPage = async (url: string, fetchLike: FetchLike): Promise<string> => {
  let response: Response | null = null;
  try {
    response = await fetchLike(url);
  } catch (e) {
    if (e instanceof Error) {
      throw new CrawlError(`Error crawling page "${url}": ${e.message}`, {
        code: CRAWL_ERROR_CODE.fetchError,
        data: { error: e },
      });
    }
    throw new CrawlError(
      `Error crawling page "${url}": Unknown error, received "${typeof e}" as exception.` +
        ` String representation: ${String(e)}`,
      { code: CRAWL_ERROR_CODE.fetchError, data: { error: e } },
    );
  }
  if (response.status >= 400) {
    throw new CrawlError(
      `Error crawling page "${url}": Received an error response from the server:` +
        ` "${response.status} ${response.statusText}"`,
      { code: CRAWL_ERROR_CODE.errorResponse, data: { response } },
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType !== "text/html" && contentType !== "text/html; charset=utf-8") {
    throw new CrawlError(
      `Error crawling page "${url}": The response does not appear to be a webpage.` +
        ` Received "content-type": "${contentType}"`,
      { code: CRAWL_ERROR_CODE.unexpectedContentType, data: { response, contentType } },
    );
  }
  if (!response.body) {
    throw new CrawlError(
      `Error crawling page "${url}": Received an empty page body, with the status:` +
        ` "${response.status} ${response.statusText}"`,
      { code: CRAWL_ERROR_CODE.noBody, data: { response } },
    );
  }
  const bodyText = await response.text();
  return bodyText;
};

export { normalizeURL, getURLsFromHTML, crawlPage, fetchPage };
export type { PagesMap };
