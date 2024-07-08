import { JSDOM } from "jsdom";

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

export { normalizeURL, getURLsFromHTML };
