const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/types/database.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/is_admin: boolean;/g, 'is_admin: boolean;\n          is_suspended: boolean;');
code = code.replace(/is_admin\?: boolean;/g, 'is_admin?: boolean;\n          is_suspended?: boolean;');

fs.writeFileSync(file, code);
console.log('Updated database.ts with is_suspended');
