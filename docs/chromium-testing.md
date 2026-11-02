# Personal Money Tracker Chromium QA

Playwright + Chromium checks the static PWA in a local HTTP origin. The suite covers responsive layout and verifies that the web app manifest is served and contains an application name. It does not inspect, export, or modify a user's financial records.

## Local run

From the repository root, start a local server:

```bash
python -m http.server 8080
```

In another terminal:

```bash
python -m pip install -r tests/browser/requirements.txt
python -m playwright install chromium
python -m pytest -q tests/browser
```

Set `MONEYTRACKER_BASE_URL` if using another authorised local URL. Chromium is a test browser here, not a replacement for the existing PWA/service-worker architecture.
