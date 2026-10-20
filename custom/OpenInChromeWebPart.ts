import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

export interface IOpenInChromeWebPartProps {
  linkText: string;
  linkAddress: string;
}

/** Simple SharePoint link that invokes the approved Windows custom URI handler. */
export default class OpenInChromeWebPart
  extends BaseClientSideWebPart<IOpenInChromeWebPartProps> {

  public render(): void {
    const text = (this.properties.linkText || 'Audit Trail Report').trim();
    const address = (this.properties.linkAddress || '').trim();

    this.domElement.replaceChildren();

    // Don't expose an invalid or partially configured hyperlink.
    if (!/^nasarut-inchrome-chrome:https?:\/\/[^\s<>"']+$/i.test(address)) {
      const placeholder = document.createElement('span');
      placeholder.textContent = this.displayMode === 2
        ? 'Edit this Web Part to set a nasarut-inchrome-chrome: URL'
        : '';
      this.domElement.appendChild(placeholder);
      return;
    }

    const link = document.createElement('a');
    link.href = address;
    link.setAttribute('data-interception', 'off');
    link.textContent = text || 'Open in Chrome';
    link.style.color = '#0078d4';
    link.style.textDecoration = 'underline';
    link.style.cursor = 'pointer';
    this.domElement.appendChild(link);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'Nasarut-inchrome' },
        groups: [{
          groupName: 'Link settings',
          groupFields: [
            PropertyPaneTextField('linkText', {
              label: 'Text to display',
              placeholder: 'Audit Trail Report'
            }),
            PropertyPaneTextField('linkAddress', {
              label: 'Address',
              placeholder: 'nasarut-inchrome-chrome:https://example.com'
            })
          ]
        }]
      }]
    };
  }
}
