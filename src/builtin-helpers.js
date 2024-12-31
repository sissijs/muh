/**
 * Fetch JSON. Small wrapper around native fetch
 * @param {string|URL} request 
 * @param {RequestInit} options 
 * @returns json response
 */
export async function fetchJson(request, options) {
  const response = await fetch(request, options);
  return await response.json();
}

/**
 * Fetch Text. Small wrapper around native fetch
 * @param {string|URL} request 
 * @param {RequestInit} options RequestInfo
 * @returns 
 */
export async function fetchText(request, options) {
  const response = await fetch(request, options);
  return await response.text();
}
