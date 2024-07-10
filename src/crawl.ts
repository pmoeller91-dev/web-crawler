import { JSDOM } from "jsdom";
import { CRAWL_ERROR_CODE, CrawlError } from "./CrawlError.js";

/**
 * Normalizes a URL by stripping the protocol, trailing slashes, and so on
 * @param urlString - The URL to normalize
 * @returns - The normalized URL
 */
const normalizeURL = (urlString: string): string => {
  const url = new URL(urlString);
  return `${url.host}${url.pathname.replace(/\/$/, "")}`;
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

type FetchLike = (url: string) => Promise<Response>;

/**
 * Crawls a URL and returns a list of all site-local URLs accessible from the page.
 * @param url - The URL to crawl
 * @returns A list of all site-local URLs, as a list of strings
 */
const crawlPage = async (url: string, fetchLike: FetchLike): Promise<void> => {
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
    return;
  }
  const bodyText = await response.text();
  console.log(bodyText);
};

export { normalizeURL, getURLsFromHTML, crawlPage };
