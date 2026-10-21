import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
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

export const IMAGE_ALIGNS: string[] = ['left', 'center', 'right'];
const ALIGN_VALUE: RegExp = /^(left|center|right)$/;

/**
 * Image by address only (no pasted data: images, which would bloat the page; pasted image files are
 * uploaded to Site Assets by the editor instead). Like the Text web part: align left / center / right
 * and resize by dragging a corner handle (width stored in % of the text width, so it stays responsive).
 */
export const SafeImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const w = el.getAttribute('width') || el.style.width;
          return w && /^\d{1,4}(\.\d+)?(px|%)?$/.test(w) ? (/\d$/.test(w) ? `${w}px` : w) : null;
        },
        renderHTML: (a: { width?: string | null }) => a.width ? { style: `width: ${a.width}` } : {}
      },
      align: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-align');
          return v && ALIGN_VALUE.test(v) ? v : null;
        },
        renderHTML: (a: { align?: string | null }) => a.align ? { 'data-align': a.align } : {}
      }
    };
  },
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (node: HTMLElement | string) =>
        typeof node !== 'string' && isSafeImageSrc(node.getAttribute('src') || '') ? {} : false
    }];
  },
  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ node, editor, getPos }: any) => {
      const doc: Document = editor.view.dom.ownerDocument;
      const wrap = doc.createElement('span');
      wrap.className = 'oict-img-wrap';
      wrap.setAttribute('contenteditable', 'false');
      const img = doc.createElement('img');
      img.draggable = false;
      wrap.appendChild(img);
      const sizeTip = doc.createElement('span');
      sizeTip.className = 'oict-img-size';
      wrap.appendChild(sizeTip);
      let current = node;
      const apply = (n: typeof node): void => {
        current = n;
        if (isSafeImageSrc(n.attrs.src || '')) { img.setAttribute('src', n.attrs.src); } else { img.removeAttribute('src'); }
        if (n.attrs.alt) { img.setAttribute('alt', n.attrs.alt); } else { img.removeAttribute('alt'); }
        if (n.attrs.title) { img.setAttribute('title', n.attrs.title); } else { img.removeAttribute('title'); }
        wrap.style.width = n.attrs.width || '';
        if (n.attrs.align) { wrap.setAttribute('data-align', n.attrs.align); } else { wrap.removeAttribute('data-align'); }
      };
      apply(node);

      ['nw', 'ne', 'sw', 'se'].forEach(h => {
        const handle = doc.createElement('span');
        handle.className = 'oict-handle';
        handle.setAttribute('data-h', h);
        handle.addEventListener('mousedown', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          const startX = ev.clientX;
          const startW = img.getBoundingClientRect().width;
          const full = Math.max(40, editor.view.dom.clientWidth);
          const sign = h === 'nw' || h === 'sw' ? -1 : 1;
          let width = startW;
          wrap.classList.add('is-resizing');
          const move = (e: MouseEvent): void => {
            width = Math.max(40, Math.min(full, startW + sign * (e.clientX - startX) * (current.attrs.align === 'center' ? 2 : 1)));
            wrap.style.width = `${Math.round(width)}px`;
            sizeTip.textContent = `${Math.round((width / full) * 100)}%`;
          };
          const up = (): void => {
            doc.removeEventListener('mousemove', move);
            doc.removeEventListener('mouseup', up);
            wrap.classList.remove('is-resizing');
            const pos = typeof getPos === 'function' ? getPos() : undefined;
            if (typeof pos !== 'number') { apply(current); return; }
            const pct = Math.max(5, Math.min(100, Math.round((width / full) * 100)));
            editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, width: `${pct}%` }));
          };
          doc.addEventListener('mousemove', move);
          doc.addEventListener('mouseup', up);
        });
        wrap.appendChild(handle);
      });

      return {
        dom: wrap,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: (n: any): boolean => {
          if (n.type !== current.type) { return false; }
          apply(n);
          return true;
        },
        selectNode: (): void => { wrap.classList.add('is-selected'); },
        deselectNode: (): void => { wrap.classList.remove('is-selected'); },
        stopEvent: (e: Event): boolean => !!(e.target as Element).classList?.contains('oict-handle'),
        ignoreMutation: (): boolean => true
      };
    };
  }
}).configure({ inline: false, allowBase64: false });

export const TABLE_STYLES: Array<[string, string]> = [
  ['', 'ธรรมดา'], ['minimal', 'เส้นแนวนอน'], ['banded', 'แถบสลับ'], ['header', 'หัวตารางเทา'],
  ['theme-header', 'หัวตารางสีธีม'], ['theme-banded', 'แถบสีธีม'], ['theme-lines', 'เส้นสีธีม'], ['theme-accent', 'เน้นสีธีม']
];
const TABLE_STYLE_VALUE: RegExp = /^(minimal|banded|header|theme-header|theme-banded|theme-lines|theme-accent)$/;

/** Table with a style (simple or theme-coloured, like the Text web part) and an alignment. */
export const StyledTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      tableStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-table-style');
          return v && TABLE_STYLE_VALUE.test(v) ? v : null;
        },
        renderHTML: (a: { tableStyle?: string | null }) => a.tableStyle ? { 'data-table-style': a.tableStyle } : {}
      },
      align: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-align');
          return v && ALIGN_VALUE.test(v) ? v : null;
        },
        renderHTML: (a: { align?: string | null }) => a.align ? { 'data-align': a.align } : {}
      }
    };
  }
});

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
