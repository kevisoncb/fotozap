# Setup

## Ferramentas nesta máquina

A inspeção da Fase 0 encontrou Windows 10/11 x64 **sem** Node, Git, Docker, winget, Chocolatey ou WSL no PATH.

Para continuar o bootstrap, foram extraídos (fora do Git):

- Node.js 24.21.0 LTS em `.tools/node`
- MinGit 2.55.0.5 em `.tools/git`

```powershell
$env:PATH = "$PWD\.tools\node;$PWD\.tools\git\cmd;" + $env:PATH
```

Instalação de sistema continua recomendada. Docker Desktop precisa ser instalado por você.

## Depois do Docker

```powershell
copy .env.example .env
docker compose up -d
npm install
npm run db:migrate:deploy
npm run db:seed
```
