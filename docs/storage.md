# Storage

Status: **MOCK**. Interface `ObjectStorage` definida.

Cloudflare R2 entra na Fase 4.

Chaves previstas:

- `users/{userId}/input/{uuid}.jpg` — retenção `INPUT_RETENTION_HOURS` (24h)
- `orders/{orderId}/output/{uuid}.jpg` — retenção `OUTPUT_RETENTION_DAYS` (7d)

Lifecycle rules devem ser configuradas no painel R2 por prefixo; o worker de cleanup é fallback.
