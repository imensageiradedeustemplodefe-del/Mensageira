// Google Apps Script web apps respond intermittently with 404/5xx (cold starts, redirect to
// script.googleusercontent.com). This helper retries a few times before giving up.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchAppsScript(url: string, init?: RequestInit, attempts = 3): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { cache: "no-store", redirect: "follow", ...init });
    if (res.ok) return res;
    last = res;
    if (res.status !== 404 && res.status < 500) break; // erro definitivo (401/403...)
    await sleep(600 * (i + 1));
  }
  return last as Response;
}
