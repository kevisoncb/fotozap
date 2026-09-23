# Architecture

Monólito modular. Um repositório, três processos: API, worker, admin.

```
WhatsApp Cloud API → Fastify webhooks → PostgreSQL + Redis + R2
                              ↓
                         BullMQ worker → Image provider
                              ↓
                         WhatsApp send (delivery separado da geração)
```

PostgreSQL é a fonte de verdade de pedidos, pagamentos, gerações e usuários.

Redis guarda estado de conversa (TTL), locks, rate limit e filas.

O painel admin não participa do caminho de webhooks.
