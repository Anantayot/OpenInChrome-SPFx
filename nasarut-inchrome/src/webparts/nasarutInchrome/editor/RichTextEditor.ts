import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';

import { FontSize } from './FontSize';
import {
  LINE_HEIGHTS, MAX_INDENT, ParagraphFormat, SafeImage, SpanHighlight, StyledBlockquote,
  StyledBulletList, StyledOrderedList, TextLang
} from './extensions';
import { openColorDialog } from './ColorDialog';
import { normalizePastedHtml } from './paste';
import { buildHref, isAllowedHref, isChromeHref, isSafeImageSrc, stripChrome } from './links';
import { sanitizeHtml } from './sanitize';
import { ensureStyles } from './styles';

/** A page shown in the Insert link dialog. */
export interface ISitePage {
  title: string;
  url: string;
  /** ISO date. */
  modified: string;
}

export interface IRichTextEditorOptions {
  html: string;
  /** Finds pages on the current site for the Insert link dialog. Empty query = most recent pages. */
  searchPages?: (query: string) => Promise<ISitePage[]>;
  placeholder?: string;
  /** Six colours from the site theme (darkest first) for the "Theme colors" row. */
  themeColors?: string[];
  onChange: (html: string) => void;
}

const ICONS: { [name: string]: string } = {
  link: '<path d="M6.5 9.5l3-3M5.3 7.7 4 9a2.1 2.1 0 0 0 3 3l1.3-1.3M10.7 8.3 12 7a2.1 2.1 0 0 0-3-3L7.7 5.3"/>',
  more: '<path d="M3.5 8h.01M8 8h.01M12.5 8h.01" stroke-width="2.4"/>',
  chevron: '<path d="M4.5 6.5 8 10l3.5-3.5"/>',
  check: '<path d="M3.5 8.5 6.5 11.5 12.5 4.5"/>',
  next: '<path d="M6 3.5 10.5 8 6 12.5"/>',
  painter: '<path d="M3 2.5h8v3H3zM11 4h2v3.5H7.5V10M6.5 10h2v4h-2z"/>',
  bold: '<path d="M5 3h4a2.5 2.5 0 0 1 0 5H5zM5 8h4.5a2.5 2.5 0 0 1 0 5H5z"/>',
  italic: '<path d="M7 3h5M4 13h5M9.5 3 6.5 13"/>',
  underline: '<path d="M4.5 3v4.5a3.5 3.5 0 0 0 7 0V3M3.5 13.5h9"/>',
  strike: '<path d="M11 4.5C10.3 3.6 9.3 3 8 3 6.3 3 5 4 5 5.4c0 3 6 2 6 5.1C11 12 9.7 13 8 13c-1.4 0-2.6-.6-3.2-1.6M2.5 8h11"/>',
  color: '<path d="M4 12.5 7.4 3.5h1.2L12 12.5M5.4 9h5.2"/>',
  highlight: '<path d="M9.5 3.5 12.5 6.5 7 12H4v-3zM3 14h10"/>',
  sup: '<path d="M2.5 5.5l5 6M7.5 5.5l-5 6M10.5 4.2c.3-.8 2.3-.9 2.3.3 0 .9-2.3 1.6-2.3 2.5h2.5"/>',
  sub: '<path d="M2.5 3.5l5 6M7.5 3.5l-5 6M10.5 10.2c.3-.8 2.3-.9 2.3.3 0 .9-2.3 1.6-2.3 2.5h2.5"/>',
  unlink: '<path d="M5.3 7.7 4 9a2.1 2.1 0 0 0 3 3l1.3-1.3M10.7 8.3 12 7a2.1 2.1 0 0 0-3-3L7.7 5.3M2.5 2.5l11 11"/>',
  access: '<circle cx="8" cy="3" r="1.3"/><path d="M3 5.5h10M8 5.5v4M8 9.5l-2.5 4.5M8 9.5l2.5 4.5"/>',
  lang: '<path d="M2.5 4h6M5.5 2.5V4M4 4c.5 2.5 2 4.3 4 5.3M7 4c-.5 2.5-2 4.3-4 5.3M8.5 13.5l2.5-6 2.5 6M9.3 11.6h3.4"/>',
  clear: '<path d="M4 3.5h7M7.5 3.5v6M3 13.5l10-10"/>',
  quote: '<path d="M3 9.5c0-3 1.3-4.7 3.5-5.5M3 9.5h3v3.5H3zM9 9.5c0-3 1.3-4.7 3.5-5.5M9 9.5h3v3.5H9z"/>',
  align: '<path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8"/>',
  alignLeft: '<path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8"/>',
  alignCenter: '<path d="M2 3h12M4 6.5h8M2 10h12M4 13.5h8"/>',
  alignRight: '<path d="M2 3h12M6 6.5h8M2 10h12M6 13.5h8"/>',
  justify: '<path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12"/>',
  bullet: '<path d="M6 4h8M6 8h8M6 12h8"/><path d="M2.6 4h.01M2.6 8h.01M2.6 12h.01" stroke-width="2.4"/>',
  numbered: '<path d="M7 4h7M7 8h7M7 12h7M2.5 2.8l1-.6v3.6M2 9.3c.2-.7 1.9-.8 1.9.3 0 .7-1.9 1.4-1.9 2.1h2"/>',
  indent: '<path d="M7 4h7M7 8h7M7 12h7M2.5 6l2 2-2 2"/>',
  outdent: '<path d="M7 4h7M7 8h7M7 12h7M4.5 6 2.5 8l2 2"/>',
  spacing: '<path d="M7 3h7M7 8h7M7 13h7M3.5 2.5v11M2 4l1.5-1.5L5 4M2 12l1.5 1.5L5 12"/>',
  image: '<rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1.2"/><path d="M2.5 12l3.5-3.5 2.5 2.5 2-2 3 3"/>',
  table: '<rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 6.5h12M2 10h12M6.5 3v10"/>',
  hr: '<path d="M2 8h12"/>',
  undo: '<path d="M5 3.5 2.5 6 5 8.5M2.5 6H10a3.5 3.5 0 0 1 0 7H7"/>',
  redo: '<path d="M11 3.5 13.5 6 11 8.5M13.5 6H6a3.5 3.5 0 0 0 0 7h3"/>',
  dot: '<circle cx="8" cy="8" r="3" fill="currentColor"/>',
  circle: '<circle cx="8" cy="8" r="3"/>',
  square: '<rect x="5" y="5" width="6" height="6" fill="currentColor"/>',
  none: '<circle cx="8" cy="8" r="5.5"/><path d="M4.2 4.2l7.6 7.6"/>',
  intense: '<path d="M2.5 3h11M2.5 13h11M8 5.5v5"/>',
  boxed: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/>',
  side: '<path d="M4 2.5v11" stroke-width="2.2"/>',
  quoteIcon: '<rect x="2.5" y="2.5" width="11" height="9" rx="1.5"/><path d="M6 13.5l2-2h-3M5.5 6.5h1.5v2H5.5zM9 6.5h1.5v2H9z"/>',
  restart: '<path d="M3 3v4h4M3.5 7A5 5 0 1 1 5 11.5"/>',
  continue: '<path d="M3 8h9M9 5l3 3-3 3"/>',
  startAt: '<path d="M2.5 4.5l1-1v5M6.5 4c.3-.8 2.3-.9 2.3.3 0 .9-2.3 1.6-2.3 2.5h2.5M11 3.5h2.5l-1.3 2c1.2 0 1.5.6 1.5 1.3 0 1.4-2 1.6-2.7.7M2.5 12.5h11"/>'
};

const DEFAULT_THEME: string[] = ['#004578', '#005a9e', '#106ebe', '#0078d4', '#2b88d8', '#71afe5'];
const NEUTRALS: string[] = ['#000000', '#262626', '#404040', '#595959', '#808080', '#a6a6a6'];
const STANDARD_COLORS: Array<[string, string]> = [
  ['#a80000', 'แดงเข้ม'], ['#e81123', 'แดง'], ['#ffaa44', 'ส้ม'], ['#fff100', 'เหลือง'], ['#bad80a', 'เขียวอ่อน'],
  ['#107c10', 'เขียว'], ['#00bcf2', 'ฟ้าอ่อน'], ['#0078d4', 'ฟ้า'], ['#002050', 'น้ำเงินเข้ม'], ['#5c2d91', 'ม่วง']];
const HIGHLIGHTS: Array<[string, string]> = [
  ['#ffff00', 'เหลือง'], ['#00ff00', 'เขียวสด'], ['#00ffff', 'ฟ้าอมเขียว'], ['#ff00ff', 'ชมพู'], ['#0000ff', 'น้ำเงิน'],
  ['#ff0000', 'แดง'], ['#000080', 'น้ำเงินเข้ม'], ['#008080', 'เขียวหัวเป็ด'], ['#008000', 'เขียว'], ['#800080', 'ม่วง'],
  ['#800000', 'แดงเข้ม'], ['#808000', 'เหลืองเข้ม'], ['#808080', 'เทา 50%'], ['#c0c0c0', 'เทา 25%'], ['#000000', 'ดำ']];
const SIZES: number[] = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 42, 48];
const LANGUAGES: Array<[string, string]> = [
  ['th', 'ไทย'], ['en', 'English'], ['zh-Hans', '中文 (简体)'], ['zh-Hant', '中文 (繁體)'], ['ja', '日本語'],
  ['ko', '한국어'], ['lo', 'ລາວ'], ['my', 'မြန်မာ'], ['km', 'ខ្មែរ'], ['vi', 'Tiếng Việt'], ['ms', 'Bahasa Melayu'],
  ['fr', 'Français'], ['de', 'Deutsch']];
const FORMAT_MARKS: string[] = ['bold', 'italic', 'underline', 'strike', 'textStyle', 'highlight', 'subscript', 'superscript', 'textLang'];

type StyleId = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'nospace' | 'quote' | 'code';
const STYLES: Array<[StyleId, string, string]> = [
  ['h1', 'หัวเรื่อง 1', 'font-size:22px;font-weight:600'],
  ['h2', 'หัวเรื่อง 2', 'font-size:19px;font-weight:600'],
  ['h3', 'หัวเรื่อง 3', 'font-size:16px;font-weight:600'],
  ['h4', 'หัวเรื่อง 4', 'font-size:14px;font-weight:600'],
  ['p', 'ปกติ', 'font-size:14px'],
  ['nospace', 'ไม่มีระยะห่าง', 'font-size:14px'],
  ['quote', 'คำพูด', 'font-size:15px;font-style:italic;font-weight:600'],
  ['code', 'ตัวอักษรความกว้างคงที่', 'font-size:13px;font-family:Consolas,Menlo,monospace']
];

interface IMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  checked?: () => boolean;
  enabled?: () => boolean;
  run?: () => void;
  /** Opens a side flyout. With run as well, the item becomes a split button like SharePoint. */
  panel?: () => HTMLElement;
}

interface IMarkSnapshot { type: string; attrs: Record<string, unknown>; }

function svg(name: string): string {
  return `<svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as { [k: string]: string })[c]);
}

/**
 * Pasted links can carry their colour / size on the <a> itself (style="color:..."),
 * which the editor would otherwise drop. Move those styles onto an inner span.
 */
function liftLinkStyles(html: string): string {
  if (html.indexOf('<a') < 0 || typeof DOMParser === 'undefined') {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('a[style]').forEach((a: Element) => {
    const el = a as HTMLElement;
    const color = el.style.color;
    const size = el.style.fontSize;
    if (!color && !size) {
      return;
    }
    const span = doc.createElement('span');
    if (color) { span.style.color = color; }
    if (size) { span.style.fontSize = size; }
    while (el.firstChild) { span.appendChild(el.firstChild); }
    el.appendChild(span);
  });
  return doc.body.innerHTML;
}

export class RichTextEditor {
  public readonly editor: Editor;

  private readonly root: HTMLDivElement;
  private readonly toolbar: HTMLDivElement;
  private readonly options: IRichTextEditorOptions;
  private styleBtn!: HTMLButtonElement;
  private sizeBtn!: HTMLButtonElement;
  private linkBtn!: HTMLButtonElement;
  private moreBtn!: HTMLButtonElement;
  private popover: HTMLDivElement | undefined;
  private flyout: HTMLDivElement | undefined;
  private flyoutOwner: HTMLElement | undefined;
  private hoverTimer: number | undefined;
  private linkRange: { from: number; to: number } | undefined;
  private changeTimer: number | undefined;
  private painterMarks: IMarkSnapshot[] | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private blurTimer: number | undefined;
  private closeDialog: (() => void) | undefined;
  private selectTimer: number | undefined;
  private painting: boolean = false;
  private readonly onDocMouseDown = (e: MouseEvent): void => {
    const t = e.target as Element;
    if ((this.popover || this.flyout) && !(this.popover && this.popover.contains(t)) && !(this.flyout && this.flyout.contains(t)) &&
        !t.closest?.('[data-oict-pop-anchor]')) {
      this.closePopover();
    }
  };
  private readonly onEditorMouseUp = (): void => {
    if (this.painting && !this.editor.state.selection.empty) {
      this.pasteFormat();
      this.setPainting(false);
    }
  };

  constructor(host: HTMLElement, options: IRichTextEditorOptions) {
    ensureStyles(host.ownerDocument);
    this.options = options;

    const doc = host.ownerDocument;
    this.root = doc.createElement('div');
    this.root.className = 'oict';
    this.toolbar = doc.createElement('div');
    this.toolbar.className = 'oict-toolbar';
    this.toolbar.setAttribute('role', 'toolbar');
    this.toolbar.setAttribute('aria-label', 'จัดรูปแบบข้อความ');
    const body = doc.createElement('div');
    body.className = 'oict-editor oict-content';
    this.root.appendChild(this.toolbar);
    this.root.appendChild(body);
    host.replaceChildren(this.root);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const Shortcuts = Extension.create({
      name: 'oictShortcuts',
      addKeyboardShortcuts() {
        return {
          'Mod-k': () => { self.openLinkPanel(); return true; },
          'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
          'Mod-Alt-c': () => { self.copyFormat(); return true; },
          'Mod-Alt-v': () => { self.pasteFormat(); return true; },
          'Escape': () => { if (self.painting) { self.setPainting(false); return true; } return false; }
        };
      }
    });

    this.editor = new Editor({
      element: body,
      content: sanitizeHtml(options.html),
      editorProps: {
        transformPastedHTML: (html: string) => normalizePastedHtml(liftLinkStyles(html), doc, options.themeColors)
      },
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, bulletList: false, orderedList: false, blockquote: false }),
        StyledBulletList,
        StyledOrderedList,
        StyledBlockquote,
        Underline,
        // Nested <span style> (colour outside, size inside) keep both styles.
        TextStyle.configure({ mergeNestedSpanStyles: true }),
        Color,
        FontSize,
        ParagraphFormat,
        SpanHighlight.configure({ multicolor: true }),
        TextLang,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Subscript,
        Superscript,
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { target: null, rel: null, class: null },
          isAllowedUri: (url: string) => isAllowedHref(url)
        }),
        SafeImage,
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: options.placeholder || 'เขียนข้อความที่นี่…' }),
        Shortcuts
      ],
      onUpdate: () => this.scheduleChange(),
      onTransaction: () => this.refreshToolbar()
    });

    this.buildToolbar();
    this.refreshToolbar();
    doc.addEventListener('mousedown', this.onDocMouseDown, true);
    this.setupToolbarPlacement();
    body.addEventListener('mouseup', this.onEditorMouseUp);
  }

  public getHtml(): string {
    return sanitizeHtml(this.editor.getHTML());
  }

  public destroy(): void {
    if (this.changeTimer !== undefined) {
      window.clearTimeout(this.changeTimer);
      this.options.onChange(this.getHtml());
    }
    this.closePopover();
    if (this.closeDialog) { this.closeDialog(); }
    window.clearTimeout(this.blurTimer);
    this.stopSync();
    if (this.resizeObserver) { this.resizeObserver.disconnect(); }
    this.root.ownerDocument.removeEventListener('mousedown', this.onDocMouseDown, true);
    this.editor.destroy();
    this.root.remove();
  }

  // ---------- toolbar (same four controls as the SharePoint Text web part) ----------

  private buildToolbar(): void {
    this.styleBtn = this.toolButton('oict-drop oict-drop-style', 'รูปแบบข้อความ',
      `<span class="oict-drop-label"></span>${svg('chevron')}`, (b: HTMLButtonElement) => this.openStyleMenu(b));
    this.sizeBtn = this.toolButton('oict-drop oict-drop-size', 'ขนาดตัวอักษร',
      `<span class="oict-drop-label"></span>${svg('chevron')}`, (b: HTMLButtonElement) => this.openSizeMenu(b));
    this.linkBtn = this.toolButton('oict-btn', 'ลิงก์ (Ctrl+K)', svg('link'), () => this.openLinkPanel());
    this.moreBtn = this.toolButton('oict-btn', 'ตัวเลือกเพิ่มเติม', svg('more'), (b: HTMLButtonElement) => this.openMoreMenu(b));
  }

  // ---------- toolbar placement ----------

  /**
   * Like the SharePoint Text web part, the toolbar sits above the web part frame,
   * right after SharePoint's own web part toolbar (drag, settings, duplicate, delete),
   * and may extend past the column. It shows whenever SharePoint shows its toolbar for
   * this web part (web part selected), and while the text is focused or hovered.
   * Only if the page really clips the area above the web part does it move inside the frame.
   */
  private setupToolbarPlacement(): void {
    this.root.classList.add('oict-float');
    const show = (): void => this.placeToolbar();
    this.root.addEventListener('focusin', () => {
      window.clearTimeout(this.blurTimer);
      this.root.classList.add('is-focused');
      show();
    });
    this.root.addEventListener('focusout', () => this.syncFocusState());
    this.root.addEventListener('mouseenter', show);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.placeToolbar());
      this.resizeObserver.observe(this.root);
    }
    // Our toolbar is joined to SharePoint's web part toolbar: it appears, fades and disappears
    // together with it. SharePoint shows its toolbar on hover and on selection, so we re-check
    // on every frame for a moment after anything that could change it.
    const doc = this.root.ownerDocument;
    doc.addEventListener('mouseover', this.onSyncTrigger, true);
    doc.addEventListener('mousedown', this.onSyncTrigger, true);
    doc.addEventListener('focusin', this.onSyncTrigger, true);
    doc.addEventListener('keyup', this.onSyncTrigger, true);
    doc.addEventListener('transitionrun', this.onSyncTrigger, true);
    doc.addEventListener('transitionend', this.onSyncTrigger, true);
    if (typeof MutationObserver !== 'undefined') {
      this.syncObserver = new MutationObserver((records: MutationRecord[]) => {
        if (records.some(r => !this.root.contains(r.target) && !(this.popover && this.popover.contains(r.target)))) {
          this.onSyncTrigger();
        }
      });
      this.syncObserver.observe(doc.body, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
      });
    }
    this.selectTimer = window.setInterval(() => this.syncWithSharePoint(), 250);
    this.syncWithSharePoint();
    this.placeToolbar();
  }

  private syncObserver: MutationObserver | undefined;
  private syncFrame: number = 0;
  private syncUntil: number = 0;
  /** True once SharePoint's toolbar has been seen: from then on ours follows it instead of plain hover. */
  private joined: boolean = false;

  private readonly onSyncTrigger = (): void => {
    this.syncUntil = Date.now() + 400;
    if (this.syncFrame) { return; }
    const tick = (): void => {
      this.syncWithSharePoint();
      this.syncFrame = Date.now() < this.syncUntil ? window.requestAnimationFrame(tick) : 0;
    };
    this.syncFrame = window.requestAnimationFrame(tick);
  };

  private stopSync(): void {
    const doc = this.root.ownerDocument;
    doc.removeEventListener('mouseover', this.onSyncTrigger, true);
    doc.removeEventListener('mousedown', this.onSyncTrigger, true);
    doc.removeEventListener('focusin', this.onSyncTrigger, true);
    doc.removeEventListener('keyup', this.onSyncTrigger, true);
    doc.removeEventListener('transitionrun', this.onSyncTrigger, true);
    doc.removeEventListener('transitionend', this.onSyncTrigger, true);
    if (this.syncObserver) { this.syncObserver.disconnect(); }
    if (this.syncFrame) { window.cancelAnimationFrame(this.syncFrame); }
    window.clearInterval(this.selectTimer);
  }

  /** Shows/hides (and fades) our toolbar exactly like SharePoint's toolbar for this web part. */
  private syncWithSharePoint(): void {
    const bar = this.findSharePointToolbar();
    const opacity = bar ? RichTextEditor.effectiveOpacity(bar) : 0;
    const visible = !!bar && opacity > 0.02;
    if (visible && !this.joined) {
      this.joined = true;
      this.root.classList.add('oict-joined');
    }
    const was = this.root.classList.contains('is-selected');
    this.root.classList.toggle('is-selected', visible);
    // Mirror SharePoint's fade so both bars appear and disappear as one.
    this.toolbar.style.opacity = visible && opacity < 0.98 ? String(Math.round(opacity * 100) / 100) : '';
    if (visible) {
      this.placeToolbar(bar);
    } else if (was) {
      this.syncFocusState();
    }
  }

  /** Opacity of an element including its ancestors' (SharePoint may fade a wrapper). */
  private static effectiveOpacity(el: Element): number {
    let value = 1;
    let node: Element | null = el;
    for (let i = 0; node && i < 8; i++) {
      const cs = window.getComputedStyle(node);
      if (cs.visibility === 'hidden' || cs.display === 'none') { return 0; }
      value *= parseFloat(cs.opacity) || 0;
      node = node.parentElement;
    }
    return value;
  }

  /** Hides the floating toolbar once focus has really left the web part (menus and dialogs count as inside). */
  private syncFocusState(): void {
    window.clearTimeout(this.blurTimer);
    this.blurTimer = window.setTimeout(() => {
      const active = this.root.ownerDocument.activeElement;
      const inDialog = !!(active && (active as Element).closest?.('.oict-cd-backdrop, .oict-ld-backdrop'));
      if (!this.popover && !inDialog && !(active && this.root.contains(active))) {
        this.root.classList.remove('is-focused');
      }
    }, 120);
  }

  /** Width SharePoint's web part toolbar usually takes when it cannot be found on the page. */
  private static readonly SP_TOOLBAR_FALLBACK: number = 160;

  /** SharePoint's visible web part toolbar for this web part, if any (it sits just above the frame, left-aligned). */
  private findSharePointToolbar(): Element | undefined {
    const rootBox = this.root.getBoundingClientRect();
    if (!rootBox.width) { return undefined; }
    const bars = Array.from(this.root.ownerDocument.querySelectorAll('[role="toolbar"]'));
    for (const bar of bars) {
      if (bar === this.toolbar || this.root.contains(bar)) { continue; }
      const b = bar.getBoundingClientRect();
      if (!b.width || !b.height) { continue; }
      const above = b.bottom <= rootBox.top + 4 && b.bottom >= rootBox.top - 70;
      const alignedLeft = Math.abs(b.left - rootBox.left) < 60;
      if (!above || !alignedLeft) { continue; }
      const cs = window.getComputedStyle(bar);
      if (cs.visibility === 'hidden' || cs.display === 'none') { continue; }
      return bar;
    }
    return undefined;
  }

  /** True when an ancestor with overflow clipping cuts off the area above the web part. */
  private isAreaAboveClipped(): boolean {
    const rootBox = this.root.getBoundingClientRect();
    const top = rootBox.top - 50;
    let el = this.root.parentElement;
    while (el && el !== this.root.ownerDocument.body) {
      const cs = window.getComputedStyle(el);
      if (/(hidden|clip|auto|scroll)/.test(cs.overflowY + cs.overflow) && el.getBoundingClientRect().top > top) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  /**
   * Joins our toolbar onto the right end of SharePoint's toolbar, same top and height, so the two
   * read as one bar. If there is no room on the right it sits on top of SharePoint's toolbar.
   * Moves inside the frame only when the area above is really clipped.
   */
  private placeToolbar(spBar?: Element): void {
    const t = this.toolbar.style;
    const inside = this.isAreaAboveClipped();
    this.root.classList.toggle('oict-inside', inside);
    if (inside) {
      this.root.classList.remove('oict-stack');
      t.left = ''; t.top = ''; t.height = '';
      return;
    }
    const rootBox = this.root.getBoundingClientRect();
    const bar = spBar || this.findSharePointToolbar();
    if (!bar) {
      t.top = ''; t.height = '';
      const left = RichTextEditor.SP_TOOLBAR_FALLBACK;
      const stack = rootBox.left + left + this.toolbar.offsetWidth > window.innerWidth - 8;
      this.root.classList.toggle('oict-stack', stack);
      t.left = stack ? '0px' : `${left}px`;
      return;
    }
    const b = bar.getBoundingClientRect();
    t.height = `${Math.round(b.height)}px`;
    const left = b.right - rootBox.left + RichTextEditor.JOIN_GAP;
    const stack = rootBox.left + left + this.toolbar.offsetWidth > window.innerWidth - 8;
    this.root.classList.toggle('oict-stack', stack);
    if (stack) {
      t.left = `${Math.round(b.left - rootBox.left)}px`;
      t.top = `${Math.round(b.top - rootBox.top - b.height - RichTextEditor.JOIN_GAP)}px`;
    } else {
      t.left = `${Math.round(left)}px`;
      t.top = `${Math.round(b.top - rootBox.top)}px`;
    }
  }

  /** Space between SharePoint's toolbar and ours. */
  private static readonly JOIN_GAP: number = 4;

  private toolButton(cls: string, title: string, html: string, run: (b: HTMLButtonElement) => void): HTMLButtonElement {
    const b = this.root.ownerDocument.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.setAttribute('aria-haspopup', 'true');
    b.innerHTML = html;
    b.addEventListener('mousedown', (ev: MouseEvent) => ev.preventDefault());
    b.addEventListener('click', () => {
      if (this.popover && b.hasAttribute('data-oict-pop-anchor')) {
        this.closePopover();
        return;
      }
      run(b);
    });
    this.toolbar.appendChild(b);
    return b;
  }

  private currentStyle(): StyleId {
    const e = this.editor;
    for (const level of [1, 2, 3, 4]) {
      if (e.isActive('heading', { level })) { return `h${level}` as StyleId; }
    }
    if (e.isActive('blockquote')) { return 'quote'; }
    if (e.isActive('codeBlock')) { return 'code'; }
    return e.getAttributes('paragraph').spacing === 'none' ? 'nospace' : 'p';
  }

  /** The real font size at the cursor, in px, like the SharePoint size box. */
  private currentSize(): string {
    try {
      const view = this.editor.view;
      const sel = this.editor.state.selection;
      const at = view.domAtPos(sel.empty ? sel.from : sel.from + 1);
      let el: Node | null = at.node;
      if (el.nodeType !== 1) {
        el = el.parentElement;
      } else {
        const child = el.childNodes[at.offset] || el.childNodes[at.offset - 1];
        if (child) { el = child.nodeType === 1 ? child : child.parentElement; }
      }
      if (el && el.nodeType === 1) {
        const px = parseFloat(window.getComputedStyle(el as Element).fontSize);
        if (px > 0) { return String(Math.round(px)); }
      }
    } catch {
      // fall through
    }
    return '';
  }

  private refreshToolbar(): void {
    if (!this.styleBtn) {
      return;
    }
    const style = this.currentStyle();
    const label = (STYLES.find(s => s[0] === style) || STYLES[4])[1];
    (this.styleBtn.querySelector('.oict-drop-label') as HTMLElement).textContent = label;
    (this.sizeBtn.querySelector('.oict-drop-label') as HTMLElement).textContent = this.currentSize() || '–';
    this.linkBtn.classList.toggle('is-active', this.editor.isActive('link'));
  }

  private scheduleChange(): void {
    if (this.changeTimer !== undefined) {
      window.clearTimeout(this.changeTimer);
    }
    this.changeTimer = window.setTimeout(() => {
      this.changeTimer = undefined;
      this.options.onChange(this.getHtml());
    }, 300);
  }

  // ---------- format painter ----------

  private copyFormat(): void {
    const { state } = this.editor;
    const marks = state.storedMarks || state.selection.$from.marks();
    this.painterMarks = marks
      .filter(m => FORMAT_MARKS.indexOf(m.type.name) >= 0)
      .map(m => ({ type: m.type.name, attrs: { ...m.attrs } }));
  }

  private pasteFormat(): void {
    if (!this.painterMarks) { return; }
    const { state, view } = this.editor;
    const { from, to, empty } = state.selection;
    if (empty) { return; }
    const tr = state.tr;
    for (const name of FORMAT_MARKS) {
      const type = state.schema.marks[name];
      if (type) { tr.removeMark(from, to, type); }
    }
    for (const m of this.painterMarks) {
      const type = state.schema.marks[m.type];
      if (type) { tr.addMark(from, to, type.create(m.attrs)); }
    }
    view.dispatch(tr);
    view.focus();
  }

  private setPainting(on: boolean): void {
    this.painting = on;
    this.root.classList.toggle('is-painting', on);
  }

  // ---------- popovers and flyouts ----------

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html?: string): HTMLElementTagNameMap[K] {
    const n = this.root.ownerDocument.createElement(tag);
    n.className = cls;
    if (html !== undefined) { n.innerHTML = html; }
    return n;
  }

  private button(cls: string, html: string, onClick: () => void): HTMLButtonElement {
    const b = this.el('button', cls, html);
    b.type = 'button';
    b.addEventListener('mousedown', (ev: MouseEvent) => ev.preventDefault());
    b.addEventListener('click', onClick);
    return b;
  }

  /**
   * Menus are drawn in a layer on <body> (like SharePoint's own menus), so the next
   * column on the page can never paint over them. Positions are viewport-based (fixed).
   */
  private openPopover(anchor: HTMLElement, content: HTMLElement, extraClass: string = '', alignRight: boolean = false): void {
    this.closePopover();
    const doc = this.root.ownerDocument;
    const pop = this.el('div', `oict-pop oict-layer ${extraClass}`);
    pop.appendChild(content);
    pop.addEventListener('keydown', (ev: KeyboardEvent) => this.onMenuKey(ev));
    doc.body.appendChild(pop);
    anchor.setAttribute('data-oict-pop-anchor', '');
    this.popover = pop;
    this.root.classList.add('has-popover');
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);

    const box = anchor.getBoundingClientRect();
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    let left = alignRight ? box.right - width : box.left;
    // Stay inside the window (the web part can be narrower than the menu).
    left = Math.max(8, Math.min(left, window.innerWidth - 8 - width));
    let top = box.bottom + 4;
    if (top + height > window.innerHeight - 8) { top = Math.max(8, window.innerHeight - 8 - height); }
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  }

  /** Scrolling the page (outside the menu) or resizing closes open menus, like SharePoint. */
  private readonly onViewportChange = (ev: Event): void => {
    const t = ev.target as Node | null;
    if (ev.type === 'scroll' && t && t.nodeType === 1 &&
        ((this.popover && this.popover.contains(t)) || (this.flyout && this.flyout.contains(t)))) {
      return;
    }
    this.closePopover();
  };

  private closeFlyout(): void {
    if (this.flyout) {
      this.flyout.remove();
      this.flyout = undefined;
    }
    if (this.flyoutOwner) {
      this.flyoutOwner.classList.remove('is-open');
      this.flyoutOwner = undefined;
    }
  }

  private closePopover(): void {
    window.clearTimeout(this.hoverTimer);
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
    this.closeFlyout();
    this.root.classList.remove('has-popover');
    if (this.popover) {
      this.popover.remove();
      this.popover = undefined;
      this.syncFocusState();
      this.toolbar.querySelectorAll('[data-oict-pop-anchor]').forEach(n => n.removeAttribute('data-oict-pop-anchor'));
    }
  }

  /** Side flyout next to a menu row, flipped to the left when there is no room on the right. */
  private openFlyout(owner: HTMLElement, content: HTMLElement): void {
    // A late hover timer must not open a flyout after its menu has closed.
    if (!this.popover || !this.popover.contains(owner) && !(this.flyout && this.flyout.contains(owner))) { return; }
    if (this.flyoutOwner === owner && this.flyout) { return; }
    this.closeFlyout();
    const fly = this.el('div', 'oict-pop oict-layer oict-flyout');
    fly.appendChild(content);
    fly.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
        const back = owner.querySelector('button') as HTMLButtonElement | null;
        this.closeFlyout();
        if (back) { back.focus(); }
      } else {
        this.onMenuKey(ev);
      }
    });
    this.root.ownerDocument.body.appendChild(fly);
    this.flyout = fly;
    this.flyoutOwner = owner;
    owner.classList.add('is-open');

    const menuBox = (this.popover || owner).getBoundingClientRect();
    const rowBox = owner.getBoundingClientRect();
    const w = fly.offsetWidth;
    const h = fly.offsetHeight;
    let left = menuBox.right - 2;
    if (left + w > window.innerWidth - 8) { left = Math.max(8, menuBox.left - w + 2); }
    let top = rowBox.top - 5;
    if (top + h > window.innerHeight - 8) { top = Math.max(8, window.innerHeight - 8 - h); }
    fly.style.left = `${Math.round(left)}px`;
    fly.style.top = `${Math.round(top)}px`;
  }

  /** Up/Down moves between items, Right opens a flyout, Enter/Space activates. */
  private onMenuKey(ev: KeyboardEvent): void {
    const container = ev.currentTarget as HTMLElement;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.closePopover();
      this.editor.commands.focus();
      return;
    }
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp' && ev.key !== 'ArrowRight') { return; }
    const items = Array.from(container.querySelectorAll<HTMLButtonElement>('button.oict-item:not(:disabled), button.oict-swatch, button.oict-split-arrow'));
    const i = items.indexOf(container.ownerDocument.activeElement as HTMLButtonElement);
    if (ev.key === 'ArrowRight') {
      const row = (container.ownerDocument.activeElement as HTMLElement)?.closest('.oict-row[data-has-panel]') as HTMLElement | null;
      if (row) { ev.preventDefault(); row.dispatchEvent(new CustomEvent('oict-open')); }
      return;
    }
    ev.preventDefault();
    const next = ev.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    if (items[next]) { items[next].focus(); }
  }

  private menuItem(item: IMenuItem): HTMLElement {
    const checked = !!item.checked && item.checked();
    const enabled = !item.enabled || item.enabled();
    const row = this.el('div', 'oict-row');
    const openPanel = (): void => {
      if (item.panel && enabled) { this.openFlyout(row, item.panel()); }
    };
    const main = this.button('oict-item',
      `<span class="oict-check">${checked ? svg('check') : ''}</span>` +
      `<span class="oict-icon">${item.icon ? svg(item.icon) : ''}</span>` +
      `<span class="oict-label">${esc(item.label)}</span>` +
      (item.panel && !item.run ? `<span class="oict-key">${svg('next')}</span>` : `<span class="oict-key">${esc(item.shortcut || '')}</span>`),
      () => {
        if (item.run) {
          // Close first: some items (e.g. Insert image) open a dialog of their own.
          this.closePopover();
          item.run();
        } else if (item.panel) {
          openPanel();
        }
      });
    main.disabled = !enabled;
    main.setAttribute('role', item.checked ? 'menuitemcheckbox' : 'menuitem');
    if (item.checked) { main.setAttribute('aria-checked', String(checked)); }
    row.appendChild(main);

    if (item.panel) {
      row.setAttribute('data-has-panel', '');
      main.setAttribute('aria-haspopup', 'true');
      row.addEventListener('oict-open', openPanel);
      if (item.run) {
        row.classList.add('oict-split');
        row.appendChild(this.button('oict-split-arrow', svg('next'), openPanel));
      }
    }
    // Hovering a row opens its flyout (or closes another one), like SharePoint.
    row.addEventListener('mouseenter', () => {
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = window.setTimeout(() => {
        if (item.panel && enabled) { openPanel(); }
        else if (this.flyoutOwner && this.flyoutOwner !== row && this.popover?.contains(row)) { this.closeFlyout(); }
      }, 220);
    });
    return row;
  }

  private group(title: string, items: HTMLElement[]): HTMLElement {
    const wrap = this.el('div', '');
    if (title) { wrap.appendChild(this.el('div', 'oict-section', esc(title))); }
    items.forEach(i => wrap.appendChild(i));
    return wrap;
  }

  // ---------- style and size dropdowns ----------

  private openStyleMenu(anchor: HTMLElement): void {
    const e = this.editor;
    const current = this.currentStyle();
    const list = this.el('div', 'oict-menu oict-style-menu');
    list.setAttribute('role', 'menu');
    for (const [id, label, css] of STYLES) {
      const b = this.button('oict-item', `<span class="oict-check">${id === current ? svg('check') : ''}</span><span style="${css}">${esc(label)}</span>`, () => {
        const c = e.chain().focus();
        if (id === 'p' || id === 'nospace') { c.setParagraph().setNoSpacing(id === 'nospace').run(); }
        else if (id === 'quote') { if (!e.isActive('blockquote')) { c.setParagraph().setNoSpacing(false).setBlockquote().run(); } }
        else if (id === 'code') { c.setCodeBlock().run(); }
        else { c.setHeading({ level: Number(id.slice(1)) as 1 | 2 | 3 | 4 }).setNoSpacing(false).run(); }
        this.closePopover();
      });
      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', String(id === current));
      list.appendChild(b);
    }
    this.openPopover(anchor, list);
    (list.querySelector('button') as HTMLButtonElement).focus();
  }

  private openSizeMenu(anchor: HTMLElement): void {
    const e = this.editor;
    const explicit = (e.getAttributes('textStyle').fontSize as string) || '';
    const list = this.el('div', 'oict-menu oict-size-menu');
    list.setAttribute('role', 'menu');
    list.appendChild(this.button('oict-item', `<span class="oict-check">${explicit ? '' : svg('check')}</span>อัตโนมัติ`,
      () => { e.chain().focus().unsetFontSize().run(); this.closePopover(); }));
    for (const s of SIZES) {
      const v = `${s}px`;
      list.appendChild(this.button('oict-item', `<span class="oict-check">${explicit === v ? svg('check') : ''}</span>${s}`,
        () => { e.chain().focus().setFontSize(v).run(); this.closePopover(); }));
    }
    this.openPopover(anchor, list);
  }

  // ---------- "..." menu, laid out like the SharePoint Text web part ----------

  private inList(): boolean {
    return this.editor.isActive('bulletList') || this.editor.isActive('orderedList');
  }

  private openMoreMenu(anchor: HTMLElement): void {
    const e = this.editor;
    const indent = Number(e.getAttributes('paragraph').indent || e.getAttributes('heading').indent || 0);
    const menu = this.el('div', 'oict-menu oict-more');
    menu.setAttribute('role', 'menu');

    menu.appendChild(this.menuItem({
      label: this.painting ? 'ยกเลิกตัวคัดลอกรูปแบบ' : 'ตัวคัดลอกรูปแบบ', icon: 'painter', shortcut: 'Ctrl+Alt+C / V',
      checked: () => this.painting,
      run: () => {
        if (this.painting) { this.setPainting(false); return; }
        this.copyFormat();
        this.setPainting(true);
      }
    }));
    menu.appendChild(this.el('div', 'oict-divider'));

    menu.appendChild(this.group('ตัวอักษร', [
      this.menuItem({ label: 'ตัวหนา', icon: 'bold', shortcut: 'Ctrl+B', checked: () => e.isActive('bold'), run: () => e.chain().focus().toggleBold().run() }),
      this.menuItem({ label: 'ตัวเอียง', icon: 'italic', shortcut: 'Ctrl+I', checked: () => e.isActive('italic'), run: () => e.chain().focus().toggleItalic().run() }),
      this.menuItem({ label: 'ขีดเส้นใต้', icon: 'underline', shortcut: 'Ctrl+U', checked: () => e.isActive('underline'), run: () => e.chain().focus().toggleUnderline().run() }),
      this.menuItem({ label: 'ขีดทับ', icon: 'strike', shortcut: 'Ctrl+Shift+X', checked: () => e.isActive('strike'), run: () => e.chain().focus().toggleStrike().run() }),
      this.menuItem({ label: 'สีตัวอักษร', icon: 'color', panel: () => this.fontColorPanel() }),
      this.menuItem({ label: 'สีไฮไลต์', icon: 'highlight', panel: () => this.highlightPanel() }),
      this.menuItem({ label: 'เอาลิงก์ออก', icon: 'unlink', enabled: () => e.isActive('link'), run: () => e.chain().focus().extendMarkRange('link').unsetLink().run() }),
      this.menuItem({ label: 'ตัวยก', icon: 'sup', checked: () => e.isActive('superscript'), run: () => e.chain().focus().unsetSubscript().toggleSuperscript().run() }),
      this.menuItem({ label: 'ตัวห้อย', icon: 'sub', checked: () => e.isActive('subscript'), run: () => e.chain().focus().unsetSuperscript().toggleSubscript().run() }),
      this.menuItem({ label: 'การช่วยการเข้าถึง', icon: 'access', panel: () => this.accessibilityPanel() }),
      this.menuItem({ label: 'ล้างการจัดรูปแบบทั้งหมด', icon: 'clear', run: () => e.chain().focus().unsetAllMarks().clearNodes().setNoSpacing(false).setLineHeight(undefined).run() })
    ]));
    menu.appendChild(this.el('div', 'oict-divider'));

    const tableItems: HTMLElement[] = e.isActive('table') ? [this.menuItem({ label: 'ตาราง', icon: 'table', panel: () => this.tableOpsPanel() })] : [];
    menu.appendChild(this.group('ย่อหน้า', [
      this.menuItem({
        label: 'คำพูด', icon: 'quote', checked: () => e.isActive('blockquote'),
        run: () => e.chain().focus().toggleBlockquote().run(), panel: () => this.quotePanel()
      }),
      this.menuItem({ label: 'การจัดแนว', icon: 'align', panel: () => this.alignPanel() }),
      this.menuItem({
        label: 'รายการสัญลักษณ์', icon: 'bullet', checked: () => e.isActive('bulletList'),
        run: () => e.chain().focus().toggleBulletList().run(), panel: () => this.bulletPanel()
      }),
      this.menuItem({
        label: 'รายการลำดับเลข', icon: 'numbered', checked: () => e.isActive('orderedList'),
        run: () => e.chain().focus().toggleOrderedList().run(), panel: () => this.numberPanel()
      }),
      this.menuItem({
        label: 'เพิ่มการเยื้อง', icon: 'indent', shortcut: this.inList() ? 'Tab' : '',
        enabled: () => this.inList() ? e.can().sinkListItem('listItem') : indent < MAX_INDENT,
        run: () => { if (this.inList()) { e.chain().focus().sinkListItem('listItem').run(); } else { e.chain().focus().indentParagraph(1).run(); } }
      }),
      this.menuItem({
        label: 'ลดการเยื้อง', icon: 'outdent', shortcut: this.inList() ? 'Shift+Tab' : '',
        enabled: () => this.inList() ? e.can().liftListItem('listItem') : indent > 0,
        run: () => { if (this.inList()) { e.chain().focus().liftListItem('listItem').run(); } else { e.chain().focus().indentParagraph(-1).run(); } }
      }),
      this.menuItem({ label: 'ระยะห่าง', icon: 'spacing', panel: () => this.spacingPanel() }),
      ...tableItems
    ]));
    menu.appendChild(this.el('div', 'oict-divider'));

    menu.appendChild(this.group('ตัวเลือกเพิ่มเติม', [
      this.menuItem({ label: 'แทรกรูปภาพ', icon: 'image', run: () => this.openImagePanel() }),
      this.menuItem({
        label: 'แทรกตาราง 3 × 3', icon: 'table', enabled: () => !e.isActive('table'),
        run: () => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
        panel: () => this.tableGridPanel()
      }),
      this.menuItem({ label: 'เส้นคั่น', icon: 'hr', run: () => e.chain().focus().setHorizontalRule().run() })
    ]));
    menu.appendChild(this.el('div', 'oict-divider'));
    menu.appendChild(this.menuItem({ label: 'เลิกทำ', icon: 'undo', shortcut: 'Ctrl+Z', enabled: () => e.can().undo(), run: () => e.chain().focus().undo().run() }));
    menu.appendChild(this.menuItem({ label: 'ทำซ้ำ', icon: 'redo', shortcut: 'Ctrl+Y', enabled: () => e.can().redo(), run: () => e.chain().focus().redo().run() }));

    // Like the Text web part: the menu opens from the ⋯ button towards the right,
    // over the next column, instead of back over the text being edited.
    this.openPopover(anchor, menu, 'oict-pop-menu', false);
    (menu.querySelector('button.oict-item:not(:disabled)') as HTMLButtonElement | null)?.focus();
  }

  // ---------- flyout panels ----------

  private swatchGrid(colors: Array<[string, string]>, current: string, pick: (c: string) => void, cols: number): HTMLElement {
    const grid = this.el('div', 'oict-swatches');
    grid.style.gridTemplateColumns = `repeat(${cols}, 24px)`;
    for (const [c, name] of colors) {
      const s = this.button('oict-swatch', '', () => { pick(c); this.closePopover(); });
      s.style.background = c;
      s.title = name;
      s.setAttribute('aria-label', name);
      if (current && current.toLowerCase() === c.toLowerCase()) { s.classList.add('is-current'); }
      grid.appendChild(s);
    }
    return grid;
  }

  private fontColorPanel(): HTMLElement {
    const e = this.editor;
    const current = (e.getAttributes('textStyle').color as string) || '';
    const theme = (this.options.themeColors && this.options.themeColors.length >= 6 ? this.options.themeColors : DEFAULT_THEME).slice(0, 6);
    const themeColors: Array<[string, string]> = NEUTRALS.map((c, i) => [c, `เทา ${i + 1}`] as [string, string])
      .concat(theme.map((c, i) => [c, `สีธีม ${i + 1}`] as [string, string]));
    const wrap = this.el('div', 'oict-menu oict-color-panel');
    wrap.appendChild(this.el('div', 'oict-section', 'สีตัวอักษร'));
    wrap.appendChild(this.button('oict-item', `<span class="oict-check">${current ? '' : svg('check')}</span><span class="oict-icon" style="color:#323130">${svg('dot')}</span><span class="oict-label">อัตโนมัติ</span>`,
      () => { e.chain().focus().unsetColor().run(); this.closePopover(); }));
    wrap.appendChild(this.el('div', 'oict-divider'));
    wrap.appendChild(this.el('div', 'oict-section', 'สีของธีม'));
    wrap.appendChild(this.swatchGrid(themeColors, current, (c: string) => e.chain().focus().setColor(c).run(), 6));
    wrap.appendChild(this.el('div', 'oict-section', 'สีมาตรฐาน'));
    wrap.appendChild(this.swatchGrid(STANDARD_COLORS, current, (c: string) => e.chain().focus().setColor(c).run(), 6));
    wrap.appendChild(this.el('div', 'oict-divider'));
    wrap.appendChild(this.button('oict-item', `<span class="oict-check"></span><span class="oict-icon">${svg('color')}</span><span class="oict-label">สีที่กำหนดเอง…</span>`, () => {
      this.closePopover();
      openColorDialog(this.root.ownerDocument, current && current.charAt(0) === '#' ? current : '#e81123')
        .then((c: string | undefined) => {
          if (c) { e.chain().focus().setColor(c).run(); } else { e.commands.focus(); }
        })
        .catch(() => { /* dialog closed */ });
    }));
    return wrap;
  }

  private highlightPanel(): HTMLElement {
    const e = this.editor;
    const current = (e.getAttributes('highlight').color as string) || '';
    const wrap = this.el('div', 'oict-menu oict-color-panel');
    wrap.appendChild(this.el('div', 'oict-section', 'สีไฮไลต์'));
    wrap.appendChild(this.swatchGrid(HIGHLIGHTS, current, (c: string) => e.chain().focus().setHighlight({ color: c }).run(), 7));
    wrap.appendChild(this.el('div', 'oict-divider'));
    wrap.appendChild(this.button('oict-item', `<span class="oict-check"></span><span class="oict-icon">${svg('none')}</span><span class="oict-label">ไม่มีสี</span>`,
      () => { e.chain().focus().unsetHighlight().run(); this.closePopover(); }));
    return wrap;
  }

  /** Accessibility: the SharePoint sub menu has a single entry (Text language), so show its list directly. */
  private accessibilityPanel(): HTMLElement {
    return this.languagePanel();
  }

  private languagePanel(): HTMLElement {
    const e = this.editor;
    const current = (e.getAttributes('textLang').lang as string) || '';
    const wrap = this.el('div', 'oict-menu oict-lang');
    wrap.appendChild(this.el('div', 'oict-section', 'ภาษาของข้อความ'));
    wrap.appendChild(this.menuItem({ label: 'เอาภาษาออก', enabled: () => !!current, run: () => e.chain().focus().unsetTextLang().run() }));
    wrap.appendChild(this.el('div', 'oict-divider'));
    for (const [code, name] of LANGUAGES) {
      wrap.appendChild(this.menuItem({ label: name, checked: () => current === code, run: () => e.chain().focus().setTextLang(code).run() }));
    }
    return wrap;
  }

  private alignItems(): HTMLElement[] {
    const e = this.editor;
    const rows: Array<[string, string, string]> = [
      ['left', 'ชิดซ้าย', 'alignLeft'], ['center', 'กึ่งกลาง', 'alignCenter'],
      ['right', 'ชิดขวา', 'alignRight'], ['justify', 'เต็มแนว', 'justify']];
    const active = rows.find(r => e.isActive({ textAlign: r[0] }))?.[0] || 'left';
    return rows.map(([value, label, icon]) => this.menuItem({
      label, icon, checked: () => active === value, run: () => e.chain().focus().setTextAlign(value).run()
    }));
  }

  private alignPanel(): HTMLElement {
    const wrap = this.el('div', 'oict-menu');
    this.alignItems().forEach(i => wrap.appendChild(i));
    return wrap;
  }

  private quotePanel(): HTMLElement {
    const e = this.editor;
    const current = e.isActive('blockquote') ? (e.getAttributes('blockquote').quoteStyle as string || 'default') : '';
    const apply = (style: string | null): (() => void) => (): void => {
      const c = e.chain().focus();
      if (!e.isActive('blockquote')) { c.setParagraph().setNoSpacing(false).setBlockquote(); }
      c.updateAttributes('blockquote', { quoteStyle: style }).run();
    };
    const styles: Array<[string | null, string, string]> = [
      [null, 'ธรรมดา', 'quote'], ['intense', 'เน้น', 'intense'], ['boxed', 'มีกรอบ', 'boxed'],
      ['side', 'เส้นขอบด้านข้าง', 'side'], ['icon', 'ไอคอนคำพูด', 'quoteIcon']];
    return this.group('', [
      this.group('รูปแบบคำพูด', styles.map(([id, label, icon]) => this.menuItem({
        label, icon, checked: () => current === (id || 'default'), run: apply(id)
      }))),
      this.el('div', 'oict-divider'),
      this.group('การจัดแนว', this.alignItems().slice(0, 3))
    ]);
  }

  private bulletPanel(): HTMLElement {
    const e = this.editor;
    const current = e.isActive('bulletList') ? (e.getAttributes('bulletList').listStyle as string || 'disc') : '';
    const apply = (style: string): (() => void) => (): void => {
      const c = e.chain().focus();
      if (!e.isActive('bulletList')) { c.toggleBulletList(); }
      c.updateAttributes('bulletList', { listStyle: style === 'disc' ? null : style }).run();
    };
    return this.group('', [
      this.group('ไลบรารีสัญลักษณ์', [
        this.menuItem({ label: 'จุด', icon: 'dot', checked: () => current === 'disc', run: apply('disc') }),
        this.menuItem({ label: 'วงกลม', icon: 'circle', checked: () => current === 'circle', run: apply('circle') }),
        this.menuItem({ label: 'สี่เหลี่ยม', icon: 'square', checked: () => current === 'square', run: apply('square') })
      ]),
      this.el('div', 'oict-divider'),
      this.menuItem({ label: 'ไม่มี / เอาสัญลักษณ์ออก', enabled: () => e.isActive('bulletList'), run: () => e.chain().focus().toggleBulletList().run() })
    ]);
  }

  /** Splits the ordered list before the current item so numbering restarts at 1. */
  private restartNumbering(): void {
    const { state, view } = this.editor;
    const $from = state.selection.$from;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'listItem' && $from.node(d - 1).type.name === 'orderedList') {
        const index = $from.index(d - 1);
        if (index === 0) {
          this.editor.chain().focus().updateAttributes('orderedList', { start: 1 }).run();
          return;
        }
        const pos = $from.before(d);
        const tr = state.tr.split(pos, 1);
        // The first list now closes at pos; the new list opens right after it.
        const listPos = pos + 1;
        const list = tr.doc.nodeAt(listPos);
        if (list && list.type.name === 'orderedList') {
          tr.setNodeMarkup(listPos, undefined, { ...list.attrs, start: 1 });
        }
        view.dispatch(tr);
        view.focus();
        return;
      }
    }
  }

  /** Continues numbering from the previous numbered list on the page. */
  private continueNumbering(): void {
    const { state } = this.editor;
    const $from = state.selection.$from;
    let listStart = -1;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'orderedList') { listStart = $from.before(d); break; }
    }
    if (listStart < 0) { return; }
    let next = 0;
    state.doc.descendants((node, pos) => {
      if (pos >= listStart) { return false; }
      if (node.type.name === 'orderedList') {
        next = (Number(node.attrs.start) || 1) + node.childCount;
        return false;
      }
      return true;
    });
    if (next > 0) {
      this.editor.chain().focus().updateAttributes('orderedList', { start: next }).run();
    }
  }

  private numberPanel(): HTMLElement {
    const e = this.editor;
    const inOl = e.isActive('orderedList');
    const current = inOl ? (e.getAttributes('orderedList').listStyle as string || 'decimal') : '';
    const apply = (style: string): (() => void) => (): void => {
      const c = e.chain().focus();
      if (!e.isActive('orderedList')) { c.toggleOrderedList(); }
      c.updateAttributes('orderedList', { listStyle: style === 'decimal' ? null : style }).run();
    };
    const styles: Array<[string, string]> = [
      ['decimal', 'ตัวเลข (1, 2, 3)'], ['upper-alpha', 'ตัวอักษรพิมพ์ใหญ่ (A, B, C)'], ['lower-alpha', 'ตัวอักษรพิมพ์เล็ก (a, b, c)'],
      ['upper-roman', 'เลขโรมันพิมพ์ใหญ่ (I, II, III)'], ['lower-roman', 'เลขโรมัน (i, ii, iii)']];

    const startRow = this.el('div', 'oict-start-row');
    startRow.innerHTML = `<label for="oict-start">เริ่มรายการที่</label><input id="oict-start" type="number" min="1" max="9999" />`;
    const startInput = startRow.querySelector('input') as HTMLInputElement;
    startInput.value = String(inOl ? (e.getAttributes('orderedList').start || 1) : 1);
    startInput.disabled = !inOl;
    const setBtn = this.button('oict-mini', 'ตั้งค่า', () => {
      const n = parseInt(startInput.value, 10);
      if (n >= 1 && n <= 9999) {
        e.chain().focus().updateAttributes('orderedList', { start: n }).run();
        this.closePopover();
      } else {
        startInput.focus();
      }
    });
    setBtn.disabled = !inOl;
    startInput.addEventListener('keydown', (ev: KeyboardEvent) => { if (ev.key === 'Enter') { ev.preventDefault(); setBtn.click(); } });
    startRow.appendChild(setBtn);

    return this.group('', [
      this.group('ไลบรารีลำดับเลข', styles.map(([id, label]) => this.menuItem({
        label, icon: 'numbered', checked: () => current === id, run: apply(id)
      }))),
      this.el('div', 'oict-divider'),
      this.menuItem({ label: 'เริ่มรายการใหม่', icon: 'restart', enabled: () => inOl, run: () => this.restartNumbering() }),
      this.menuItem({ label: 'ต่อจากรายการก่อนหน้า', icon: 'continue', enabled: () => inOl, run: () => this.continueNumbering() }),
      startRow,
      this.el('div', 'oict-divider'),
      this.menuItem({ label: 'ไม่มี / เอาลำดับเลขออก', enabled: () => inOl, run: () => e.chain().focus().toggleOrderedList().run() })
    ]);
  }

  private spacingPanel(): HTMLElement {
    const e = this.editor;
    const attrs = e.isActive('heading') ? e.getAttributes('heading') : e.getAttributes('paragraph');
    const current = (attrs.lineHeight as string) || '';
    return this.group('', [
      this.group('ระยะห่างระหว่างบรรทัด', LINE_HEIGHTS.map(v => this.menuItem({
        label: v, checked: () => current === v,
        run: () => e.chain().focus().setLineHeight(current === v ? undefined : v).run()
      }))),
      this.el('div', 'oict-divider'),
      this.group('ระยะห่างย่อหน้า', [
        this.menuItem({ label: 'เพิ่มระยะก่อนย่อหน้า', checked: () => !!attrs.spaceBefore, run: () => e.chain().focus().toggleSpaceBefore().run() }),
        this.menuItem({ label: 'เพิ่มระยะหลังย่อหน้า', checked: () => !!attrs.spaceAfter, run: () => e.chain().focus().toggleSpaceAfter().run() })
      ])
    ]);
  }

  private tableGridPanel(): HTMLElement {
    const e = this.editor;
    const COLS = 10;
    const ROWS = 8;
    const wrap = this.el('div', 'oict-grid-panel');
    const label = this.el('div', 'oict-section oict-grid-label', 'แทรกตาราง 1 × 1');
    const grid = this.el('div', 'oict-grid');
    grid.style.gridTemplateColumns = `repeat(${COLS}, 18px)`;
    const cells: HTMLButtonElement[] = [];
    const mark = (r: number, c: number): void => {
      label.textContent = `แทรกตาราง ${r} × ${c}`;
      cells.forEach((cell, i) => cell.classList.toggle('is-on', Math.floor(i / COLS) < r && (i % COLS) < c));
    };
    for (let r = 1; r <= ROWS; r++) {
      for (let c = 1; c <= COLS; c++) {
        const cell = this.button('oict-cell', '', () => {
          e.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: false }).run();
          this.closePopover();
        });
        cell.setAttribute('aria-label', `${r} × ${c}`);
        cell.addEventListener('mouseenter', () => mark(r, c));
        cell.addEventListener('focus', () => mark(r, c));
        cells.push(cell);
        grid.appendChild(cell);
      }
    }
    mark(1, 1);
    wrap.appendChild(label);
    wrap.appendChild(grid);
    return wrap;
  }

  private tableOpsPanel(): HTMLElement {
    const e = this.editor;
    const items: IMenuItem[] = [
      { label: 'เพิ่มแถวด้านบน', enabled: () => e.can().addRowBefore(), run: () => e.chain().focus().addRowBefore().run() },
      { label: 'เพิ่มแถวด้านล่าง', enabled: () => e.can().addRowAfter(), run: () => e.chain().focus().addRowAfter().run() },
      { label: 'เพิ่มคอลัมน์ด้านซ้าย', enabled: () => e.can().addColumnBefore(), run: () => e.chain().focus().addColumnBefore().run() },
      { label: 'เพิ่มคอลัมน์ด้านขวา', enabled: () => e.can().addColumnAfter(), run: () => e.chain().focus().addColumnAfter().run() },
      { label: 'สลับแถวหัวตาราง', enabled: () => e.can().toggleHeaderRow(), run: () => e.chain().focus().toggleHeaderRow().run() },
      { label: 'ลบแถว', enabled: () => e.can().deleteRow(), run: () => e.chain().focus().deleteRow().run() },
      { label: 'ลบคอลัมน์', enabled: () => e.can().deleteColumn(), run: () => e.chain().focus().deleteColumn().run() },
      { label: 'ลบตาราง', enabled: () => e.can().deleteTable(), run: () => e.chain().focus().deleteTable().run() }
    ];
    const wrap = this.el('div', 'oict-menu');
    items.forEach(i => wrap.appendChild(this.menuItem(i)));
    return wrap;
  }

  // ---------- image dialog ----------

  private openImagePanel(): void {
    const e = this.editor;
    const panel = this.el('div', '');
    panel.innerHTML = `
      <h3>แทรกรูปภาพ</h3>
      <label for="oict-img-src">ที่อยู่รูปภาพ</label>
      <input id="oict-img-src" type="text" autocomplete="off" placeholder="https://… หรือ /sites/…/SiteAssets/รูป.png" />
      <div class="oict-hint" style="margin-left:0">อัปโหลดรูปไว้ใน Site Assets ของไซต์ แล้วคัดลอกลิงก์ของรูปมาวาง</div>
      <label for="oict-img-alt">ข้อความแทนรูป (สำหรับโปรแกรมอ่านหน้าจอ)</label>
      <input id="oict-img-alt" type="text" autocomplete="off" />
      <label for="oict-img-width">ความกว้าง</label>
      <select id="oict-img-width" class="oict-field">
        <option value="">ขนาดจริง (ไม่เกินความกว้างของ web part)</option>
        <option value="25%">25%</option><option value="50%">50%</option><option value="75%">75%</option><option value="100%">100%</option>
      </select>
      <div class="oict-err" role="alert" hidden></div>
      <div class="oict-actions">
        <button type="button" class="oict-primary" data-act="save">แทรก</button>
        <button type="button" data-act="cancel">ยกเลิก</button>
      </div>`;
    const src = panel.querySelector('#oict-img-src') as HTMLInputElement;
    const alt = panel.querySelector('#oict-img-alt') as HTMLInputElement;
    const width = panel.querySelector('#oict-img-width') as HTMLSelectElement;
    const err = panel.querySelector('.oict-err') as HTMLDivElement;
    src.addEventListener('input', () => { err.hidden = true; });
    const save = (): void => {
      const value = src.value.trim();
      if (!isSafeImageSrc(value)) {
        err.textContent = 'ที่อยู่รูปต้องขึ้นต้นด้วย https://, http:// หรือ / และไม่มีช่องว่าง';
        err.hidden = false;
        src.focus();
        return;
      }
      e.chain().focus().setImage({ src: value, alt: alt.value.trim() || undefined }).run();
      if (width.value) {
        e.chain().updateAttributes('image', { width: width.value }).run();
      }
      this.closePopover();
    };
    panel.addEventListener('click', (ev: MouseEvent) => {
      const act = (ev.target as HTMLElement).getAttribute('data-act');
      if (act === 'save') { save(); }
      if (act === 'cancel') { this.closePopover(); e.commands.focus(); }
    });
    panel.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Enter' && (ev.target as HTMLElement).tagName === 'INPUT') { ev.preventDefault(); save(); }
    });
    this.openPopover(this.moreBtn, panel, 'oict-link', true);
    src.focus();
  }

  // ---------- link dialog (laid out like the SharePoint Text "Insert link" dialog) ----------

  public openLinkPanel(): void {
    const e = this.editor;
    this.closePopover();
    this.syncSelectionFromDom();
    if (e.isActive('link')) {
      e.chain().extendMarkRange('link').run();
    }
    const { from, to } = e.state.selection;
    this.linkRange = { from, to };
    const current = e.isActive('link') ? (e.getAttributes('link') as { href?: string; target?: string }) : {};
    const selectedText = e.state.doc.textBetween(from, to, ' ');
    const href = current.href || '';
    const search = this.options.searchPages;
    const doc = this.root.ownerDocument;

    const backdrop = doc.createElement('div');
    backdrop.className = 'oict-ld-backdrop';
    backdrop.innerHTML = `
      <div class="oict-ld" role="dialog" aria-modal="true" aria-labelledby="oict-ld-title">
        <div class="oict-ld-head"><h3 id="oict-ld-title">${href ? 'แก้ไขลิงก์' : 'แทรกลิงก์'}</h3>
          <button type="button" class="oict-ld-x" data-act="cancel" aria-label="ปิด">✕</button></div>
        <label for="oict-addr">ที่อยู่</label>
        <input id="oict-addr" type="text" autocomplete="off" placeholder="https://" />
        <label for="oict-text">ข้อความที่จะแสดง</label>
        <input id="oict-text" type="text" autocomplete="off" />
        ${search ? `
        <label for="oict-search" class="oict-ld-gap">ค้นหา</label>
        <input id="oict-search" type="search" autocomplete="off" placeholder="พิมพ์คำค้นเพื่อค้นหาหน้าในไซต์นี้" />
        <div class="oict-ld-listhead" id="oict-ld-listhead">หน้าล่าสุดในไซต์นี้</div>
        <div class="oict-ld-list"><table aria-labelledby="oict-ld-listhead"><thead><tr><th>ชื่อ</th><th>แก้ไขล่าสุด</th></tr></thead><tbody></tbody></table>
          <div class="oict-ld-status" role="status"></div></div>` : ''}
        <label class="oict-toggle oict-ld-gap"><input id="oict-chrome" type="checkbox" role="switch" /><span class="oict-switch" aria-hidden="true"></span>เปิดด้วย Chrome</label>
        <div class="oict-ld-hint">ใส่ nasarut-inchrome-chrome: หน้าลิงก์ให้อัตโนมัติ</div>
        <label class="oict-toggle"><input id="oict-newtab" type="checkbox" role="switch" /><span class="oict-switch" aria-hidden="true"></span>เปิดลิงก์ในแท็บใหม่</label>
        <div class="oict-err" role="alert" hidden></div>
        <div class="oict-ld-actions">
          ${href ? '<button type="button" class="oict-ld-remove" data-act="remove">เอาลิงก์ออก</button>' : ''}
          <button type="button" class="oict-primary" data-act="save" disabled>บันทึก</button>
          <button type="button" data-act="cancel">ยกเลิก</button>
        </div>
      </div>`;
    doc.body.appendChild(backdrop);

    const q = <T extends Element>(sel: string): T => backdrop.querySelector(sel) as T;
    const addr = q<HTMLInputElement>('#oict-addr');
    const text = q<HTMLInputElement>('#oict-text');
    const chrome = q<HTMLInputElement>('#oict-chrome');
    const newTab = q<HTMLInputElement>('#oict-newtab');
    const err = q<HTMLDivElement>('.oict-err');
    const saveBtn = q<HTMLButtonElement>('[data-act="save"]');

    addr.value = stripChrome(href);
    text.value = selectedText;
    chrome.checked = isChromeHref(href);
    newTab.checked = current.target === '_blank';
    let autoText = '';
    const syncSave = (): void => { saveBtn.disabled = !addr.value.trim(); };
    syncSave();
    addr.addEventListener('input', () => { err.hidden = true; syncSave(); });
    text.addEventListener('input', () => { err.hidden = true; });
    chrome.addEventListener('change', () => { err.hidden = true; });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    function close(restoreFocus: boolean): void {
      self.closeDialog = undefined;
      doc.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      if (restoreFocus) { e.commands.focus(); }
    }
    function onKey(ev: KeyboardEvent): void {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(true); }
    }
    doc.addEventListener('keydown', onKey, true);
    this.closeDialog = () => close(false);

    const save = (): void => {
      const result = buildHref(addr.value, chrome.checked);
      if (!result.ok || !result.href) {
        err.textContent = result.error || 'ลิงก์ไม่ถูกต้อง';
        err.hidden = false;
        addr.focus();
        return;
      }
      close(false);
      this.applyLink(result.href, newTab.checked ? '_blank' : null, text.value, selectedText);
    };

    backdrop.addEventListener('click', (ev: MouseEvent) => {
      const act = (ev.target as HTMLElement).closest?.('[data-act]')?.getAttribute('data-act');
      if (act === 'save') { save(); }
      if (act === 'cancel') { close(true); }
      if (act === 'remove' && this.linkRange) {
        close(false);
        e.chain().focus().setTextSelection(this.linkRange).unsetLink().run();
      }
    });
    backdrop.addEventListener('mousedown', (ev: MouseEvent) => { if (ev.target === backdrop) { close(true); } });
    backdrop.addEventListener('keydown', (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (ev.key === 'Enter' && t.tagName === 'INPUT' && t.id !== 'oict-search' && (t as HTMLInputElement).type === 'text') {
        ev.preventDefault();
        if (!saveBtn.disabled) { save(); }
      }
    });

    if (search) {
      const input = q<HTMLInputElement>('#oict-search');
      const head = q<HTMLDivElement>('.oict-ld-listhead');
      const body = q<HTMLTableSectionElement>('.oict-ld-list tbody');
      const status = q<HTMLDivElement>('.oict-ld-status');
      let seq = 0;
      let timer: number | undefined;
      const formatDate = (iso: string): string => {
        const d = new Date(iso);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      };
      const load = (term: string): void => {
        const mine = ++seq;
        head.textContent = term ? 'ผลการค้นหา' : 'หน้าล่าสุดในไซต์นี้';
        status.textContent = 'กำลังโหลด…';
        body.replaceChildren();
        search(term).then((pages: ISitePage[]) => {
          if (mine !== seq) { return; }
          status.textContent = pages.length ? '' : (term ? 'ไม่พบหน้าที่ตรงกับคำค้น' : 'ยังไม่มีหน้าในไซต์นี้');
          for (const page of pages) {
            const tr = doc.createElement('tr');
            tr.tabIndex = 0;
            tr.innerHTML = `<td class="oict-ld-title"></td><td class="oict-ld-date"></td>`;
            (tr.firstElementChild as HTMLElement).textContent = page.title;
            (tr.lastElementChild as HTMLElement).textContent = formatDate(page.modified);
            tr.title = page.url;
            const pick = (): void => {
              body.querySelectorAll('tr').forEach(r => r.classList.remove('is-selected'));
              tr.classList.add('is-selected');
              addr.value = page.url;
              if (!text.value.trim() || text.value === autoText) {
                text.value = page.title;
                autoText = page.title;
              }
              err.hidden = true;
              syncSave();
            };
            tr.addEventListener('click', pick);
            tr.addEventListener('keydown', (ev: KeyboardEvent) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
            body.appendChild(tr);
          }
        }).catch(() => {
          if (mine === seq) { status.textContent = 'โหลดรายการหน้าไม่ได้ พิมพ์ที่อยู่ลิงก์เองได้'; }
        });
      };
      input.addEventListener('input', () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => load(input.value.trim()), 300);
      });
      load('');
    }

    addr.focus();
    addr.select();
  }

  /** A click followed very quickly by Ctrl+K can reach us before the editor has read the new selection. */
  private syncSelectionFromDom(): void {
    const view = this.editor.view;
    const sel = this.root.ownerDocument.getSelection();
    if (!sel || !sel.rangeCount || !sel.anchorNode || !sel.focusNode ||
        !view.dom.contains(sel.anchorNode) || !view.dom.contains(sel.focusNode)) {
      return;
    }
    try {
      const a = view.posAtDOM(sel.anchorNode, sel.anchorOffset);
      const b = view.posAtDOM(sel.focusNode, sel.focusOffset);
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      const current = this.editor.state.selection;
      if (current.from !== from || current.to !== to) {
        this.editor.commands.setTextSelection({ from, to });
      }
    } catch {
      // Keep the editor's own selection.
    }
  }

  private applyLink(href: string, target: string | null, newText: string, oldText: string): void {
    const e = this.editor;
    const range = this.linkRange || e.state.selection;
    const attrs = { href, target };
    const label = newText.trim();

    if (range.from !== range.to && (label === '' || label === oldText)) {
      e.chain().focus().setTextSelection(range).extendMarkRange('link').setLink(attrs).run();
      return;
    }

    // New text: keep the formatting of the replaced text (bold, colour, size ...).
    const marks = e.state.doc.resolve(range.from + (range.from !== range.to ? 1 : 0)).marks()
      .filter(m => m.type.name !== 'link')
      .map(m => ({ type: m.type.name, attrs: m.attrs }));
    marks.push({ type: 'link', attrs });
    e.chain().focus()
      .insertContentAt(range, { type: 'text', text: label || stripChrome(href), marks })
      .unsetMark('link')
      .run();
  }
}

/** Read view used when the page is not in edit mode. */
export function renderView(host: HTMLElement, html: string): void {
  ensureStyles(host.ownerDocument);
  const view = host.ownerDocument.createElement('div');
  view.className = 'oict oict-content';
  view.innerHTML = sanitizeHtml(html);
  host.replaceChildren(view);
}
