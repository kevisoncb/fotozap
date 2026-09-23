# Storage

Status: **IMPLEMENTADO** (mock e R2).

## Providers

### MockObjectStorage

- Usado quando `STORAGE_PROVIDER=mock`
- Armazena em Map (memória)
- URLs retornadas: `https://mock-storage.local/{key}`
- Ideal para desenvolvimento sem credenciais R2

### R2ObjectStorage

- Usado quando `STORAGE_PROVIDER=r2`
- Cloudflare R2 via AWS SDK S3-compatible API
- Endpoint: `https://{accountId}.r2.cloudflarestorage.com`
- Requer:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `R2_PUBLIC_URL`

## Estrutura de chaves

```
users/{userId}/input/{uuid}.{ext}   # Foto enviada pelo usuário
users/{userId}/output/{uuid}.{ext}  # Imagem processada
```

Extensões suportadas: `.jpg`, `.png`, `.webp`

## ImageService

### Validação

Regras aplicadas antes do upload:

- **Tamanho máximo:** `MAX_IMAGE_SIZE_MB` (padrão 10MB)
- **MIME types aceitos:** `image/jpeg`, `image/png`, `image/webp`
- **Tamanho mínimo:** 100 bytes

Erros retornados:
- `IMAGE_TOO_LARGE:{maxMB}MB`
- `INVALID_IMAGE_TYPE:{mimeType}`
- `IMAGE_TOO_SMALL`

### Upload

```typescript
const { key, url } = await imageService.uploadImage({
  bytes: Buffer,
  mimeType: "image/jpeg",
  userId: "user123",
  purpose: "input" | "output"
});
```

- Gera UUID automático
- Armazena no path correto
- Retorna key (para DB) e URL (para acesso)

### Delete

```typescript
await imageService.deleteImage(key);
```

## WhatsAppImageHandler

Fluxo completo quando usuário envia foto:

1. Verifica se estado é `WAITING_FOR_IMAGE`
2. Baixa mídia via `whatsapp.downloadMedia(mediaId)`
3. Valida imagem (`validateImage`)
4. Faz upload (`uploadImage` com purpose="input")
5. Vincula ao Order (`orderService.setInputImage`)
6. Atualiza estado para `IMAGE_RECEIVED`
7. Notifica usuário

## Lifecycle (configuração manual no R2)

Para expirar automaticamente arquivos antigos, configure no dashboard R2:

**Rule 1: Input expiration**
- Prefix: `users/`
- Subpath contains: `/input/`
- Days: `INPUT_RETENTION_HOURS / 24` (padrão 1 dia)

**Rule 2: Output expiration**
- Prefix: `users/`
- Subpath contains: `/output/`
- Days: `OUTPUT_RETENTION_DAYS` (padrão 7 dias)

## Testes

- `image.service.test.ts` — validação, upload, delete (7 testes)
- `storage.provider.test.ts` — mock storage (4 testes)

Total: **49 testes passando**
