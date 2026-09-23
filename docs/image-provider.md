# Image provider

Status: **MOCK**.

Interface `ImageProvider` em `packages/shared` (`generate` / `edit`).

A escolha do provider real (OpenAI, Replicate ou outro) fica para a Fase 7, após consulta à documentação oficial vigente — incluindo webhook, assinatura e retenção de artefatos.

Nunca bloquear o webhook HTTP esperando a IA.
