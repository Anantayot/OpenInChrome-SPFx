/**
 * Link rules shared by the editor, the sanitizer and the web part.
 */

export const CHROME_PROTOCOL: string = 'nasarut-inchrome-chrome:';

/** Same rule as Open-Chrome.ps1: http/https only, no whitespace, quotes, angle brackets or backticks. */
const SAFE_WEB_URL: RegExp = /^https?:\/\/[^\s"'<>`]+$/i;

/** Addresses an editor may type into the link dialog. */
const ALLOWED_ADDRESS: RegExp = /^(?:https?:\/\/|mailto:|tel:|\/|#)[^\s"'<>`]*$/i;

export function isChromeHref(href: string | undefined): boolean {
  return !!href && href.slice(0, CHROME_PROTOCOL.length).toLowerCase() === CHROME_PROTOCOL;
}

/** "nasarut-inchrome-chrome:https://x" -> "https://x"; anything else unchanged. */
export function stripChrome(href: string): string {
  return isChromeHref(href) ? href.slice(CHROME_PROTOCOL.length) : href;
}

export function isSafeWebUrl(url: string): boolean {
  return SAFE_WEB_URL.test(url);
}

export function isSafeChromeHref(href: string): boolean {
  return isChromeHref(href) && isSafeWebUrl(stripChrome(href));
}

/** Any href the editor is allowed to store. */
export function isAllowedHref(href: string | undefined): boolean {
  if (!href) {
    return false;
  }
  return isChromeHref(href) ? isSafeChromeHref(href) : ALLOWED_ADDRESS.test(href);
}

/** Images: http/https or a site-relative address only. data: and other schemes are refused. */
const SAFE_IMAGE_SRC: RegExp = /^(?:https?:\/\/|\/)[^\s"'<>`]+$/i;

export function isSafeImageSrc(src: string): boolean {
  return SAFE_IMAGE_SRC.test(src.trim());
}

export interface ILinkValidation {
  ok: boolean;
  href?: string;
  error?: string;
}

/** Turns the dialog fields into the href to store, or explains what is wrong. */
export function buildHref(address: string, openInChrome: boolean): ILinkValidation {
  const value = stripChrome(address.trim());
  if (!value) {
    return { ok: false, error: 'ใส่ที่อยู่ลิงก์ก่อน' };
  }
  if (openInChrome) {
    if (!isSafeWebUrl(value)) {
      return { ok: false, error: 'เปิดด้วย Chrome ได้เฉพาะลิงก์ที่ขึ้นต้นด้วย http:// หรือ https:// และไม่มีช่องว่าง' };
    }
    return { ok: true, href: CHROME_PROTOCOL + value };
  }
  if (!ALLOWED_ADDRESS.test(value)) {
    return { ok: false, error: 'ลิงก์ต้องขึ้นต้นด้วย http://, https://, mailto:, tel: หรือ / และไม่มีช่องว่าง' };
  }
  return { ok: true, href: value };
}
