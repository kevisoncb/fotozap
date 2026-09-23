# Queues

BullMQ entra na Fase 6. Redis já está previsto no Compose.

Fila inicial: `image-generation`. Job IDs determinísticos (`generation-{generationId}`).

Worker separado: `npm run dev:worker`.
