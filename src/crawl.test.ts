import { describe, it, expect, beforeEach } from "@jest/globals";
import { fetchPage, getURLsFromHTML, normalizeURL } from "./crawl.ts";
import { CRAWL_ERROR_CODE, CrawlError } from "./CrawlError.ts";

describe("normalizeURL", () => {
  it.each(["https", "http", "ftp", "smtp", "nonsense"])(
    "should remove any protocol (%s)",
    (protocol) => {
      const url = `${protocol}://google.com`;
      const expectedUrl = "google.com";
      const normalizedUrl = normalizeURL(url);
      expect(normalizedUrl).toEqual(expectedUrl);
    },
  );
  it("should remove query strings", () => {
    const url = "https://yahoo.com/search?q=abc";
    const expectedUrl = "yahoo.com/search";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
  it("should deal with relative paths", () => {
    const url = "https://google.com/search/deeper/../";
    const expectedUrl = "google.com/search";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
  it("should remove a single trailing slash", () => {
    const url = "https://google.com";
    const expectedUrl = "google.com";
    const normalizedUrl = normalizeURL(url);
    expect(normalizedUrl).toEqual(expectedUrl);
  });
});

describe("getURLsFromHTML", () => {
  it("should extract a single link", () => {
    const document = `
    <html>
      <body>
          <a href="https://blog.boot.dev"><span>Go to Boot.dev</span></a>
      </body>
    </html>
    `;
    const expectedLinks = ["https://blog.boot.dev/"];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract an absolute link based on the base page, when an href has a relative link", () => {
    const document = `
    <html>
      <body>
          <a href="top/secret"><span>Go to Boot.dev</span></a>
      </body>
    </html>
    `;
    const expectedLinks = ["https://google.com/top/secret"];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract multiple links", () => {
    const document = `
    <html>
      <body>
          <a href="https://blog.boot.dev"><span>Go to Boot.dev</span></a>
          <a href="https://other-blog.boot.dev"><span>Go to Other Boot.dev</span></a>
          <a href="https://other-other-blog.boot.dev"><span>Go to Other Other Boot.dev</span></a>
      </body>
    </html>
    `;
    const expectedLinks = [
      "https://blog.boot.dev/",
      "https://other-blog.boot.dev/",
      "https://other-other-blog.boot.dev/",
    ];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract no links", () => {
    const document = `
    <html>
      <body>
        <span>Hello World!</span>
      </body>
    </html>
    `;
    const expectedLinks = [];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract no links when an anchor element lacks an href", () => {
    const document = `
    <html>
      <body>
        <a id="top"><span>Hello World!</span></a>
      </body>
    </html>
    `;
    const expectedLinks = [];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract a link to the base page when an anchor has '#top' or similar as an href", () => {
    const document = `
    <html>
      <body>
        <a id="top"><span>Hello World!</span></a>
        <a href="#top"><span>Go to top</span></a>
      </body>
    </html>
    `;
    const expectedLinks = ["https://google.com/#top"];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
  it("should extract a link to the base page when an anchor has '#' as an href", () => {
    const document = `
    <html>
      <body>
        <a href="#"><span>Home</span></a>
        <a><span>Hello World!</span></a>
      </body>
    </html>
    `;
    const expectedLinks = ["https://google.com/#"];
    const links = getURLsFromHTML(document, "https://google.com");
    expect(links).toEqual(expectedLinks);
  });
});

describe("fetchPage", () => {
  beforeEach(() => {
    expect.hasAssertions();
  });
  it("should return the page body as text if the request is successful and content-type is text/html", async () => {
    const body = "<html><body><span>Hello</span></body></html>";
    const mockResponse = new Response(body, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", "text/html");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    return expect(fetchPage("https://google.com", fetchLike)).resolves.toEqual(body);
  });
  it("should throw a CrawlError with code FETCH_ERROR if fetch throws an error", async () => {
    const error = new Error("Some error");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((_resolve, reject) => reject(error));
    const crawlResult = fetchPage("google.com", fetchLike);
    await expect(crawlResult).rejects.toThrow(CrawlError);
    await expect(crawlResult).rejects.toHaveProperty(
      ["cause", "code"],
      CRAWL_ERROR_CODE.fetchError,
    );
  });
  it("should throw a CrawlError with the error included if fetch throws an error", () => {
    const error = new Error("Some error");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((_resolve, reject) => reject(error));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "error"],
      error,
    );
  });
  it("should throw a CrawlError with code FETCH_ERROR if fetch throws something besides an error", async () => {
    const error = "hello";
    const fetchLike: () => Promise<Response> = () =>
      new Promise((_resolve, reject) => reject(error));
    const crawlResult = fetchPage("google.com", fetchLike);
    await expect(crawlResult).rejects.toThrow(CrawlError);
    await expect(crawlResult).rejects.toHaveProperty(
      ["cause", "code"],
      CRAWL_ERROR_CODE.fetchError,
    );
  });
  it("should throw a CrawlError with the thrown item included if fetch throws something besides an error", () => {
    const error = "hello";
    const fetchLike: () => Promise<Response> = () =>
      new Promise((_resolve, reject) => reject(error));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "error"],
      error,
    );
  });
  it("should throw a CrawlError with code RESPONSE_ERROR if the response has a status code >= 400", async () => {
    const mockResponse = new Response(null, { status: 404, statusText: "Not Found" });
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    const crawlResult = fetchPage("google.com", fetchLike);
    await expect(crawlResult).rejects.toThrow(CrawlError);
    await expect(crawlResult).rejects.toHaveProperty(
      ["cause", "code"],
      CRAWL_ERROR_CODE.errorResponse,
    );
  });

  it("should throw a CrawlError with the response included if the response has a status code >= 400", () => {
    const mockResponse = new Response(null, { status: 404, statusText: "Not Found" });
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "response"],
      mockResponse,
    );
  });
  it('should throw a CrawlError with code UNEXPECTED_CONTENT_TYPE if response does not have type "text/html"', async () => {
    const mockResponse = new Response(null, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", "application/json");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    const crawlResult = fetchPage("google.com", fetchLike);
    await expect(crawlResult).rejects.toThrow(CrawlError);
    await expect(crawlResult).rejects.toHaveProperty(
      ["cause", "code"],
      CRAWL_ERROR_CODE.unexpectedContentType,
    );
  });

  it('should throw a CrawlError with the contentType included if response does not have type "text/html"', () => {
    const badContentType = "application/json";
    const mockResponse = new Response(null, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", badContentType);
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "contentType"],
      badContentType,
    );
  });

  it('should throw a CrawlError with the response included if response does not have type "text/html"', () => {
    const badContentType = "application/json";
    const mockResponse = new Response(null, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", badContentType);
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "response"],
      mockResponse,
    );
  });

  it("should throw a CrawlError with code NO_BODY if response has no body", async () => {
    const mockResponse = new Response(null, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", "text/html");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    const crawlResult = fetchPage("google.com", fetchLike);
    await expect(crawlResult).rejects.toThrow(CrawlError);
    await expect(crawlResult).rejects.toHaveProperty(["cause", "code"], CRAWL_ERROR_CODE.noBody);
  });

  it("should throw a CrawlError with the response attached if response has no body", () => {
    const mockResponse = new Response(null, { status: 200, statusText: "OK" });
    mockResponse.headers.set("content-type", "text/html");
    const fetchLike: () => Promise<Response> = () =>
      new Promise((resolve) => resolve(mockResponse));
    return expect(fetchPage("google.com", fetchLike)).rejects.toHaveProperty(
      ["cause", "data", "response"],
      mockResponse,
    );
  });
});
