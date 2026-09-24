# Environment

Copie `.env.example` para `.env`. Nunca commite `.env`.

Em `development` e `test`, secrets de WhatsApp/Mercado Pago/IA/R2 são opcionais (providers `mock`).

Em `production`, a API recusa subir sem `DATABASE_URL` e `REDIS_URL`. Secrets de WhatsApp/OpenAI/R2 podem ser placeholders (`aguardando_meta`); o boot cai para providers mock em vez de crashar. `JWT_SECRET` é aceito como alias de `ADMIN_SESSION_SECRET`.

Valores monetários entram como inteiros em centavos (`299` = R$ 2,99). Datas no banco em UTC; `DISPLAY_TIMEZONE=America/Sao_Paulo` só para apresentação.
