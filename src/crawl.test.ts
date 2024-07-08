import { describe, it, expect } from "@jest/globals";
import { getURLsFromHTML, normalizeURL } from "./crawl.ts";

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
