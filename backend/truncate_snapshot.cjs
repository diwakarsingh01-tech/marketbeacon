const fs = require('fs');
const path = require('path');

const SNAPSHOT_FILE = path.join(__dirname, 'market_snapshot.json.bak');
const NEW_SNAPSHOT_FILE = path.join(__dirname, 'market_snapshot.json');

if (fs.existsSync(SNAPSHOT_FILE)) {
  console.log("Reading 97MB snapshot...");
  const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
  for (const sym of Object.keys(data)) {
    if (data[sym].quotes && data[sym].quotes.length > 600) {
      data[sym].quotes = data[sym].quotes.slice(-600); // Keep last 600 days (approx 2.5 years)
    }
  }
  fs.writeFileSync(NEW_SNAPSHOT_FILE, JSON.stringify(data));
  console.log("Truncated snapshot saved. Size: ", fs.statSync(NEW_SNAPSHOT_FILE).size / (1024 * 1024), "MB");
} else {
  console.log("Backup not found.");
}
