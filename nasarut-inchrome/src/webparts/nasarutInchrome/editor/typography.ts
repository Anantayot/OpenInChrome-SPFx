/**
 * Uses the same lettering as the SharePoint Text web part on this page.
 *
 * SharePoint's Text web part styles its text with its own CSS (font family from the site's theme or
 * brand fonts, size and weight of normal text and headings). That CSS is already loaded on the page.
 * We copy what it gives - by measuring hidden sample text inside a copy of the Text web part's
 * wrappers - into CSS variables (--oict-*) on the page; the editor and read view use them.
 * Line height is NOT copied: spacing stays our own (set in styles.ts), so lists stay compact.
 */

const TEXT_WEB_PART: string[] = [
  '[data-sp-feature-tag="Rich Text Editor"] [data-automation-id="textBox"]',
  '[data-automation-id="textBox"]',
  '[data-sp-feature-tag="Rich Text Editor"] .rte--read',
  '.rte--read',
  '[data-sp-feature-tag="Rich Text Editor"] .ck-content',
  '[data-sp-feature-tag="Rich Text Editor"]'
];
const SAFE_TAGS: RegExp = /^(DIV|SECTION|ARTICLE|MAIN|SPAN|ASIDE|HEADER|FOOTER|NAV)$/;
const SAFE_FONT: RegExp = /^[A-Za-z0-9 ,"'_.-]{1,300}$/;
const SAMPLE_TAGS: string[] = ['p', 'h1', 'h2', 'h3', 'h4'];
const HIDDEN: string = 'position:absolute;left:-10000px;top:0;width:600px;visibility:hidden;pointer-events:none;contain:layout';

interface ISample { font: string; size: number; weight: string; }

let applied: boolean = false;

function findTextWebPart(doc: Document): Element | undefined {
  for (const sel of TEXT_WEB_PART) {
    const list = Array.from(doc.querySelectorAll(sel));
    for (const el of list) {
      if (!el.closest('.oict') && (el as HTMLElement).getClientRects().length > 0) { return el; }
    }
  }
  return undefined;
}

/** Hidden copy of the Text web part's wrapper chain (classes and data-* only), with sample text inside. */
function buildProbe(doc: Document, textEl: Element | undefined): { outer: HTMLElement; inner: HTMLElement } {
  const outer = doc.createElement('div');
  outer.setAttribute('aria-hidden', 'true');
  outer.style.cssText = HIDDEN;
  let inner: HTMLElement = outer;
  if (textEl) {
    const chain: Element[] = [];
    for (let n: Element | null = textEl; n && n !== doc.body && n !== doc.documentElement; n = n.parentElement) {
      chain.unshift(n);
    }
    for (const node of chain) {
      const copy = doc.createElement(SAFE_TAGS.test(node.tagName) ? node.tagName.toLowerCase() : 'div');
      for (const attr of Array.from(node.attributes)) {
        if (attr.name === 'class' || attr.name === 'dir' || attr.name === 'lang' ||
            (attr.name.indexOf('data-') === 0 && attr.value.length < 200)) {
          copy.setAttribute(attr.name, attr.value);
        }
      }
      inner.appendChild(copy);
      inner = copy;
    }
  }
  for (const tag of SAMPLE_TAGS) {
    const el = doc.createElement(tag);
    el.textContent = 'ทดสอบ Aa';
    inner.appendChild(el);
  }
  return { outer, inner };
}

function measure(doc: Document, inner: HTMLElement): { [tag: string]: ISample } {
  const out: { [tag: string]: ISample } = {};
  const win = doc.defaultView;
  if (!win) { return out; }
  for (const tag of ['box'].concat(SAMPLE_TAGS)) {
    const el = tag === 'box' ? inner : inner.querySelector(`:scope > ${tag}`);
    if (!el) { continue; }
    const cs = win.getComputedStyle(el);
    out[tag] = { font: cs.fontFamily, size: parseFloat(cs.fontSize) || 0, weight: cs.fontWeight };
  }
  return out;
}

/** Measures the Text web part's lettering and publishes it as --oict-* variables. Returns true when done. */
export function adoptTextTypography(doc: Document): boolean {
  if (applied) { return true; }
  const textEl = findTextWebPart(doc);
  if (!textEl) { return false; }
  const sp = buildProbe(doc, textEl);
  const plain = buildProbe(doc, undefined);
  let text: { [tag: string]: ISample } = {};
  let base: { [tag: string]: ISample } = {};
  try {
    doc.body.appendChild(sp.outer);
    text = measure(doc, sp.inner);
    // Baseline for p/h1-h4: plain elements in a box with the Text area's font, so only the Text
    // web part's own rules for those elements show up as differences.
    const box = doc.defaultView ? doc.defaultView.getComputedStyle(sp.inner) : undefined;
    if (box) {
      plain.inner.style.fontFamily = box.fontFamily;
      plain.inner.style.fontSize = box.fontSize;
      plain.inner.style.fontWeight = box.fontWeight;
    }
    doc.body.appendChild(plain.outer);
    base = measure(doc, plain.inner);
    // The Text area itself is compared with the page's normal text.
    plain.inner.removeAttribute('style');
    plain.inner.style.cssText = HIDDEN;
    const pageBox = measure(doc, plain.inner).box;
    if (pageBox) { base.box = pageBox; }
  } finally {
    sp.outer.remove();
    plain.outer.remove();
  }
  const root = doc.documentElement.style;
  // 'box' is the Text area itself (--oict-font/-size); p and h1-h4 are its own rules for those
  // elements (--oict-p-*, --oict-h1-* ...). Only what the Text web part's CSS changes is copied.
  for (const tag of ['box'].concat(SAMPLE_TAGS)) {
    const t = text[tag];
    const b = base[tag];
    if (!t || !b) { continue; }
    const styled = t.font !== b.font || t.size !== b.size || (tag !== 'box' && t.weight !== b.weight);
    if (!styled) { continue; }
    const key = tag === 'box' ? '' : `-${tag}`;
    if (SAFE_FONT.test(t.font)) { root.setProperty(`--oict${key}-font`, t.font); }
    if (t.size) { root.setProperty(`--oict${key}-size`, `${Math.round(t.size * 10) / 10}px`); }
    if (tag !== 'box' && /^\d{3}$|^(normal|bold)$/.test(t.weight)) { root.setProperty(`--oict${key}-weight`, t.weight); }
  }
  applied = true;
  return true;
}

/** Tries now and a few more times while the page finishes loading (the Text web part may load after us). */
export function adoptTextTypographySoon(doc: Document): void {
  if (adoptTextTypography(doc)) { return; }
  [800, 2500, 6000].forEach(ms => window.setTimeout(() => adoptTextTypography(doc), ms));
}
