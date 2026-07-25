# 🚀 MarketBeacon Deployment Guide

Follow these steps to take your trading dashboard live for free.

---

## 🟢 Phase 1: GitHub Setup (Source Control)
Vercel and Render need your code on GitHub to deploy.

1.  **Create Repo:** Go to [github.com/new](https://github.com/new) and create a private repository named `marketbeacon`.
2.  **Connect Local Code:** Run these commands in your terminal:
    ```bash
    cd /Users/diwakarsingh/supertracker-replica
    git remote add origin https://github.com/YOUR_USERNAME/marketbeacon.git
    git add .
    git commit -m "Deployment preparation"
    git push -u origin main
    ```

---

## 🔵 Phase 2: Database Migration (Turso)
Since standard SQLite files get deleted on Render, we use **Turso** (Managed SQLite).

1.  **Sign Up:** Go to [Turso.tech](https://turso.tech/) and sign up.
2.  **Install CLI (Optional) or use Dashboard:** Create a new database named `marketbeacon-db`.
3.  **Get Credentials:** Copy the **Database URL** and **Auth Token**.
4.  **Tell me the URL/Token:** (Or paste them in your `.env` file later).

---

## 🟡 Phase 3: Backend Deployment (Render)
1.  **Login:** Go to [Render.com](https://render.com/).
2.  **New Web Service:** Select your GitHub repo `marketbeacon`.
3.  **Config:**
    *   **Root Directory:** `backend`
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm run start`
4.  **Environment Variables:** Add these in Render Dashboard:
    *   `TURSO_DATABASE_URL`: (From Step 2)
    *   `TURSO_AUTH_TOKEN`: (From Step 2)
    *   `JWT_SECRET`: (Any random string)

---

## 🔴 Phase 4: Frontend Deployment (Vercel)
1.  **Login:** Go to [Vercel.com](https://vercel.com/).
2.  **Import Project:** Select the same `marketbeacon` repo.
3.  **Config:**
    *   **Framework Preset:** Vite
    *   **Root Directory:** (Leave empty/Root)
4.  **Environment Variables:**
    *   `VITE_API_URL`: (Put your Render Backend URL here, e.g., `https://marketbeacon-api.onrender.com`)

---

## 🏁 Phase 5: Verification
Once both are live, open your Vercel URL. You should see the landing page, be able to login, and see your stock scanner running!

---

**Next Action:** 
Please complete **Phase 1 (GitHub)** and share the link. I will then help you modify the code to support Turso and Production URLs automatically.
