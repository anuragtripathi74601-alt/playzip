# 🎮 PlayZip — Real Money Multiplayer Gaming Platform

PlayZip ek **Real Money Multiplayer Gaming Platform** hai jisme Pool, Snooker, aur Chess hain.

## 🚀 Live Demo
> **GitHub Pages pe deploy karke aap yeh link se access kar sakte ho:**
> `https://anuragtripathi74601-alt.github.io/playzip/`

## 📂 Files

| File | Description |
|------|-------------|
| `app.html` | 🎮 **User App** — Register, wallet, games lobby, friends, profile |
| `admin.html` | 👑 **Owner Admin Panel** — Dashboard, users, payments, reports, security, ads |
| `games/chess.html` | ♟ **Chess** — Full AI engine, timer, all rules |
| `games/pool.html` | 🎱 **8-Ball Pool** — Physics, aim/shoot, solids/stripes |
| `games/snooker.html` | 🔴 **Snooker** — Reds/colors, scoring, fouls |
| `index.html` | 🔀 Auto-redirect to app.html |
| `backend/` | Node.js + MongoDB API (for production) |
| `mobile_app/` | Flutter App (Android + iOS) |

## 🚀 Deploy to GitHub Pages

### Step-by-Step Guide:

**Step 1: GitHub Account**
- [github.com](https://github.com) pe jaao
- Agar account nahi hai toh sign up karo (FREE)
- Login karo

**Step 2: New Repository**
- Top-right ➕ icon → **New repository**
- Repository name: `playzip`
- Keep **Public** selected
- **"Create repository"** button click karo

**Step 3: Upload Files**
- Naye repo mein **"uploading an existing file"** link click karo
- Windows Explorer se `apps/playzip/` folder ki saari files **drag & drop** karo:
  - `index.html`
  - `app.html`
  - `admin.html`
  - `games/` folder (poore folder ko drop karo)
  - `README.md`
- **⚠️ Tip:** Agar `games/` folder drag-drop nahi hota, toh pehle GitHub pe **"Create new file"** click karo, path likho `games/chess.html`, kuch bhi content daalo aur commit karo. Folder auto-create ho jayega. Phir baaki files upload karo.
- **"Commit changes"** button click karo

**Step 4: Enable GitHub Pages**
- Repo ke **Settings** tab mein jao
- Left sidebar mein **Pages** click karo
- **Branch**: `main` select karo
- **Folder**: `/ (root)` select karo
- **Save** button click karo

**Step 5: Done! 🎉**
- 2 minute mein aapka app live hoga:
- `https://anuragtripathi74601-alt.github.io/playzip/`
- Admin panel: `https://anuragtripathi74601-alt.github.io/playzip/admin.html`
  - 🔑 **Admin Password:** `playzip@owner2026`
- Games: `https://anuragtripathi74601-alt.github.io/playzip/games/chess.html`

> **Note:** Sirf `app.html`, `admin.html`, `games/`, aur `index.html` upload karo. `backend/` aur `mobile_app/` folders GitHub Pages ke liye zaroori nahi hain.
