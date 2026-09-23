# WhatsApp

Status: **IMPLEMENTADO** (mock e real provider).

## Endpoints

### GET /webhooks/whatsapp

Verificação do webhook pela Meta. Parâmetros:

- `hub.mode=subscribe`
- `hub.verify_token=<WHATSAPP_VERIFY_TOKEN>`
- `hub.challenge=<string>`

Retorna o `challenge` se o token estiver correto.

### POST /webhooks/whatsapp

Recebe eventos do WhatsApp Business Cloud API. Valida assinatura via `X-Hub-Signature-256`.

Tipos de mensagem suportados:
- `text` — processa via bot
- `image` — registra (download/R2 na Fase 4)
- outros — mensagem de erro

## Providers

### MockWhatsAppProvider

- Usado quando `WHATSAPP_PROVIDER=mock`
- Não envia mensagens reais
- Loga no console
- `verifyWebhook` aceita token `mock_verify_token`
- `validateWebhookSignature` sempre retorna `true`

### WhatsAppCloudProvider

- Usado quando `WHATSAPP_PROVIDER=real`
- Requer:
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`
  - `WHATSAPP_APP_SECRET`
- API: `https://graph.facebook.com/v21.0/{phoneNumberId}/messages`
- Valida assinatura HMAC SHA-256

## Bot

### Estados (ConversationService)

Armazenado no Redis com TTL (`CONVERSATION_TTL_SECONDS`, padrão 3600s):

- `IDLE` — esperando comando
- `SELECTING_PRODUCT` — escolhendo produto
- `WAITING_FOR_IMAGE` — aguarda foto (Fase 4)
- `IMAGE_RECEIVED` — foto recebida (Fase 4)
- `WAITING_FOR_PAYMENT` — aguarda Pix (Fase 5)
- outros estados para fases seguintes

### Comandos

- `OI` / `MENU` / `INÍCIO` — menu principal
- `1` — criar foto (lista produtos)
- `2` — ver produtos
- `3` — ver preços
- `4` — ajuda
- `CANCELAR` — cancela operação atual
- Número (1-N) — escolhe produto quando `SELECTING_PRODUCT`

### Fluxo atual (Fase 3)

```
Usuário: OI
Bot: Menu com 4 opções

Usuário: 1
Bot: Lista produtos disponíveis

Usuário: 1 (escolhe produto)
Bot: "Envie sua foto" (placeholder — processamento na Fase 4)
Estado: WAITING_FOR_IMAGE
```

## Segurança

- Valida `X-Hub-Signature-256` em webhooks reais
- Responde 200 imediatamente, processa em `setImmediate`
- `externalMessageId` garante idempotência no `MessageService`

## Testes

- `conversation.service.test.ts` — Redis state (6 testes)
- `whatsapp.provider.test.ts` — Mock provider (6 testes)

## Documentação oficial

Consultar sempre a versão atual:
- https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
- https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
