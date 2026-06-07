import jwt from 'jsonwebtoken';
import axios from 'axios';

async function check() {
  const JWT_SECRET = 'marketbeacon-super-secret-key-2026';
  const token = jwt.sign({ id: 7, role: 'admin' }, JWT_SECRET);
  
  console.log('Querying VPS backend /api/admin/feedback...');
  try {
    const response = await axios.get('https://www.marketbeaconpro.com/api/admin/feedback', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', response.status);
    console.log('Data count:', response.data.length);
  } catch (e: any) {
    console.error('Request failed:', e.response?.status, e.response?.data || e.message);
  }
}

check();
