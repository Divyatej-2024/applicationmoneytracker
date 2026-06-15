# Personal Money Tracker

A static personal money tracker built with HTML, CSS, and JavaScript. Track income, expenses, savings goals, and weekly progress with persistent local storage. The app works offline after initial load and includes PWA support.

## Features

- **Dashboard** – Summary of total income, expenses, and current balance
- **Savings Goal Tracking** – Monitor progress toward a savings target with deadline
- **Weekly Progress** – Track weekly income, expenses, and net against a weekly target
- **Monthly Breakdown** – Visual breakdown by month and category
- **Transaction Management** – Add, edit, and delete transactions with categories and descriptions
- **Settings & Goals** – Customize savings goals, weekly targets, and notification preferences
- **Notifications** – Optional reminders for financial tracking (requires browser permission)
- **PWA Support** – Install as a standalone app on desktop and mobile devices
- **Offline Support** – Full functionality after initial page load using Service Worker

## Project Structure

```
personal-money-tracker/
  ├── index.html           # Main HTML entry point
  ├── script.js            # Application logic
  ├── styles.css           # Styling
  ├── service-worker.js    # Service Worker for offline support
  ├── manifest.json        # PWA manifest
  ├── icon.svg             # App icon
  ├── package.json         # Project metadata
  └── vercel.json          # Vercel deployment config
```

## Setup & Running Locally

### Option 1: Direct Browser
Simply open `index.html` in your browser for full functionality. Data persists in `localStorage`.

### Option 2: Local HTTP Server (Recommended)
To ensure proper Service Worker registration, serve over HTTP:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server is installed)
npx http-server
```
Then open `http://localhost:8000` in your browser.

## Data Storage & Privacy

- All data is stored in the browser's `localStorage`
- No data is sent to any server
- Data persists between browser sessions
- Clear your browser's storage to delete all data
- Use the export/backup feature to create manual backups

## Deployment

### GitHub Pages
1. Push to GitHub and enable GitHub Pages in repository settings
2. Select `main` branch as the source
3. Your tracker will be available at `https://username.github.io/applicationmoneytracker`

### Vercel
1. Push to GitHub
2. Import the repo into Vercel
3. Default settings work out of the box
4. The `vercel.json` file handles client-side routing

### Manual Hosting
Simply copy all files to any static hosting service (Netlify, AWS S3, etc.)

## Browser Support

- All modern browsers with localStorage and Service Worker support
- Chrome/Edge 40+
- Firefox 25+
- Safari 10+ (PWA support varies)

## Notes

- The app requires JavaScript to be enabled
- Push notifications require explicit user permission
- Data is cleared if browser cache is cleared manually
- For the best experience, use the app as an installed PWA on mobile devices
