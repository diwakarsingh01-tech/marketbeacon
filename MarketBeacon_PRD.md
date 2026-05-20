# 📄 Product Requirements Document (PRD): MarketBeacon Terminal

## 1. Executive Summary
MarketBeacon is a high-performance, institutional-grade stock screening and portfolio management terminal designed for professional traders. It automates the "Batch 9" algorithmic framework across a 12-strategy matrix, providing real-time auditing, risk management, and order journaling.

---

## 2. Technical Architecture Map

### **Frontend (The Terminal)**
- **Framework:** React 19 (TypeScript) + Vite
- **Styling:** Vanilla CSS + Tailwind CSS 4.0
- **Routing:** React Router 7 with `React.lazy` code-splitting for performance.
- **State Management:** Context API (`AuthContext`) for session and user tier persistence.
- **Icons:** Lucide React (Institutional set).

### **Backend (The Engine)**
- **Framework:** Node.js + Express
- **Runtime:** `tsx` (TypeScript Execution)
- **Database:** SQLite (Local) / Turso (Cloud Synchronization).
- **Data Fetcher:** Yahoo Finance (Real-time fallback) + Screener.in Scraper (Fundamental Audit).
- **Caching:** `market_snapshot.json` (Daily pre-calculated matrix to ensure <100ms UI load).

---

## 3. Data Structure & Storage

### **Database Schema (SQLite)**
1.  **`users` Table:**
    *   `id`, `name`, `email`, `password` (Hashed), `role` (user/admin), `tier` (free/pro/alpha).
    *   `subscription_start`, `subscription_expiry`, `is_active` (Membership Lifecycle).
2.  **`trades` Table (The Ledger):**
    *   `id`, `user_id`, `symbol`, `status` (OPEN/CLOSED), `strategy`, `level` (A/B/C/D).
    *   `entry_price`, `entry_date`, `exit_price`, `exit_date`, `target_price`, `stop_loss`, `notes`.
3.  **`vouchers` Table:**
    *   `code` (Unique), `tier`, `duration_days`, `max_uses`, `current_uses`.
4.  **`upgrade_requests` Table:**
    *   `transaction_id` (UTR), `requested_tier`, `status` (pending/approved).

### **Data Flows**
- **Snapshot Flow:** Backend scans 500+ stocks -> Runs 12-Strategy Matrix -> Saves to `market_snapshot.json`.
- **UI Flow:** Frontend requests `/api/marketplace` -> Backend serves cached snapshot -> Instant rendering.
- **Ledger Flow:** Frontend calculates ROI live by merging Journal data with real-time CMP via `/api/stock-prices`.

---

## 4. Feature Matrix (Current Status)
| Feature | Status | Tech Impact |
| :--- | :--- | :--- |
| **12-Strategy Matrix** | ✅ Active | High-accuracy scanning across NSE universe. |
| **Membership Lifecycle** | ✅ Active | Full Admin control over Start/Expiry dates. |
| **Trial Voucher System** | ✅ Active | Time-based Alpha access (e.g., 7 Days Free). |
| **Unified Portfolio Mix**| ✅ Active | Merges Watchlist + Open Trades for 50-30-20 analysis. |
| **Share to Telegram** | ✅ Active | One-click clipboard copy for viral social proof. |
| **Lazy Loading** | ✅ Active | Production-ready performance optimization. |

---

## 5. Deployment Strategy
- **Frontend:** Vercel (Automatic CI/CD from `main` branch).
- **Backend:** AWS EC2 Instance (Persistent Node process).
- **Database:** Local SQLite for maximum speed, synchronized to GitHub for state recovery.

---
**Version:** 3.5.1-PRO | **Lead Architect:** Gemini CLI (20yr Dev/Trader Expert)
