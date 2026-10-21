# Distribution packages

| File | Description | App/solution ID | Version |
| --- | --- | --- | --- |
| `Nasarut-inchrome.sppkg` | **Current package**, Text (Open in Chrome) web part | `85c40296-c6c5-4c19-894a-cddf803fbcb2` | `1.0.0.0` |
| `legacy/Nasarut-inchrome-link-v1.0.2.0.sppkg` | Archived older, simple-link web part | `968f0272-ec25-46a0-a351-6f35299b8d24` | `1.0.2.0` |

Both packages are retained; they have **different SharePoint solution IDs**.
Renaming an .sppkg file does **not** change its internal SharePoint app identity or web part name.

Sources (unchanged):
- New text web part: `open-in-chrome-text/`
- Older hyperlink web part: `custom/OpenInChromeWebPart.ts`

Build workflows:
- `.github/workflows/build-open-in-chrome-text.yml` creates the current `dist/Nasarut-inchrome.sppkg`.
- `.github/workflows/build-spfx.yml` places the older package in `dist/legacy/`.
