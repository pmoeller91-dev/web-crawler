const CRAWL_ERROR_CODE = {
  fetchError: "FETCH_ERROR",
  errorResponse: "ERROR_RESPONSE",
  unexpectedContentType: "UNEXPECTED_CONTENT_TYPE",
  noBody: "NO_BODY",
} as const;

type CrawlErrorCode = (typeof CRAWL_ERROR_CODE)[keyof typeof CRAWL_ERROR_CODE];

interface CrawlErrorCause<C extends CrawlErrorCode> {
  code: C;
  data: ErrorData[C];
}

interface ErrorData {
  /* Error caused by ``fetch`` throwing an error */
  [CRAWL_ERROR_CODE.fetchError]: {
    error: unknown;
  };
  /* Error caused by the response status from ``fetch`` being >= 400 */
  [CRAWL_ERROR_CODE.errorResponse]: {
    response: Response;
  };
  /* Error caused by receiving a content type besides ``text/html`` or ``text/html;
  char-set=utf-8`` */
  [CRAWL_ERROR_CODE.unexpectedContentType]: {
    response: Response;
    contentType: string;
  };
  /* Error caused when response has no body specified */
  [CRAWL_ERROR_CODE.noBody]: {
    response: Response;
  };
}

/**
 * Error class used to represent errors specific to ``crawlPage``.
 */
class CrawlError<C extends CrawlErrorCode = CrawlErrorCode> extends Error {
  /**
   * Create a new CrawlError with the given message.
   *
   * @param message The string associated with the error
   * @param cause Details on the cause of the error, a code and any additional data
   */
  constructor(message: string, cause: CrawlErrorCause<C>) {
    super(message, { cause });
  }
}

export { CrawlError, CRAWL_ERROR_CODE };
export type { CrawlErrorCause, CrawlErrorCode };
