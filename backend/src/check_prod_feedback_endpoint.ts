import jwt from 'jsonwebtoken';
import axios from 'axios';

async function check() {
  const JWT_SECRET = 'marketbeacon-super-secret-key-2026';
  const token = jwt.sign({ id: 7, role: 'admin' }, JWT_SECRET);
  
  console.log('Querying production /api/admin/feedback...');
  try {
    const response = await axios.get('https://marketbeaconpro.com/api/admin/feedback', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', response.status);
    console.log('Data (first 2 entries):', response.data.slice(0, 2));
  } catch (e: any) {
    console.error('Request failed:', e.response?.status, e.response?.data || e.message);
  }
}

check();
