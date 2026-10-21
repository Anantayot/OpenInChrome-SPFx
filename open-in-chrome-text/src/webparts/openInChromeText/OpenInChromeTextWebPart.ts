import { DisplayMode, Version } from '@microsoft/sp-core-library';
import type { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import { RichTextEditor, renderView } from './editor/RichTextEditor';
import { sanitizeHtml } from './editor/sanitize';

export interface IOpenInChromeTextWebPartProps {
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
export default class OpenInChromeTextWebPart extends BaseClientSideWebPart<IOpenInChromeTextWebPartProps> {

  private editor: RichTextEditor | undefined;

  public render(): void {
    if (this.displayMode === DisplayMode.Edit) {
      if (!this.editor) {
        this.editor = new RichTextEditor(this.domElement, {
          html: this.properties.html || '',
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
    const link = theme?.semanticColors?.link;
    if (link) {
      this.domElement.style.setProperty('--oict-link', link);
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
