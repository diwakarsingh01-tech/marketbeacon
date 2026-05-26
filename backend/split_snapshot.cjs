const fs = require('fs');
const path = require('path');

const SNAPSHOT_FILE = path.join(__dirname, 'market_snapshot.json');
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR);
}

if (fs.existsSync(SNAPSHOT_FILE)) {
  console.log("Reading huge snapshot...");
  const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
  for (const sym of Object.keys(data)) {
    fs.writeFileSync(path.join(SNAPSHOT_DIR, `${sym}.json`), JSON.stringify(data[sym]));
  }
  console.log(`Split into ${Object.keys(data).length} files.`);
  fs.renameSync(SNAPSHOT_FILE, path.join(__dirname, 'market_snapshot.json.bak'));
} else {
  console.log("No market_snapshot.json found.");
}
