import DOMPurify from 'dompurify';
import { isAllowedHref, isChromeHref } from './links';

/**
 * Cleans stored HTML before it is shown or saved.
 * Keeps formatting (style attributes, tables, lists) and allows the
 * nasarut-inchrome-chrome: protocol only in its safe form.
 */

// DOMPurify's default rule, restricted to http/https/mailto/tel plus the Chrome protocol.
const ALLOWED_URI_REGEXP: RegExp =
  /^(?:(?:https?|mailto|tel):|nasarut-inchrome-chrome:https?:\/\/|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

let hooksInstalled: boolean = false;

function installHooks(): void {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
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
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }

    node.removeAttribute('data-interception');
    if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    } else {
      node.removeAttribute('target');
    }
  });
}

export function sanitizeHtml(html: string): string {
  installHooks();
  return DOMPurify.sanitize(html || '', {
    ALLOWED_URI_REGEXP,
    ADD_ATTR: ['target', 'data-interception', 'colspan', 'rowspan', 'data-color'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button',
      'textarea', 'select', 'option', 'link', 'meta', 'base', 'svg', 'math'],
    FORBID_ATTR: ['id', 'name', 'srcset', 'action', 'formaction'],
    ALLOW_DATA_ATTR: false
  }) as unknown as string;
}
