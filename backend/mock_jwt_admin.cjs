const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin123@gmail.com', role: 'admin' }, 'marketbeacon-super-secret-key-2026', { expiresIn: '1h' });
console.log(token);
