import { loadYaml } from './catalog.mjs';

const catalogFile = process.argv[2] || 'docker/service.datadog.yaml';
const catalog = loadYaml(catalogFile);

const apiKey = process.env.DD_API_KEY;
const appKey = process.env.DD_APP_KEY;
const site = process.env.DD_SITE || 'datadoghq.com';
const apiUrl = process.env.DD_API_URL || apiUrlForSite(site);

if (!apiKey) {
  throw new Error('DD_API_KEY is required');
}

if (!appKey) {
  throw new Error('DD_APP_KEY is required');
}

const response = await fetch(`${apiUrl}/api/v2/catalog/entity`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'DD-API-KEY': apiKey,
    'DD-APPLICATION-KEY': appKey,
  },
  body: JSON.stringify(catalog),
});

const responseBody = await response.text();
if (!response.ok) {
  throw new Error(`Datadog Software Catalog API returned ${response.status}: ${responseBody}`);
}

if (responseBody) {
  console.log(responseBody);
}

console.log(`Published ${catalogFile} to Datadog Software Catalog (${site})`);

function apiUrlForSite(ddSite) {
  const sites = {
    'datadoghq.com': 'https://api.datadoghq.com',
    'app.datadoghq.com': 'https://api.datadoghq.com',
    'us3.datadoghq.com': 'https://api.us3.datadoghq.com',
    'us5.datadoghq.com': 'https://api.us5.datadoghq.com',
    'datadoghq.eu': 'https://api.datadoghq.eu',
    'app.datadoghq.eu': 'https://api.datadoghq.eu',
    'ap1.datadoghq.com': 'https://api.ap1.datadoghq.com',
    'ap2.datadoghq.com': 'https://api.ap2.datadoghq.com',
    'ddog-gov.com': 'https://api.ddog-gov.com',
    'app.ddog-gov.com': 'https://api.ddog-gov.com',
    'us2.ddog-gov.com': 'https://api.us2.ddog-gov.com',
  };

  const url = sites[ddSite];
  if (!url) {
    throw new Error(`Unsupported DD_SITE: ${ddSite}. Set DD_API_URL to override.`);
  }

  return url;
}
