# Troubleshooting

## `node` / `git` não reconhecidos

Use `.tools` ou instale Node 24 LTS e Git for Windows no sistema.

## `docker` não reconhecido

Instale Docker Desktop. Sem isso, `docker compose up` e migrations reais não rodam.

## `prisma migrate` falha

Postgres não está no ar. Suba o Compose e confira `DATABASE_URL`.

## Servidor sobe sem WhatsApp

Esperado em development com `WHATSAPP_PROVIDER=mock`.
