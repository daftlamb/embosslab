const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index >= 0 ? [arg.slice(0, index), arg.slice(index + 1)] : [arg, true];
}));

function base64Url(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const email = String(args.email || '').trim().toLowerCase();
const app = String(args.app || 'emboss-lab').trim();
const edition = String(args.edition || 'standard').trim();
const expires = args.expires ? String(args.expires).trim() : '';

if (!email) {
  console.error('Usage: node license/generate-license.js email=user@example.com [app=emboss-lab] [edition=standard] [expires=2027-12-31]');
  process.exit(1);
}

const privatePath = path.join(__dirname, 'private-key.pem');
if (!fs.existsSync(privatePath)) {
  console.error('Missing license/private-key.pem. Run npm run license:keygen first.');
  process.exit(1);
}

const payload = {
  app,
  email,
  edition,
  issued: new Date().toISOString().slice(0, 10),
  expires,
  serial: crypto.randomBytes(8).toString('hex').toUpperCase()
};
const payload64 = base64Url(JSON.stringify(payload));
const signature = crypto.sign(null, Buffer.from(payload64), fs.readFileSync(privatePath));
const code = `${payload64}.${base64Url(signature)}`;

console.log(`Email: ${email}`);
console.log(`App: ${app}`);
console.log(`Edition: ${edition}`);
if (expires) console.log(`Expires: ${expires}`);
console.log('');
console.log(code);
