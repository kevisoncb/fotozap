# Privacy

O produto processa fotos enviadas pelo próprio usuário via WhatsApp.

Estratégia prevista (implementação na Fase 2/10):

- comando `APAGAR` / `/deletar` com confirmação
- cancelar jobs pendentes quando possível
- apagar objetos R2
- anonimizar telefone/nome
- manter registros financeiros sem identidade direta quando houver obrigação
- TTL de imagens curto (input 24h, output 7d)

Nada disso está ligado ao bot ainda.
