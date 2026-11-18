<div align="center">

<a href="https://rbchy.github.io/dhoom-vivekananda-samiti/" title="Open the website"><img src="docs/banner.svg" alt="Dhoom Vivekananda Samiti — temples, community clinic and service. Website and admin system." width="100%"></a>

<!-- ============ STATUS BAR ============ -->
[![CI](https://github.com/rbchy/dhoom-vivekananda-samiti/actions/workflows/ci.yml/badge.svg)](https://github.com/rbchy/dhoom-vivekananda-samiti/actions/workflows/ci.yml)
[![Deploy](https://github.com/rbchy/dhoom-vivekananda-samiti/actions/workflows/deploy.yml/badge.svg)](https://github.com/rbchy/dhoom-vivekananda-samiti/actions/workflows/deploy.yml)
![Security tests](https://img.shields.io/badge/DB%20security%20checks-63-22c55e?style=flat-square&logo=postgresql&logoColor=white)
![Languages](https://img.shields.io/badge/UI%20languages-10-0d9488?style=flat-square&logo=googletranslate&logoColor=white)
![Roles](https://img.shields.io/badge/staff%20roles-3%20%2B%20approvals-155e75?style=flat-square)
![Status](https://img.shields.io/badge/Status-Pre--launch-f59e0b?style=flat-square)

[![Website](https://img.shields.io/badge/Website-GitHub%20Pages-0d9488?style=for-the-badge&logo=githubpages&logoColor=white)](https://rbchy.github.io/dhoom-vivekananda-samiti/)
[![Help guide](https://img.shields.io/badge/Help%20guide-বাংলা-811d29?style=for-the-badge&logo=readthedocs&logoColor=white)](docs/ADMIN-HELP.md)
[![Author](https://img.shields.io/badge/Author-rbchy-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rbchy)

</div>

---

## 📌 At a Glance

<table>
<tr>
<td width="50%" valign="top">

**🙏 What this is**

The public website and the back-office system of **Dhoom Vivekananda Samiti**, a religious and
humanitarian organisation in Dhoom, Mirsharai (Chattogram, Bangladesh), inspired by Sri Ramakrishna,
Holy Mother Sri Sarada Devi and Swami Vivekananda.

Visitors read about the temples, see worship times and festivals, browse the gallery, donate and
send messages — in **10 languages**. Committee staff run everything from an **admin dashboard**
where changes by the secretary wait for **approval** by the right admin.

> *"As many faiths, so many paths."* — Sri Ramakrishna

</td>
<td width="50%" valign="top">

**📍 Quick facts**

| | |
|---|---|
| 🏛️ **Institutions** | 6 (5 temples + community clinic) |
| 🌐 **Languages** | 10 (incl. Bangla, Arabic RTL) |
| 👥 **Staff roles** | Main Admin · Accounts Admin · Secretary |
| 🗄️ **Database** | Supabase PostgreSQL, RLS on every table |
| ✅ **CI** | build + 14 unit tests + 63 database security checks |
| 🚀 **CD** | GitHub Pages after green CI |
| 📱 **Apps** | Android / iOS via Capacitor |
| 📖 **Help** | [docs/ADMIN-HELP.md](docs/ADMIN-HELP.md) (Bangla) |

</td>
</tr>
</table>

---

## 🏛️ The Samiti and its Institutions

| Institution | What happens there |
|---|---|
| 🛕 **Sree Sree Ramakrishna Mandir** | Daily arati, Kathamrita reading, weekly worship for Thakur, Ma and Swamiji |
| 🌺 **Sree Sree Dokkhin Kalika Mandir** | Worship of Mother Dakshina Kali every Saturday and on Shyama Puja night |
| 🪔 **Sree Sree Durga Mandir** | Spring Basanti Durga Puja and worship of the Divine Mother |
| 🔱 **Sree Sree Shiv Mandir** | Monday Shiva Puja, Shravan worship and Maha Shivaratri |
| 🕯️ **Sree Sree GouriShankar Funeral Temple** | Dignified last rites and a peaceful place of farewell |
| 🩺 **Dhoom Vivekananda Samiti Community Clinic** | Medical advice, first aid and medicines for people in need |

Also: annual clothes distribution and a Gita learning centre for children.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

**🌐 Public website**

- Institutions, mission & deities, worship schedule
- Events with opening / puja / closing times
- Gallery filtered by institution and category, slideshow, lightbox
- Announcements and scrolling banner message
- **Online donation** (bKash · Nagad · Rocket · bank · card link) and **monthly subscription** sign-up
- Contact form, map, Panjika link, follow links
- **Share any event or notice** to WhatsApp, Facebook, Messenger, or copy ready-made text; shared links open the exact post
- QR code to open the site on a phone
- 10 languages, right-to-left Arabic, installable web app

</td>
<td width="50%" valign="top">

**🛠️ Admin dashboard**

- Temple content, events, gallery (photo auto-enhance), announcements, yearly event list
- Worship schedule, temple info & committee, mission & deities
- **Donations** — office entry, verify online donations, receipts
- **Monthly subscriptions** and payments
- **Income & expenditure** ledger, account heads, statements, CSV export
- Website messages
- **Approvals** — see before/after, approve or reject with a reason
- **My Requests** for the secretary, **Staff & Roles** for the main admin
- "Copy for social" text (Bangla + English) for Facebook groups, WhatsApp channels, TikTok
- **📣 Post to the Facebook Page and Instagram** in one click (main admin) — [setup](docs/SOCIAL-AUTOPOST.md)

</td>
</tr>
</table>

---

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph Visitors["👥 Visitors"]
    B1["Browser / phone"]
    APP["Android / iOS app<br/>(Capacitor)"]
  end
  subgraph Staff["🧑‍💼 Committee staff"]
    A1["Main Admin"]
    A2["Accounts Admin"]
    A3["Secretary"]
  end
  subgraph Front["⚛️ React 19 + Vite SPA"]
    PUB["Public site<br/>main.jsx · 10 languages"]
    ADM["Admin dashboard<br/>/admin/dashboard"]
    DB["db() wrapper<br/>src/lib/staff.js"]
  end
  subgraph Supa["🟩 Supabase"]
    AUTH["Auth<br/>e-mail + password"]
    PG[("PostgreSQL<br/>Row Level Security")]
    ST[("Storage<br/>event-photos")]
    FN["SQL functions<br/>approve_change · set_staff_role"]
  end
  B1 --> PUB
  APP --> PUB
  A1 & A2 & A3 --> ADM
  PUB -->|read published · send donation / message| PG
  ADM --> AUTH
  ADM --> DB
  DB -->|admins: direct write| PG
  DB -->|secretary: request| PG
  ADM -->|approve / reject| FN
  FN --> PG
  ADM -->|photos| ST
  PUB -->|photos| ST
  PUB -.->|share links| SOC(["WhatsApp · Facebook · Messenger"])
  ADM -->|📣 post| EF["Edge Function<br/>social-post"]
  EF -->|Graph API| META(["Facebook Page · Instagram"])
  EF --> PG
```

**Key ideas**

- **The database is the security boundary.** Every rule lives in PostgreSQL Row Level Security, not in the browser. The website only holds the *publishable* key.
- **One write path for all admin pages.** Pages call `db('table')` instead of `supabase.from('table')`. For admins it *is* `supabase.from`; for the secretary it turns every insert / update / delete / upsert into a row in `pending_changes`.
- **Approvals run inside the database** (`security definer` functions), so they cannot be faked from the browser and nobody can approve their own request.

---

## 👥 Roles and the Approval Workflow

| Role | Can do directly | Approves | Sees |
|---|---|---|---|
| 🛡️ **Main Admin** (`admin`) | Website content, messages, staff roles | Secretary's **content** requests | Everything; accounts **read-only** |
| 💰 **Accounts Admin** (`accounts_admin`) | Donations, subscriptions, income, expenses, account heads — no approval needed | Secretary's **accounts** requests | Accounts sections, Approvals |
| ✍️ **Secretary** (`secretary`) | Nothing directly — sends requests | — | Content + accounts sections, My Requests |

```mermaid
sequenceDiagram
  autonumber
  actor S as Secretary
  participant UI as Admin dashboard
  participant DB as PostgreSQL (RLS)
  actor A as Main / Accounts Admin
  S->>UI: Save / delete (e.g. new event, income entry)
  UI->>DB: insert into pending_changes
  Note over DB: trigger fills approver_role,<br/>requested_by, old_data
  DB-->>UI: "Sent for approval"
  A->>UI: Approvals → Details (before / after)
  alt approve
    UI->>DB: rpc approve_change(id)
    Note over DB: checks role = approver_role<br/>and approver ≠ requester,<br/>applies the change
    DB-->>S: My Requests: Approved
  else reject (reason required)
    UI->>DB: rpc reject_change(id, reason)
    DB-->>S: My Requests: Rejected + reason
  end
```

```mermaid
stateDiagram-v2
  [*] --> pending: secretary sends a request
  pending --> approved: right admin approves<br/>(change applied)
  pending --> rejected: right admin rejects<br/>(reason required)
  pending --> cancelled: secretary withdraws
  approved --> [*]
  rejected --> [*]
  cancelled --> [*]
```

| Request goes to | Tables |
|---|---|
| 🛡️ Main Admin | `events` `gallery` `announcements` `worship_schedule` `temple_highlights` `temple_content` `committee_contacts` `site_settings` `event_catalog` |
| 💰 Accounts Admin | `donations` `subscriptions` `subscription_payments` `income_entries` `expense_entries` `account_heads` |

---

## 🗄️ Data Model

```mermaid
erDiagram
  AUTH_USERS ||--o| ADMIN_PROFILES : "has role"
  ADMIN_PROFILES ||--o{ PENDING_CHANGES : "requests / reviews"
  EVENT_CATALOG ||--o{ DONATIONS : "for festival"
  EVENT_CATALOG ||--o{ INCOME_ENTRIES : "for festival"
  EVENT_CATALOG ||--o{ EXPENSE_ENTRIES : "for festival"
  SUBSCRIPTIONS ||--o{ SUBSCRIPTION_PAYMENTS : "monthly"
  ADMIN_PROFILES {
    uuid user_id
    text role "admin | accounts_admin | secretary"
  }
  PENDING_CHANGES {
    uuid id
    text table_name
    text action "insert | update | delete | upsert"
    jsonb new_data
    jsonb old_data
    text approver_role
    text status "pending | approved | rejected | cancelled"
  }
  DONATIONS {
    uuid id
    text channel "office | online"
    text donor_name
    numeric amount
    text method
    text status "pending | verified | rejected"
  }
  SUBSCRIPTIONS {
    uuid id
    text donor_name
    numeric monthly_amount
    text status
  }
  INCOME_ENTRIES {
    uuid id
    date entry_date
    numeric amount
  }
  EXPENSE_ENTRIES {
    uuid id
    date expense_date
    numeric amount
  }
```

Content tables (public read when published, staff write): `events`, `gallery`, `announcements`, `temple_content`,
`worship_schedule`, `temple_highlights`, `committee_contacts`, `site_settings`. Visitor-only inserts: `contact_messages`,
online `donations`, `subscriptions`.

---

## 🔐 Security Model

| Layer | Protection |
|---|---|
| Browser | Only the Supabase **publishable** key; `.env` is git-ignored |
| Auth | Public sign-up disabled; staff logins created by an admin |
| Database | **RLS on every table**; visitors can only read published items and send donations / messages |
| Online donations | Must be `pending`, dated today, non-cash, no receipt number |
| Roles | `admin_profiles` is read-own-row only; roles change only through `set_staff_role()` (main admin) |
| Approvals | `approve_change()` checks the approver's role and blocks self-approval; only real table columns are applied |
| Storage | `event-photos`: JPEG / PNG / WebP, max 5 MB; admins (and secretary for uploads) only |
| CI | Fails if a real secret key (`sb_secret_…` / service-role JWT) appears in the build |

---

## 🚦 CI/CD

```mermaid
flowchart LR
  DEV["💻 commit on main<br/>or pull request"] --> CI{"CI<br/>ci.yml"}
  CI --> J1["🔨 Build website<br/>npm ci · vite build<br/>app code present · no secrets"]
  CI --> J2["🐘 Database & security<br/>PostgreSQL 16 service<br/>all SQL files + 63 checks"]
  J1 & J2 -->|all green on main| CD["🚀 Deploy<br/>deploy.yml"]
  CD --> PAGES(["GitHub Pages<br/>rbchy.github.io/dhoom-vivekananda-samiti"])
  J1 & J2 -->|any red| STOP["⛔ no deploy"]
```

| Workflow | When | What it does |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | every push to `main`, every pull request, manual | **Build:** installs packages, runs 14 unit tests of the social-post function against a fake Graph API, builds the site, checks the app code is in the bundle and no secret key leaked. **Database:** runs every file in `supabase/` on a fresh PostgreSQL 16 (twice where re-runs must be safe), seeds and removes test data, then [`99-security-tests.sql`](supabase/tests/99-security-tests.sql) |
| [`deploy.yml`](.github/workflows/deploy.yml) | after CI succeeds on `main`, manual | Builds with repository **variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, donation details) and publishes to GitHub Pages; skipped until the variables are set |

**What the 63 database checks prove** (excerpt)

| Area | Examples |
|---|---|
| Visitors | cannot add events, cannot make an admin, cannot read donations or requests; can send a pending online donation, cannot claim cash or "verified" |
| No role | a logged-in user without a role cannot make themselves admin, read income or change roles |
| Main Admin | adds events; **cannot** write income |
| Accounts Admin | adds income directly; **cannot** add events, change roles or approve content |
| Secretary | **cannot** write any table directly or approve; requests go to the right admin and are applied only after approval (id cannot be changed) |
| Workflow | reject needs a reason; rejected delete does not delete; settings upsert applied; main admin cannot remove their own role |
| Social post log | only the main admin can read it; nobody can write or delete it from the website (only the Edge Function) |

Run the same checks locally:

```bash
PGHOST=localhost PGUSER=postgres PGDATABASE=postgres bash supabase/tests/run-db-tests.sh
```

---

## 🧰 Tech Stack

![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite%208-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router%207-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide%20icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)

| Layer | Technology |
|---|---|
| Front end | React 19, React Router 7, Vite 8, plain CSS, Lucide icons |
| Back end | Supabase: PostgreSQL, Row Level Security, `security definer` functions, Auth, Storage, Edge Functions (Deno) |
| Social | Meta Graph API v25 (Facebook Page photos / feed, Instagram content publishing) |
| Internationalisation | Own lightweight i18n (`src/i18n*.js`): EN · BN · HI · KO · JA · ZH · ES · FR · AR (RTL) · RU |
| Mobile | Capacitor (Android / iOS), web app manifest |
| Quality | GitHub Actions CI, PostgreSQL 16 service container, SQL assertion tests, `node:test` unit tests |
| Delivery | GitHub Pages (CD), sub-path aware build (`VITE_BASE_PATH`) |

---

## 🗺️ Project Map

```mermaid
mindmap
  root((Dhoom Vivekananda Samiti))
    Public site
      Institutions
      Worship schedule
      Events and notices
        Share to WhatsApp / Facebook
      Gallery and slideshow
      Donations and subscriptions
      Contact and map
      10 languages
    Admin dashboard
      Content
      Accounts
        Donations
        Subscriptions
        Income and expenditure
      Approvals
      Staff and roles
    Supabase
      PostgreSQL + RLS
      Auth
      Storage
      Approval functions
    Delivery
      CI build and DB tests
      GitHub Pages
      Capacitor apps
```

---

## 📂 Repository Structure

```text
dhoom-vivekananda-samiti/
├── src/
│   ├── main.jsx                 public website (one page, sections)
│   ├── pages/                   admin dashboard pages (Events, Gallery, Finance, Approvals, …)
│   ├── components/              forms, language switcher, slideshow, share buttons, QR code
│   ├── lib/
│   │   ├── supabaseClient.js    Supabase connection (publishable key)
│   │   ├── staff.js             roles + db() wrapper (secretary → pending_changes)
│   │   ├── share.js             share text and links
│   │   └── money.js, finance.js, csv.js, storage.js, imageEnhance.js, validation.js
│   └── i18n*.js                 10-language text
├── public/                      icons, banner, images (e.g. images/belur-math.webp)
├── supabase/
│   ├── *-schema.sql             tables and rules (run in order, see help guide)
│   ├── security-hardening.sql   admin lock-down, donation rules, photo limits
│   ├── roles-and-approvals.sql  roles, pending_changes, approve / reject functions
│   ├── security-audit.sql       read-only report
│   ├── test-data-seed.sql / remove-test-data.sql
│   ├── social-posts-schema.sql  log of Facebook / Instagram posts
│   ├── functions/social-post/   Edge Function + unit tests (Meta Graph API)
│   └── tests/                   CI-only Supabase mock, 63 checks, runner
├── docs/
│   ├── ADMIN-HELP.md            full help guide (Bangla)
│   ├── SOCIAL-AUTOPOST.md       Facebook / Instagram auto-post setup (Bangla)
│   └── banner.svg
├── .github/workflows/           ci.yml, deploy.yml
├── capacitor.config.json        mobile app settings
└── .env.example                 settings template (copy to .env)
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/rbchy/dhoom-vivekananda-samiti.git
cd dhoom-vivekananda-samiti
npm install
cp .env.example .env          # fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev                   # http://localhost:5173  ·  admin: /admin/login
```

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server (also on your Wi-Fi, with a QR code) |
| `npm run build` / `npm run preview` | Production build in `dist/` and a local preview |
| `npm run app:android` / `app:ios` | Build and open the mobile app project |
| `bash supabase/tests/run-db-tests.sh` | Database and security checks |

**Database setup (Supabase → SQL Editor, in this order):**
`donations-and-events-schema.sql` → `temple-management-schema.sql` → `site-extras-schema.sql` →
`organisations-gallery-schema.sql` → `storage-photos-policy.sql` → `security-hardening.sql` → `roles-and-approvals.sql`.
Then turn off public sign-up, add staff logins and give roles in **Staff & Roles**.

> Step-by-step instructions, troubleshooting and backups: **[docs/ADMIN-HELP.md](docs/ADMIN-HELP.md)** (Bangla).

---

## 🧹 Maintenance Log

| Date | Change |
|---|---|
| 15 Nov 2026 | Repository created; project folder cleaned (old backups moved to a local `_archive`) |
| 15 Nov 2026 | Security hardening: `admin_profiles` locked, stricter online donations, photo bucket limits; audit script |
| 15 Nov 2026 | Three staff roles with database-enforced approvals; Approvals, My Requests, Staff & Roles pages |
| 15 Nov 2026 | `is_admin()` pinned to the main admin so new roles cannot write content tables directly |
| 15 Nov 2026 | Share buttons for events and notices; "Copy for social" in admin; labels in 10 languages |
| 15 Nov 2026 | CI (build + 42 DB checks) and GitHub Pages deploy; sub-path aware build; manifest icons fixed |
| 15 Nov 2026 | Bangla help guide; Belur Math photo on the home page |
| 16 Nov 2026 | Home banner with Sri Ramakrishna and Belur Math; Facebook Page / Instagram auto-posting (Edge Function, log table, 14 unit + 7 DB tests) |

## 📈 Roadmap

- [x] Code on GitHub with CI
- [x] Database security review and hardening
- [x] Roles and approval workflow
- [x] Social sharing (level 1)
- [ ] Real address, hours, donation numbers and committee details from the Samiti
- [ ] Custom domain and `VITE_SITE_URL`; Google Search Console and Google Business Profile
- [ ] `og:image` tags, `sitemap.xml`, `robots.txt`, 404 page
- [ ] Separate page per institution; community clinic page with doctor schedule
- [ ] PDF donation receipts and a public yearly accounts summary
- [ ] Playwright end-to-end tests for donation, contact, login and approvals
- [x] Automatic posting to the Facebook Page and Instagram (level 3) — needs the Meta setup in [docs/SOCIAL-AUTOPOST.md](docs/SOCIAL-AUTOPOST.md)

## 🔗 Related

| Project | Why it matters |
|---|---|
| [rbchy](https://github.com/rbchy/rbchy) | Author's profile and portfolio website |

---

<div align="center">

**Built with devotion and care by [RB Chowdhury](https://github.com/rbchy)** · *Seva is worship* 🙏

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/rbchy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rbchy/)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:chyranajit@gmail.com)

</div>
