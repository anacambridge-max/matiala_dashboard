# AC-34 Matiala — SIR 2026 Hearing & Notice Dashboard

Yeh ek web dashboard hai jo aapki `AC34_Matiala_Hearing_Dashboard-6.xlsx` sheet ke
DASHBOARD tab ki tarah kaam karta hai — sirf latest ECI **NOTICE_REPORT_PART_WISE**
Excel file upload karni hai, baaki sab (Notice Delivered / Pending / Hearings Held,
officer-wise summary, PS-wise detail) apne aap update ho jata hai.

## Yeh kaise kaam karta hai

- **PS_MASTER, HEARING_DATA aur LISTS** (officer, BLO, supervisor, hearing schedule,
  hearing dates) — yeh aapki original sheet se ek baar nikal kar app ke andar
  (`src/data/*.json`) fix kiye gaye hain, kyunki yeh data rarely change hota hai.
- **ECI_INPUT** — jab bhi aap ECI ki Excel file upload karte hain, browser usi
  waqt (bina kisi server ke) file padh leta hai aur:
  - `AC Number = 34` (Matiala) aur `POLLING STATION` number se match karke
  - `Notice Delivered` aur `Hearings Held` nikalta hai — bilkul waisa hi jaisa
    sheet ka `SUMIFS(...)` formula karta tha.
  - `Notice Pending Delivery = Scheduled Notices for Hearing − Notice Delivered`
- Upload ki gayi file browser ke **localStorage** mein save ho jaati hai, isliye
  aapko dobara upload nahi karna padega jab tak naya ECI report na aaye — page
  refresh karne ya dobara kholne par bhi data wahi rahega (ek hi browser/device par).
- Koi bhi data kahin bahar (server/database) nahi jaata — sab kuch aapke browser
  ke andar hi process hota hai.

## Local par chalane ke liye

```bash
npm install
npm run dev
```

Phir browser mein `http://localhost:3000` kholein.

## GitHub + Vercel par deploy karne ke steps

1. **GitHub par naya repository banayein** (e.g. `matiala-dashboard`), private ya
   public — aapki marzi.
2. Is folder ko GitHub par push karein:
   ```bash
   git init
   git add .
   git commit -m "AC-34 Matiala hearing dashboard"
   git branch -M main
   git remote add origin https://github.com/<aapka-username>/matiala-dashboard.git
   git push -u origin main
   ```
3. [vercel.com](https://vercel.com) par jaayein aur GitHub account se sign in karein.
4. **"Add New Project"** → apna `matiala-dashboard` repo select karein → Vercel
   khud detect kar lega ki yeh Next.js app hai → **Deploy** dabayein.
5. 1-2 minute mein aapko ek live URL mil jayega (e.g.
   `https://matiala-dashboard.vercel.app`) — yehi link aap apne phone/laptop par
   bookmark kar lein.
6. Agar aage kabhi koi change chahiye (naya officer add karna, hearing schedule
   update karna, ya design change), toh bas GitHub repo mein naya commit push
   karte rahiye — Vercel apne aap redeploy kar dega.

## Data update karne ke liye (roz ka kaam)

Bas dashboard khol kar **"ECI Excel file yahan drop karein"** box mein latest
ECI `NOTICE_REPORT_PART_WISE` file daal dein — 2-3 second mein poora dashboard
naye numbers ke saath update ho jayega. Ismein koi paste/copy ya formula nahi
karna padega.

## Agar hearing schedule ya officer/BLO details change ho

Yeh reference data (`PS_MASTER`, `HEARING_DATA`, `LISTS`) `src/data/*.json` files
mein hai. Master sheet update hone par, in files ko dobara generate karne ka
script share kiya ja sakta hai — ya seedha JSON files edit ki ja sakti hain
(same structure jaisa original Excel tabs mein tha).
