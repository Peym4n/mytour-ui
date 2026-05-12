import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const apiUrl = (process.env.API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const openApiUrl = process.env.OPENAPI_URL || `${apiUrl}/v3/api-docs`;
const outputPath = resolve(process.cwd(), process.env.OPENAPI_OUTPUT || 'openapi.json');

console.log(`Downloading OpenAPI contract from ${openApiUrl}`);

const response = await fetch(openApiUrl, {
  headers: {
    Accept: 'application/json'
  }
});

if (!response.ok) {
  throw new Error(`OpenAPI download failed with HTTP ${response.status} ${response.statusText}`);
}

const body = await response.text();

try {
  JSON.parse(body);
} catch (error) {
  throw new Error(`OpenAPI response was not valid JSON: ${error.message}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${body}\n`, 'utf8');

console.log(`Saved OpenAPI contract to ${outputPath}`);
