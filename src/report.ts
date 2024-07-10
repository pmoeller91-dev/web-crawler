import { PagesMap } from "./crawl.js";

/**
 * Takes a map of pages and number of occurrences, and returns a formatted
 * report as a string to print to the console.
 * @param pages - A map containing normalized page URLs and the number of
 * occurrences of each.
 * @returns - A string of the entire report, ready to be output.
 */
const printReport = (pages: PagesMap): string => {
  const lines: string[] = [];
  // Sort ascending by number of occurrences
  const sortedPages = [...pages].sort((a, b) => b[1] - a[1]);
  lines.push("Starting pages report...");
  lines.push("");
  lines.push(
    ...sortedPages.map(
      ([page, numOccurrences]) =>
        `Found ${numOccurrences} internal link${numOccurrences === 1 ? "" : "s"} to "${page}"`,
    ),
  );
  const totalPages = sortedPages.length;
  const totalLinks = sortedPages.reduce((a, x) => a + x[1], 0);
  lines.push("");
  lines.push(
    `Pages report completed. Crawled ${totalPages} page${totalPages === 1 ? "" : "s"} and found ${totalLinks} internal link${totalLinks === 1 ? "" : "s"}.`,
  );
  return lines.join("\n");
};

export { printReport };
