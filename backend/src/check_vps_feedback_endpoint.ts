import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
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
