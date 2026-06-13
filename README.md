# Personal Job Application Tracker

A React + Vite app for tracking UK cyber security graduate job applications. It stores application data in `localStorage` and works offline after initial load.

## Features

- Dashboard summary with applications, interviews, offers, rejections, and success rate
- Add, edit, and delete job applications
- Search, filter, and sort applications by status, company, type, and sponsorship
- Application details with timeline and notes
- Follow-up tracker with overdue reminders
- Statistics dashboard for sources, companies, and conversion rates
- Export to CSV and Excel, plus backup/restore JSON

## Folder Structure

```
personal-money-tracker/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    pages/
    lib/
    data/
    styles.css
  public/
```

## Run Locally

1. Open a terminal in `c:\Users\pdivy\personal-money-tracker`
2. Install dependencies once:
   - `npm install`
3. Start the dev server:
   - `npm run dev`
   - or `npm start`
4. Open the local URL shown by Vite, for example:
   - `http://localhost:5173`

> Do not open `index.html` directly using `file://`.
> The app must be served over `http://` by Vite.

## Build and Preview

- Build production files: `npm run build`
- Preview production build: `npm run preview`

## GitHub Compatibility

- Add this project to a Git repo with `git init`
- Commit source files and push to GitHub
- Use GitHub Actions via `.github/workflows/deploy.yml` to verify builds on every push

If you want GitHub Pages hosting, use `npm run build` and deploy the `dist/` folder.

## Notes

- Data is saved permanently in the browser's `localStorage`
- The app works offline once loaded from the dev or preview server
- Use export / backup features to move data between browsers
