# 🏁 MarketBeacon: Standard Operating Procedure (SOP)

## 🛡 Mandatory Pre-Change Audit (Checklist)
Before any code modification, the following steps **must** be executed:
1. **Context Check:** Read the current state of `MEMORY.md`, `GEMINI.md`, and `PROJECT_CHECKLIST.md`.
2. **Impact Analysis:** Identify which files/features will be affected. If a change impacts stable logic (Strategies/Auth), alert the user in Hinglish.
3. **Snapshot:** Perform a `git commit` of the current working state before starting a new requirement.
4. **Verification Strategy:** Define *how* the change will be tested before writing code.

## 🔄 Version Control Workflow
1. **Commits:** Every sub-task must be committed with a clear message: `feat: add RHS strategy` or `fix: login timeout`.
2. **Rollback:** If a change fails verification, use `git restore .` or `git checkout HEAD` immediately.
3. **Tags:** At the end of every successful day, create a tag (e.g., `v10-stable`) to lock the progress.

## 🏗 Modular Architecture Rules
- **Strategies:** Keep `backend/src/strategies.ts` as the primary engine. For complex new logic, use a separate file.
- **Baskets:** Frontend and Backend **must** stay in sync. Any change to `src/data/stocks.ts` must be mirrored in the backend.
- **Fundamentals:** Never suppress type warnings in `StockFundamentals.tsx`.

## 🎓 Technical Standards
- **Guidance Tone:** Senior Engineer / Mentor style (Hinglish).
- **Data Source:** Always use `adjClose` for strategy math.
- **Cleanup:** Run the self-cleaning routine (summarize and free RAM) every 3 major tasks.

## 🛡 MarketBeacon: Safe-Guard Institutional Standards (v12.0+)
The project now follows a **Zero-Crash Policy**. All modifications must adhere to:
- **Null-Safety:** Always use Optional Chaining (`?.`) for data access. Never access `properties of null`.
- **Defensive Filtering:** Always check for null items in `filter` and `map` operations.
- **Connectivity:** Use `getApiUrl()` for all fetches. Explicitly target Port 3001 locally and Render on Live.
- **Build Hardening:** Run `npm run build` locally before pushing. No exceptions.
- **Version Verification:** Confirm the version number in the UI footer after every push.

## 📅 Project History
- **Day 1-9:** Initial setup, deployment, 10-strategy implementation, and mobile overhaul.
- **Day 10 (May 23):** SOP Integration & Version Control enforcement.
- **Phase 12 (May 31):** Safe-Guard Standards & Alpha Hub Performance Hardening.
