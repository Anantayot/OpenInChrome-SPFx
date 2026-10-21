import DOMPurify from 'dompurify';
import { isAllowedHref, isChromeHref, isSafeImageSrc } from './links';

/**
 * Cleans stored HTML before it is shown or saved.
 * Keeps the formatting the editor can produce and allows the
 * nasarut-inchrome-chrome: protocol only in its safe form.
 */

// DOMPurify's default rule, restricted to http/https/mailto/tel plus the Chrome protocol.
const ALLOWED_URI_REGEXP: RegExp =
  /^(?:(?:https?|mailto|tel):|nasarut-inchrome-chrome:https?:\/\/|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

/** Only the CSS the editor itself writes. Anything else (position, display, background images ...) is dropped. */
const ALLOWED_STYLES: string[] = [
  'color', 'background-color', 'font-size', 'text-align', 'line-height', 'margin-left', 'list-style-type', 'width'
];
const UNSAFE_CSS_VALUE: RegExp = /url\s*\(|expression\s*\(|javascript:|var\s*\(|[<>]/i;

const DATA_VALUES: { [attr: string]: RegExp } = {
  'data-spacing': /^none$/,
  'data-space-before': /^true$/,
  'data-space-after': /^true$/,
  'data-quote-style': /^(intense|boxed|side|icon)$/,
  'data-color': /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i,
  'data-align': /^(left|center|right)$/,
  'data-table-style': /^(minimal|banded|header|theme-header|theme-banded|theme-lines|theme-accent)$/
};

let hooksInstalled: boolean = false;

function cleanStyle(node: Element): void {
  const style = (node as HTMLElement).style;
  if (!node.hasAttribute('style') || !style) {
    return;
  }
  const keep: string[] = [];
  for (const prop of ALLOWED_STYLES) {
    const value = style.getPropertyValue(prop);
    if (value && !UNSAFE_CSS_VALUE.test(value)) {
      keep.push(`${prop}: ${value}`);
    }
  }
  if (keep.length) {
    node.setAttribute('style', keep.join('; '));
  } else {
    node.removeAttribute('style');
  }
}

function installHooks(): void {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    cleanStyle(node);
    for (const attr of Object.keys(DATA_VALUES)) {
      const v = node.getAttribute(attr);
      if (v !== null && !DATA_VALUES[attr].test(v)) {
        node.removeAttribute(attr);
      }
    }

    if (node.tagName === 'IMG') {
      if (!isSafeImageSrc(node.getAttribute('src') || '')) {
        node.removeAttribute('src');
      }
      return;
    }

    if (node.tagName !== 'A') {
      return;
    }
    const href = node.getAttribute('href');
    if (href !== null && !isAllowedHref(href)) {
      node.removeAttribute('href');
    }

    if (isChromeHref(node.getAttribute('href') || undefined)) {
      // Let the browser hand the link to the protocol handler; SharePoint must not route it.
      node.setAttribute('data-interception', 'off');
    } else {
      node.removeAttribute('data-interception');
    }

    if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    } else {
      node.removeAttribute('target');
      node.removeAttribute('rel');
    }
  });
}

export function sanitizeHtml(html: string): string {
  installHooks();
  return DOMPurify.sanitize(html || '', {
    ALLOWED_URI_REGEXP,
    ADD_ATTR: ['target', 'data-interception', 'colspan', 'rowspan', 'start', 'lang'].concat(Object.keys(DATA_VALUES)),
    FORBID_TAGS: ['style', 'script', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button',
      'textarea', 'select', 'option', 'link', 'meta', 'base', 'svg', 'math', 'video', 'audio', 'source', 'picture'],
    FORBID_ATTR: ['id', 'name', 'srcset', 'action', 'formaction', 'class'],
    ALLOW_DATA_ATTR: false
  }) as unknown as string;
}
