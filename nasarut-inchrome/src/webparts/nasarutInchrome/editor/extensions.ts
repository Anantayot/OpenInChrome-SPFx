import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { isSafeImageSrc } from './links';

/* Custom editor extensions that mirror the SharePoint Text web part. */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphFormat: {
      setNoSpacing: (on: boolean) => ReturnType;
      setLineHeight: (value: string | undefined) => ReturnType;
      toggleSpaceBefore: () => ReturnType;
      toggleSpaceAfter: () => ReturnType;
      indentParagraph: (delta: number) => ReturnType;
    };
    textLang: {
      setTextLang: (lang: string) => ReturnType;
      unsetTextLang: () => ReturnType;
    };
  }
}

export const LINE_HEIGHTS: string[] = ['1.0', '1.2', '1.4', '1.6', '2.0', '2.4'];
export const MAX_INDENT: number = 8;
const INDENT_PX: number = 40;
const BLOCKS: string[] = ['paragraph', 'heading'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cmd = (props: any) => boolean;

function updateBlocks(attrs: (current: Record<string, unknown>) => Record<string, unknown>): Cmd {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ tr, state, dispatch }: any): boolean => {
    const { from, to } = state.selection;
    let changed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.doc.nodesBetween(from, to, (node: any, pos: number) => {
      if (BLOCKS.indexOf(node.type.name) >= 0) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs(node.attrs) });
        changed = true;
      }
    });
    if (changed && dispatch) { dispatch(tr); }
    return changed;
  };
}

/** Paragraph-level formatting: No spacing, line spacing, space before/after, indent. */
export const ParagraphFormat: Extension = Extension.create({
  name: 'paragraphFormat',

  addGlobalAttributes() {
    return [{
      types: BLOCKS,
      attributes: {
        spacing: {
          default: null,
          parseHTML: (el: HTMLElement) => {
            if (el.getAttribute('data-spacing') === 'none') { return 'none'; }
            // Pasted from SharePoint Text: "No spacing" comes through as zero margins.
            return el.style.marginTop === '0px' && el.style.marginBottom === '0px' ? 'none' : null;
          },
          renderHTML: (a: { spacing?: string | null }) => a.spacing === 'none' ? { 'data-spacing': 'none' } : {}
        },
        lineHeight: {
          default: null,
          parseHTML: (el: HTMLElement) => {
            const v = parseFloat(el.style.lineHeight);
            return v >= 1 && v <= 3 && /^\d(\.\d+)?$/.test(el.style.lineHeight) ? v.toFixed(1) : null;
          },
          renderHTML: (a: { lineHeight?: string | null }) => a.lineHeight ? { style: `line-height: ${a.lineHeight}` } : {}
        },
        spaceBefore: {
          default: false,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-space-before') === 'true',
          renderHTML: (a: { spaceBefore?: boolean }) => a.spaceBefore ? { 'data-space-before': 'true' } : {}
        },
        spaceAfter: {
          default: false,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-space-after') === 'true',
          renderHTML: (a: { spaceAfter?: boolean }) => a.spaceAfter ? { 'data-space-after': 'true' } : {}
        },
        indent: {
          default: 0,
          parseHTML: (el: HTMLElement) => {
            const px = parseFloat(el.style.marginLeft);
            return px > 0 ? Math.min(MAX_INDENT, Math.round(px / INDENT_PX)) : 0;
          },
          renderHTML: (a: { indent?: number }) => a.indent ? { style: `margin-left: ${a.indent * INDENT_PX}px` } : {}
        }
      }
    }];
  },

  addCommands() {
    return {
      setNoSpacing: (on: boolean) => updateBlocks(() => ({ spacing: on ? 'none' : null })),
      setLineHeight: (value: string | undefined) => updateBlocks(() => ({ lineHeight: value || null })),
      toggleSpaceBefore: () => updateBlocks((c) => ({ spaceBefore: !c.spaceBefore })),
      toggleSpaceAfter: () => updateBlocks((c) => ({ spaceAfter: !c.spaceAfter })),
      indentParagraph: (delta: number) => updateBlocks((c) => ({
        indent: Math.max(0, Math.min(MAX_INDENT, (Number(c.indent) || 0) + delta))
      }))
    };
  }
});

const BULLETS: string[] = ['disc', 'circle', 'square'];
export const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => BULLETS.indexOf(el.style.listStyleType) >= 0 ? el.style.listStyleType : null,
        renderHTML: (a: { listStyle?: string | null }) => a.listStyle ? { style: `list-style-type: ${a.listStyle}` } : {}
      }
    };
  }
});

const NUMBERS: string[] = ['decimal', 'upper-alpha', 'lower-alpha', 'upper-roman', 'lower-roman'];
export const StyledOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => NUMBERS.indexOf(el.style.listStyleType) >= 0 ? el.style.listStyleType : null,
        renderHTML: (a: { listStyle?: string | null }) => a.listStyle ? { style: `list-style-type: ${a.listStyle}` } : {}
      }
    };
  }
});

export const QUOTE_STYLES: string[] = ['intense', 'boxed', 'side', 'icon'];
export const StyledBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      quoteStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-quote-style');
          return v && QUOTE_STYLES.indexOf(v) >= 0 ? v : null;
        },
        renderHTML: (a: { quoteStyle?: string | null }) => a.quoteStyle ? { 'data-quote-style': a.quoteStyle } : {}
      }
    };
  }
});

/** Image by address only (no pasted data: images, which would bloat the page). */
export const SafeImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const w = el.getAttribute('width') || el.style.width;
          return w && /^\d{1,4}(px|%)?$/.test(w) ? (/\d$/.test(w) ? `${w}px` : w) : null;
        },
        renderHTML: (a: { width?: string | null }) => a.width ? { style: `width: ${a.width}` } : {}
      }
    };
  },
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (node: HTMLElement | string) =>
        typeof node !== 'string' && isSafeImageSrc(node.getAttribute('src') || '') ? {} : false
    }];
  }
}).configure({ inline: false, allowBase64: false });

/** Accessibility → Text language: wraps text in <span lang="...">. */
export const TextLang = Mark.create({
  name: 'textLang',
  addAttributes() {
    return {
      lang: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('lang'),
        renderHTML: (a: { lang?: string | null }) => a.lang ? { lang: a.lang } : {}
      }
    };
  },
  parseHTML() {
    return [{
      tag: 'span[lang]',
      consuming: false,
      priority: 55,
      getAttrs: (node: HTMLElement | string) =>
        typeof node !== 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(node.getAttribute('lang') || '') ? {} : false
    }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setTextLang: (lang: string) => ({ commands }) => commands.setMark(this.name, { lang }),
      unsetTextLang: () => ({ commands }) => commands.unsetMark(this.name)
    };
  }
});

/** Highlight that also understands pasted <span style="background-color:..."> (SharePoint Text output). */
export const SpanHighlight = Highlight.extend({
  parseHTML() {
    return [
      { tag: 'mark' },
      {
        tag: 'span',
        // Not consuming, so the same span still gives its colour / size to textStyle.
        consuming: false,
        priority: 60,
        getAttrs: (node: HTMLElement | string) =>
          typeof node !== 'string' && node.style.backgroundColor &&
          !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(node.style.backgroundColor) ? {} : false
      }
    ];
  }
});
