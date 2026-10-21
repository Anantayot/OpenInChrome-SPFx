import { DisplayMode, Version } from '@microsoft/sp-core-library';
import type { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ThemeProvider, type IReadonlyTheme } from '@microsoft/sp-component-base';

import { RichTextEditor, renderView, type ISitePage } from './editor/RichTextEditor';
import { sanitizeHtml } from './editor/sanitize';
import { refreshTextTypography } from './editor/typography';

export interface INasarutInchromeWebPartProps {
  html: string;
}

/**
 * Text web part that edits in place like the SharePoint Text web part, with an
 * extra "Open with Chrome" option in the link dialog.
 *
 * The HTML is stored as a plain web part property (not isHtmlString), so
 * SharePoint does not strip the nasarut-inchrome-chrome: links. It is always
 * sanitized before it is saved or shown.
 */
export default class NasarutInchromeWebPart extends BaseClientSideWebPart<INasarutInchromeWebPartProps> {

  private editor: RichTextEditor | undefined;
  private themeColors: string[] | undefined;

  protected onInit(): Promise<void> {
    // Read the site theme once so the colour picker can show the site's own theme colours.
    try {
      const provider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
      this.applyTheme(provider.tryGetTheme());
    } catch {
      // Theme not available (e.g. workbench): defaults are used.
    }
    return Promise.resolve();
  }

  public render(): void {
    if (this.displayMode === DisplayMode.Edit) {
      if (!this.editor) {
        this.editor = new RichTextEditor(this.domElement, {
          html: this.properties.html || '',
          themeColors: this.themeColors,
          searchPages: (query: string) => this.searchPages(query),
          uploadImage: (file: File) => this.uploadImage(file),
          onChange: (html: string) => { this.properties.html = html; }
        });
      }
      return;
    }

    this.destroyEditor();
    renderView(this.domElement, this.properties.html || '');
  }

  protected onDisplayModeChanged(oldDisplayMode: DisplayMode): void {
    this.destroyEditor();
    this.render();
  }

  protected onThemeChanged(theme: IReadonlyTheme | undefined): void {
    this.applyTheme(theme);
    refreshTextTypography(this.domElement.ownerDocument);
  }

  /**
   * Colours of the site theme - and of the section's own variant when the section has a background -
   * as CSS variables, so text, quotes, tables and links follow the theme (also on dark sections).
   */
  private applyTheme(theme: IReadonlyTheme | undefined): void {
    const style = this.domElement.style;
    const sc = theme?.semanticColors;
    const pal = theme?.palette;
    const vars: { [name: string]: string | undefined } = {
      '--oict-link': sc?.link,
      '--oict-theme': pal?.themePrimary,
      '--oict-theme-light': pal?.themeLight,
      '--oict-theme-lighter': pal?.themeLighterAlt,
      '--oict-theme-text': sc?.primaryButtonText,
      '--oict-border': sc?.bodyDivider || pal?.neutralQuaternaryAlt,
      '--oict-subtle': sc?.bodySubtext,
      '--oict-neutral-bg': pal?.neutralLighter,
      '--oict-neutral-bg2': pal?.neutralLighterAlt
    };
    Object.keys(vars).forEach(name => {
      const v = vars[name];
      if (v && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(v)) { style.setProperty(name, v); }
    });
    const p = pal;
    if (p && p.themeDarker && p.themePrimary) {
      this.themeColors = [p.themeDarker, p.themeDark, p.themeDarkAlt, p.themePrimary, p.themeSecondary, p.themeTertiary]
        .filter((c): c is string => !!c);
    }
  }

  protected onDispose(): void {
    this.destroyEditor();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'แก้ไขข้อความได้โดยตรงบนหน้าเพจ ใช้ปุ่มลิงก์ในแถบเครื่องมือเพื่อเลือกเปิดด้วย Chrome' },
        groups: []
      }]
    };
  }

  /**
   * Pages of this site for the Insert link dialog (read-only, same site, signed-in user's rights).
   * Uses the site's "SitePages" library, whose address is the same in every site language.
   */
  private async searchPages(query: string): Promise<ISitePage[]> {
    const web = this.context.pageContext.web;
    const listPath = `'${web.serverRelativeUrl.replace(/\/$/, '').replace(/'/g, "''")}/SitePages'`;
    const term = query.trim().slice(0, 100).replace(/'/g, "''");
    const params = [
      `@u=${encodeURIComponent(listPath)}`,
      '$select=Title,FileRef,FileLeafRef,Modified',
      `$orderby=${encodeURIComponent('Modified desc')}`,
      '$top=20'
    ];
    if (term) {
      params.push(`$filter=${encodeURIComponent(`substringof('${term}',Title)`)}`);
    }
    const response = await fetch(`${web.absoluteUrl}/_api/web/GetList(@u)/items?${params.join('&')}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json;odata=nometadata' }
    });
    if (!response.ok) {
      throw new Error(`Pages request failed: ${response.status}`);
    }
    const data: { value?: Array<{ Title?: string; FileRef?: string; FileLeafRef?: string; Modified?: string }> } = await response.json();
    const origin = new URL(web.absoluteUrl).origin;
    return (data.value || [])
      .filter(i => !!i.FileRef)
      .map(i => ({
        title: i.Title || (i.FileLeafRef || '').replace(/\.aspx$/i, ''),
        url: origin + encodeURI(i.FileRef as string),
        modified: i.Modified || ''
      }));
  }

  /**
   * Uploads a pasted or dropped image to the site's Site Assets library (folder "Nasarut-inchrome"),
   * like the Text web part does, and returns its address. Uses the signed-in user's own rights.
   */
  private async uploadImage(file: File): Promise<string> {
    const web = this.context.pageContext.web;
    const base = web.absoluteUrl.replace(/\/$/, '');
    const json = 'application/json;odata=nometadata';
    const digestRes = await fetch(`${base}/_api/contextinfo`, { method: 'POST', credentials: 'same-origin', headers: { Accept: json } });
    if (!digestRes.ok) { throw new Error(`contextinfo ${digestRes.status}`); }
    const digest = ((await digestRes.json()) as { FormDigestValue?: string }).FormDigestValue || '';
    const post = (url: string, body?: BodyInit, contentType?: string): Promise<Response> => fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: json, 'X-RequestDigest': digest, ...(contentType ? { 'Content-Type': contentType } : {}) },
      body
    });
    const lib = await post(`${base}/_api/web/lists/EnsureSiteAssetsLibrary`);
    if (!lib.ok) { throw new Error(`ไม่พบหรือสร้าง Site Assets ไม่ได้ (${lib.status})`); }
    const libId = ((await lib.json()) as { Id?: string }).Id || '';
    const rootRes = await fetch(`${base}/_api/web/lists(guid'${encodeURIComponent(libId)}')/RootFolder?$select=ServerRelativeUrl`,
      { credentials: 'same-origin', headers: { Accept: json } });
    if (!rootRes.ok) { throw new Error(`Site Assets ${rootRes.status}`); }
    const rootUrl = ((await rootRes.json()) as { ServerRelativeUrl?: string }).ServerRelativeUrl || '';
    const folder = `${rootUrl.replace(/\/$/, '')}/Nasarut-inchrome`;
    const q = (v: string): string => encodeURIComponent(v.replace(/'/g, "''"));
    await post(`${base}/_api/web/folders/add('${q(folder)}')`).catch(() => undefined);
    const ext = (/^image\/(png|gif|webp|bmp)$/i.exec(file.type) || ['', 'jpg'])[1].toLowerCase();
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const name = `image-${stamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await post(`${base}/_api/web/GetFolderByServerRelativeUrl('${q(folder)}')/Files/add(url='${q(name)}',overwrite=false)`,
      await file.arrayBuffer(), 'application/octet-stream');
    if (!res.ok) { throw new Error(res.status === 403 ? 'ไม่มีสิทธิ์อัปโหลดไฟล์เข้า Site Assets' : `อัปโหลดไม่ได้ (${res.status})`); }
    const url = ((await res.json()) as { ServerRelativeUrl?: string }).ServerRelativeUrl || '';
    return encodeURI(url);
  }

  private destroyEditor(): void {
    if (this.editor) {
      this.properties.html = this.editor.getHtml();
      this.editor.destroy();
      this.editor = undefined;
    }
  }
}

// Exported for tests.
export { sanitizeHtml };
