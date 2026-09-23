# Image Provider

Status: **IMPLEMENTADO** (mock e OpenAI DALL-E).

## Providers

### MockImageProvider

- Usado quando `IMAGE_PROVIDER=mock`
- Retorna URLs mockadas: `https://mock-ai.local/generated/{counter}.jpg`
- Delay de 500ms para simular API
- Sempre retorna `healthCheck=true`
- Ideal para desenvolvimento sem custos

### OpenAIImageProvider

- Usado quando `IMAGE_PROVIDER=openai`
- Integração com OpenAI DALL-E 3
- Endpoint: `https://api.openai.com/v1/images/generations`
- Requer:
  - `OPENAI_API_KEY`

**Configuração padrão:**
- `model`: `dall-e-3`
- `size`: `1024x1024`
- `quality`: `standard`

**Tamanhos suportados:**
- `1024x1024` (padrão)
- `1792x1024` (landscape)
- `1024x1792` (portrait)

**Qualidade:**
- `standard` (padrão, mais rápido)
- `hd` (maior custo, mais detalhado)

## Interface

```typescript
interface IImageProvider {
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
  healthCheck(): Promise<boolean>;
}
```

### Input

```typescript
{
  prompt: string;              // Descrição da imagem
  negativePrompt?: string;     // O que evitar (concatenado no prompt)
  style?: string;              // Estilo desejado (ex: "photorealistic")
  referenceImageUrl?: string;  // URL da imagem de referência (não usado ainda)
}
```

### Output

```typescript
{
  imageUrl: string;            // URL temporária da imagem gerada
  revisedPrompt?: string;      // Prompt revisado pela IA (DALL-E 3)
  metadata?: Record<string, unknown>;  // Dados adicionais
}
```

## Prompt Building

O provider concatena:
1. `prompt` (obrigatório)
2. `"Style: {style}"` (se fornecido)
3. `"Avoid: {negativePrompt}"` (se fornecido)

Exemplo:
```typescript
Input:
{
  prompt: "A cat sitting on a chair",
  style: "photorealistic",
  negativePrompt: "blurry, low quality"
}

Prompt final enviado à API:
"A cat sitting on a chair. Style: photorealistic. Avoid: blurry, low quality"
```

## Health Check

- **Mock:** sempre `true`
- **OpenAI:** tenta acessar `models.retrieve(model)` para verificar autenticação

## Custos (OpenAI DALL-E 3)

- `1024x1024` standard: ~$0.040 por imagem
- `1024x1792` standard: ~$0.080 por imagem
- `1024x1024` HD: ~$0.080 por imagem
- `1024x1792` HD: ~$0.120 por imagem

**Importante:** URLs retornadas pela OpenAI expiram em 1 hora. Por isso, após a geração, o sistema deve:
1. Baixar a imagem do `imageUrl`
2. Fazer upload para o storage próprio (R2)
3. Armazenar o `storageKey` permanente no banco

## Factory

```typescript
const provider = createImageProvider(env.IMAGE_PROVIDER, {
  apiKey: env.OPENAI_API_KEY,
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
});
```

## Próximas Fases

**Fase 6 (BullMQ):**
- Worker que consome fila de geração
- Baixa imagem de input do storage
- Chama `generateImage`
- Baixa imagem de output e faz upload para storage
- Atualiza Generation e Order
- Envia resultado via WhatsApp

**Fase 7 (Provider real):**
- Conectar OpenAI provider no worker
- Configurar modelo, tamanho, qualidade via env vars
- Adicionar retry e error handling
- Monitorar custos

## Testes

- `image.provider.test.ts` — mock provider (4 testes)

Total: **61 testes passando**

## Alternativas futuras

Se OpenAI não for ideal:
- **Stability AI** (Stable Diffusion)
- **Midjourney** (via API não-oficial)
- **Replicate** (vários modelos)
- **Leonardo.ai**
- **Runway ML**

Basta implementar novo provider seguindo a interface `IImageProvider`.
