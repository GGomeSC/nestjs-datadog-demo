import fs from 'node:fs';
import YAML from 'yaml';

export function loadYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

export function validateCatalogDefinition(catalog, compose) {
  const errors = [];
  const fail = (message) => errors.push(message);

  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return ['catalog file must contain a YAML object'];
  }

  if (catalog.apiVersion !== 'v3') {
    fail('apiVersion must be v3');
  }

  if (catalog.kind !== 'service') {
    fail('kind must be service');
  }

  const metadata = catalog.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail('metadata must be an object');
  } else {
    if (!metadata.name) {
      fail('metadata.name is required');
    }

    if (!metadata.owner) {
      fail('metadata.owner is required');
    }

    if (!metadata.description) {
      fail('metadata.description is required');
    }

    if (!Array.isArray(metadata.links) || metadata.links.length === 0) {
      fail('metadata.links must be a non-empty list');
    } else {
      for (const [index, link] of metadata.links.entries()) {
        if (!link || typeof link !== 'object' || Array.isArray(link)) {
          fail(`metadata.links[${index}] must be an object`);
          continue;
        }

        for (const field of ['name', 'type', 'url']) {
          if (!link[field]) {
            fail(`metadata.links[${index}].${field} is required`);
          }
        }

        if (link.url) {
          try {
            const parsedUrl = new URL(link.url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
              fail(`metadata.links[${index}].url must be http or https`);
            }
          } catch {
            fail(`metadata.links[${index}].url is invalid`);
          }
        }
      }
    }
  }

  const apiService = compose?.services?.api;
  if (!apiService || typeof apiService !== 'object') {
    fail('docker-compose.yml must define services.api');
  } else {
    const ddService = readComposeEnvironment(apiService.environment, 'DD_SERVICE');
    if (!ddService) {
      fail('services.api.environment.DD_SERVICE is required in docker-compose.yml');
    } else if (metadata?.name && metadata.name !== ddService) {
      fail(`metadata.name must match DD_SERVICE (${metadata.name} != ${ddService})`);
    }
  }

  const spec = catalog.spec;
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    fail('spec must be an object');
  } else {
    if (!spec.lifecycle) {
      fail('spec.lifecycle is required');
    }

    if (!spec.type) {
      fail('spec.type is required');
    }
  }

  return errors;
}

function readComposeEnvironment(environment, key) {
  if (!environment) {
    return undefined;
  }

  if (Array.isArray(environment)) {
    const entry = environment.find((item) => typeof item === 'string' && item.startsWith(`${key}=`));
    return entry?.split('=', 2)[1];
  }

  if (typeof environment === 'object') {
    return environment[key];
  }

  return undefined;
}
