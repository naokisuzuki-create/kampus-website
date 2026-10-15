# KaMPUS management: Google Sheets + GAS
Google Sheet: https://docs.google.com/spreadsheets/d/1LQVhfnFlMm4Uyn0OtluqpkR39G94ar5Je6VApdpuf-E/edit

This is the source for the future read-only public website feed.

- `幹事・監事`: sort_order, role, name, affiliation, published
- `協賛企業`: sort_order, name, image_path, url, published
- `サイト設定`: key, value, note

## Deploy
1. Create a standalone Google Apps Script project.
2. Paste `Code.gs` from this folder.
3. Deploy as a web app with **Execute as: Me** and **Who has access: Anyone**.
4. Confirm the URL ending in `/exec?type=members` returns published names only.
5. The website uses local JSON until the web app URL is configured and validated.

Do not place API keys, personal email addresses, or any nonpublic data in these tabs. Public endpoint exposes the rows marked published.
