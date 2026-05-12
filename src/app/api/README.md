# Generated API Client

This directory is reserved for the Angular API client generated from the Spring Boot OpenAPI contract.

Generated files are written to:

```text
src/app/api/generated
```

Do not manually edit files in `generated`. If the generated API is wrong, update the backend controllers/DTOs or `ng-openapi-gen.json`, then regenerate.

Useful commands from the `mytour-ui` directory:

```bash
npm run download-api
npm run generate-api
npm run sync-api
```

The expected source contract is:

```text
openapi.json
```
