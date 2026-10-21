/**
 * Clean-up of HTML pasted from the SharePoint Text web part (and other pages).
 *
 * The Text web part stores colour and size as CSS classes (fontColorRed, fontSizeXLarge,
 * highlightColorYellow, noSpacingAbove ...) instead of inline styles, so a plain paste
 * loses them. Here each class is turned back into an inline style:
 *  1. by asking the browser what SharePoint's own CSS (already loaded on the page) gives that class;
 *  2. otherwise from a table of SharePoint's standard colours.
 * Colour and size set on blocks (p, li, ul ...) or links are then pushed down onto the text,
 * because the editor only keeps them on text.
 */

interface IProbe { color?: string; fontSize?: string; backgroundColor?: string; }

const SENTINEL_COLOR: string = 'rgb(1, 2, 3)';
const SENTINEL_SIZE: string = '13.37px';
const SAFE_CLASS: RegExp = /^[A-Za-z0-9_ -]{1,200}$/;
const STYLE_CLASS: RegExp = /(fontColor|fontSize|highlightColor|themeColor|noSpacing)/i;

/** SharePoint Text standard colours (fallback when the page CSS is not available). */
const COLOR_CLASSES: { [name: string]: string } = {
  fontcolorreddark: '#a80000', fontcolordarkred: '#a80000', fontcolorred: '#e81123',
  fontcolororange: '#ffaa44', fontcolororangelighter: '#ffaa44', fontcoloryellow: '#fff100',
  fontcolorgreenlight: '#bad80a', fontcolorlightgreen: '#bad80a', fontcolorgreen: '#107c10',
  fontcolorbluelight: '#00bcf2', fontcolorlightblue: '#00bcf2', fontcolorblue: '#0078d4',
  fontcolorbluedark: '#002050', fontcolordarkblue: '#002050', fontcolorpurple: '#5c2d91',
  fontcolorneutraldark: '#201f1e', fontcolorneutralprimary: '#323130', fontcolorneutralprimaryalt: '#3b3a39',
  fontcolorneutralsecondary: '#605e5c', fontcolorneutraltertiary: '#a19f9d', fontcolorblack: '#000000',
  fontcolorwhite: '#ffffff'
};
const THEME_CLASSES: string[] = [
  'fontcolorthemedarker', 'fontcolorthemedark', 'fontcolorthemedarkalt',
  'fontcolorthemeprimary', 'fontcolorthemesecondary', 'fontcolorthemetertiary'];
const HIGHLIGHT_CLASSES: { [name: string]: string } = {
  highlightcoloryellow: '#ffff00', highlightcolorgreen: '#00ff00', highlightcolorbrightgreen: '#00ff00',
  highlightcoloraqua: '#00ffff', highlightcolorturquoise: '#00ffff', highlightcolorpink: '#ff00ff',
  highlightcolormagenta: '#ff00ff', highlightcolorblue: '#0000ff', highlightcolorred: '#ff0000',
  highlightcolordarkblue: '#000080', highlightcolornavy: '#000080', highlightcolorteal: '#008080',
  highlightcolordarkgreen: '#008000', highlightcolorviolet: '#800080', highlightcolorpurple: '#800080',
  highlightcolordarkred: '#800000', highlightcolormaroon: '#800000', highlightcolordarkyellow: '#808000',
  highlightcolorolive: '#808000', highlightcolorgray: '#808080', highlightcolordarkgray: '#808080',
  highlightcolorlightgray: '#c0c0c0', highlightcolorsilver: '#c0c0c0', highlightcolorblack: '#000000'
};

function probeClasses(doc: Document, className: string, cache: Map<string, IProbe>): IProbe {
  const hit = cache.get(className);
  if (hit) { return hit; }
  const result: IProbe = {};
  try {
    const host = doc.createElement('div');
    // Wrappers the Text web part uses, in case its CSS is scoped to them.
    host.setAttribute('data-sp-rte', '');
    host.className = 'rte--read cke_editable ck-content';
    host.style.cssText = `position:absolute;left:-10000px;top:0;visibility:hidden;color:${SENTINEL_COLOR};font-size:${SENTINEL_SIZE};background:transparent`;
    const span = doc.createElement('span');
    span.className = className;
    span.textContent = 'x';
    host.appendChild(span);
    doc.body.appendChild(host);
    const cs = doc.defaultView ? doc.defaultView.getComputedStyle(span) : undefined;
    if (cs) {
      if (cs.color && cs.color !== SENTINEL_COLOR) { result.color = cs.color; }
      if (cs.fontSize && cs.fontSize !== SENTINEL_SIZE) { result.fontSize = `${Math.round(parseFloat(cs.fontSize))}px`; }
      if (cs.backgroundColor && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor)) { result.backgroundColor = cs.backgroundColor; }
    }
    host.remove();
  } catch {
    // Probe not possible: fall back to the table.
  }

  const names = className.toLowerCase().split(/\s+/);
  for (const name of names) {
    if (!result.color && COLOR_CLASSES[name]) { result.color = COLOR_CLASSES[name]; }
    if (!result.backgroundColor && HIGHLIGHT_CLASSES[name]) { result.backgroundColor = HIGHLIGHT_CLASSES[name]; }
  }
  cache.set(className, result);
  return result;
}

function themeColorFor(className: string, themeColors: string[] | undefined): string | undefined {
  if (!themeColors || themeColors.length < 6) { return undefined; }
  for (const name of className.toLowerCase().split(/\s+/)) {
    const i = THEME_CLASSES.indexOf(name);
    if (i >= 0) { return themeColors[i]; }
  }
  return undefined;
}

/** Applies class-based styles inline, then pushes block/link styles down onto the text. */
export function normalizePastedHtml(html: string, doc: Document, themeColors?: string[]): string {
  if (typeof DOMParser === 'undefined' || html.indexOf('<') < 0) {
    return html;
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const cache = new Map<string, IProbe>();

  // 1) Classes -> inline styles.
  parsed.body.querySelectorAll('[class]').forEach((node: Element) => {
    const el = node as HTMLElement;
    const cls = (el.getAttribute('class') || '').trim();
    if (!cls || !SAFE_CLASS.test(cls) || !STYLE_CLASS.test(cls)) { return; }
    const lower = cls.toLowerCase();
    if (/\bnospacingabove\b/.test(lower) && /\bnospacingbelow\b/.test(lower)) {
      el.style.marginTop = '0px';
      el.style.marginBottom = '0px';
    }
    const p = probeClasses(doc, cls, cache);
    const theme = themeColorFor(cls, themeColors);
    if (!el.style.color && (p.color || theme)) { el.style.color = (p.color || theme) as string; }
    if (!el.style.fontSize && p.fontSize) { el.style.fontSize = p.fontSize; }
    if (!el.style.backgroundColor && p.backgroundColor) { el.style.backgroundColor = p.backgroundColor; }
  });

  // 2) Each piece of text gets one span with its full colour/size/highlight, taken from the nearest
  //    ancestor that sets each one. The editor keeps only the innermost span's style, so nested
  //    spans (colour outside, size inside) or styles on blocks and links would otherwise be lost.
  const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    if ((n.nodeValue || '').trim()) { texts.push(n as Text); }
    n = walker.nextNode();
  }
  for (const text of texts) {
    let color = '';
    let size = '';
    let bg = '';
    let el = text.parentElement;
    while (el && el !== parsed.body) {
      if (!color && el.style.color) { color = el.style.color; }
      if (!size && el.style.fontSize) { size = el.style.fontSize; }
      if (!bg && el.style.backgroundColor && el.tagName !== 'TD' && el.tagName !== 'TH' && el.tagName !== 'TABLE') {
        bg = el.style.backgroundColor;
      }
      el = el.parentElement;
    }
    if (color || size || bg) {
      const span = parsed.createElement('span');
      if (color) { span.style.color = color; }
      if (size) { span.style.fontSize = size; }
      if (bg) { span.style.backgroundColor = bg; }
      text.parentNode?.insertBefore(span, text);
      span.appendChild(text);
    }
  }
  // SharePoint's class names are not needed any more (and would pick up page CSS in the editor).
  parsed.body.querySelectorAll('[class]').forEach((el: Element) => el.removeAttribute('class'));
  return parsed.body.innerHTML;
}
