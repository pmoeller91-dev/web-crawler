/**
 * Normalizes a URL by stripping the protocol, trailing slashes, and so on
 * @param urlString The URL to normalize
 * @returns The normalized URL
 */
const normalizeURL = (urlString: string) => {
  const url = new URL(urlString);
  return `${url.host}${url.pathname.replace(/\/$/, '')}`;
};

export { normalizeURL };
