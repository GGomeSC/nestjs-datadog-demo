import { loadYaml, validateCatalogDefinition } from './catalog.mjs';

const catalogFile = process.argv[2] || 'docker/service.datadog.yaml';
const composeFile = process.argv[3] || 'docker/src/docker-compose.yml';

const catalog = loadYaml(catalogFile);
const compose = loadYaml(composeFile);
const errors = validateCatalogDefinition(catalog, compose);

if (errors.length > 0) {
  console.error('Datadog catalog validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Datadog catalog definition is valid for service ${catalog.metadata.name}`);
