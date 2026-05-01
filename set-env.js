const fs = require('fs');
const path = require('path');

// Read the API_URL from the environment, defaulting to localhost for dev
const apiUrl = process.env.API_URL || 'http://localhost:8080';

const envConfig = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}'
};
`;

const prodEnvConfig = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const targetDir = path.join(__dirname, 'src', 'environments');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'environment.ts'), envConfig);
fs.writeFileSync(path.join(targetDir, 'environment.prod.ts'), prodEnvConfig);

console.log(`Generated environment files with apiUrl: ${apiUrl}`);
