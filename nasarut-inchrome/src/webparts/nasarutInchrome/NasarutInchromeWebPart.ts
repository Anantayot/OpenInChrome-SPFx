import { DisplayMode, Version } from '@microsoft/sp-core-library';
import type { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ThemeProvider, type IReadonlyTheme } from '@microsoft/sp-component-base';

import { RichTextEditor, renderView, type ISitePage } from './editor/RichTextEditor';
import { sanitizeHtml } from './editor/sanitize';

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
  }

  private applyTheme(theme: IReadonlyTheme | undefined): void {
    const link = theme?.semanticColors?.link;
    if (link) {
      this.domElement.style.setProperty('--oict-link', link);
    }
    const p = theme?.palette;
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
