const axios = require('axios');
const token = 'IbKppGtWgYN6yh4L2ryi2tHiMoDk2zHzOldkoGHC5e00c523';

const domains = [
  'marketbeaconpro',
  'beaconalpha',
  'alphabeaconpro',
  'institutionalalpha',
  'wealthbeaconpro',
  'beaconterminal',
  'superbeaconpro',
  'alphahubpro',
  'beaconfintech',
  'traderbeacon',
  'finbeaconpro'
];

async function check() {
  for (const d of domains) {
    try {
      const res = await axios.post('https://developers.hostinger.com/api/domains/v1/availability', 
        { domain: d, tlds: ['com'] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = res.data[0];
      console.log(`${result.domain}: ${result.is_available ? '✅ AVAILABLE' : '❌ TAKEN'}`);
    } catch (e) {
      console.error(`Error checking ${d}:`, e.message);
    }
  }
}
check();
