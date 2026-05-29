const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

// Install selfsigned if not present
try { require.resolve('selfsigned'); } catch (e) {
  console.log('Installing selfsigned package...');
  execSync('npm install --save-dev selfsigned', { cwd: __dirname, stdio: 'inherit' });
}

const selfsigned = require('selfsigned');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const opts = {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
  extensions: [
    { name: 'subjectAltName', altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' }
    ]}
  ]
};

const result = selfsigned.generate(attrs, opts);

Promise.resolve(result).then(pems => {
  fs.writeFileSync(path.join(certDir, 'localhost.key'), pems.private);
  fs.writeFileSync(path.join(certDir, 'localhost.crt'), pems.cert);
  fs.writeFileSync(path.join(certDir, 'ca.crt'), pems.cert);

  console.log('Certificates generated in ./certs/');
  console.log('  - localhost.key');
  console.log('  - localhost.crt');
  console.log('  - ca.crt');
});
