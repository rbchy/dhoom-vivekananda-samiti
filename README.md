# Dhoom Vivekananda Samiti — React website

A responsive, multilingual website built with React and Vite for Dhoom Vivekananda Samiti and the institutions it runs:

- Sree Sree Dokkhin Kalika Mandir
- Sree Sree Durga Mandir
- Dhoom Vivekananda Samiti Community Clinic
- Sree Sree Shiv Mandir
- Sree Sree Ramakrishna Mandir
- Sree Sree GouriShankar Funeral Temple

The organisation name and this list live in `src/i18n-org.js`.

## Requirements
- Node.js 20.19+ or 22.12+ recommended
- npm (included with Node.js)
- Internet connection for Google Fonts and the temporary hero background image

## Run on macOS
1. Download and unzip `ramakrishna-temple-dhoom.zip`.
2. Open Terminal.
3. Change into the project folder. Example:
   ```bash
   cd ~/Downloads/ramakrishna-temple-dhoom
   ```
   If you unzipped it elsewhere, use that folder path instead.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the local development server:
   ```bash
   npm run dev
   ```
6. Open the local URL shown in Terminal, usually `http://localhost:5173`.
7. Stop the server by pressing `Control + C` in Terminal.

## Build for production
```bash
npm run build
npm run preview
```
The production files are created in the `dist` folder.

## Add actual temple photographs
1. Create `public/images` in the project folder.
2. Copy only photographs you have permission to publish into that folder, for example:
   - `temple-front.jpg`
   - `temple-prayer-hall.jpg`
   - `temple-festival.jpg`
   - `temple-garden.jpg`
3. Replace the `PhotoPlaceholder` components in `src/main.jsx` with image elements. Example:
   ```jsx
   <img className="temple-photo" src="/images/temple-front.jpg" alt="Front view of Ramakrishna Temple, Dhoom" />
   ```
4. Add this CSS to `src/styles.css`:
   ```css
   .temple-photo {
     display: block;
     width: 100%;
     height: 320px;
     object-fit: cover;
     border: 1px solid #d7c6ad;
   }
   ```
5. Replace the temporary hero background URL in `src/styles.css` with your approved temple photo:
   ```css
   background: linear-gradient(90deg, rgba(38,22,18,.78), rgba(49,29,21,.25)),
     url('/images/temple-front.jpg') center/cover;
   ```
   Keep a fallback background color after the image declaration if desired.

## Before publishing
The following information is deliberately not invented:
- Official temple history and affiliation
- Exact postal address and map location
- Worship and visitor hours
- Phone number and email
- Festival dates and announcements
- Official donation method

Replace each placeholder only after confirmation from the temple committee. The donation button is intentionally disabled until an official method is supplied. The sample hero background is temporary and should be replaced with an approved temple photograph.

## Main files
- `src/main.jsx` — page content, English/Bengali text, language toggle and responsive navigation
- `src/styles.css` — colors, layout and responsive styles
- `index.html` — page title and metadata
- `package.json` — scripts and dependencies

## Phone apps (Android and iPhone) — Capacitor

The same website runs as a phone app. Files: `capacitor.config.json` (app name and id), `assets/` (app icon and splash screen).

One-time setup (in Terminal, inside this folder):
```bash
npm install @capacitor/core @capacitor/android @capacitor/ios
npm install -D @capacitor/cli
npm run build
npx cap add android
npx cap add ios
npm run app:icons
```

Every time the website changes:
```bash
npm run app:android   # builds, copies into the app, opens Android Studio — press ▶ Run
npm run app:ios       # builds, copies into the app, opens Xcode — press ▶ Run
```

Installable website (no app store): open the website on the phone →
iPhone Safari: Share → "Add to Home Screen"; Android Chrome: ⋮ → "Install app".

## Staff roles and approvals
Run `supabase/roles-and-approvals.sql` (after `security-hardening.sql`). Three roles:

| Role | Can do | Approves |
|---|---|---|
| Main Admin (`admin`) | Edit website content directly; view accounts; manage staff roles | Secretary's content requests |
| Accounts Admin (`accounts_admin`) | Edit donations, subscriptions, income, expenses, account heads directly | Secretary's accounts requests |
| Secretary (`secretary`) | Send add / edit / delete requests for content and accounts | — |

Nobody can approve their own request. Admin pages write through `db('table')` from `src/lib/staff.js`,
which turns a secretary's change into a row in `pending_changes`.
To add a person: Supabase → Authentication → Add user, then Dashboard → Staff & Roles.
