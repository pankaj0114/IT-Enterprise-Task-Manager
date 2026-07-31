import bcrypt from 'bcryptjs';

const password = 'raman123';
const hash = bcrypt.hashSync(password, 10);

console.log('Hashed password:', hash);
