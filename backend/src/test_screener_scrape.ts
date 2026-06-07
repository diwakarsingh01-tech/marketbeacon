import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
  const symbols = ['SBIN', 'TCS', 'PIDILITIND', 'HINDUNILVR', 'DIXON', 'VINATIORGA'];
  for (const sym of symbols) {
    const url = `https://www.screener.in/company/${sym}/`;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.screener.in/'
        }
      });
      const $ = cheerio.load(response.data);
      const broadSector = $('#peers p.sub a[title="Broad Sector"]').first().text().trim();
      const sector = $('#peers p.sub a[title="Sector"]').first().text().trim();
      const broadIndustry = $('#peers p.sub a[title="Broad Industry"]').first().text().trim();
      const industry = $('#peers p.sub a[title="Industry"]').first().text().trim();
      
      console.log(`${sym}:`);
      console.log(`  Broad Sector:   ${broadSector}`);
      console.log(`  Sector:         ${sector}`);
      console.log(`  Broad Industry: ${broadIndustry}`);
      console.log(`  Industry:       ${industry}`);
    } catch (e: any) {
      console.error(`Error for ${sym}:`, e.message);
    }
  }
}

run();
