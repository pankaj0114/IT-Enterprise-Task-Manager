import bcrypt from 'bcryptjs';

const password = 'StrongPass123';
const hash = bcrypt.hashSync(password, 10);

console.log('Hashed password:', hash);
