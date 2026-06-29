<p align="center">
  <img src="https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cdf1761a-6488-4c88-a8c1-6dae2dc9787e/id-preview-172b41c2--30fe4bfb-1c1c-4517-b45c-eb3890fd1a0f.lovable.app-1781213842463.png" alt="Copa Épica" width="600">
</p>

<h1 align="center">🏆 Copa Épica — Palpites & Ranking</h1>

<p align="center">
  <strong>App brutalista de palpites para a Copa do Mundo FIFA 2026</strong>
  <br>
  Palpite, acompanhe o ranking e dispute com os amigos quem é o maior craque dos palpites.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-002776?style=flat&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/tanstack_start-1.167-009C3B?style=flat" alt="TanStack Start">
  <img src="https://img.shields.io/badge/supabase-2.108-FFDF00?style=flat&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/typescript-5.8-002776?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/vite-8.0-009C3B?style=flat&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/tailwind_css-4.2-FFDF00?style=flat&logo=tailwindcss" alt="Tailwind CSS">
</p>

---

## ✦ Sobre

**Copa Épica** é uma aplicação full-stack para os amantes de futebol que querem testar seus conhecimentos na **Copa do Mundo FIFA 2026**. Cada usuário cria sua conta, palpita os resultados dos jogos antes de cada partida e acumula pontos conforme acerta os placares.

O design segue uma estética **brutalista** inspirada nas cores da bandeira do Brasil:

- <span style="color:#002776">■</span> **Azul** — o Brasil nas costas
- <span style="color:#009C3B">■</span> **Verde** — acertos e pontuação
- <span style="color:#FFDF00">■</span> **Amarelo** — destaques e ações

Tudo com bordas pretas grossas, sombras marcantes e tipografia bold.

---

## ✦ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **🔐 Autenticação** | Cadastro e login com e-mail/senha via Supabase Auth |
| **📋 Palpites** | Envie seus palpites para cada jogo antes da partida começar |
| **📊 Ranking** | Ranking em tempo real de todos os participantes |
| **🏅 Rodadas** | Histórico completo de resultados por rodada com seus acertos/erros |
| **👤 Perfil** | Edite seu nome de exibição e altere sua senha |
| **📈 Pontuação** | 10 pontos por acerto exato, 5 pontos por resultado correto (vencedor/empate) |
| **🔄 Atualização automática** | Cron diário (23:59 BRT) busca resultados da football-data.org |
| **⚡ Botão manual** | Atualize os resultados a qualquer momento com o botão "ATUALIZAR" |

---

## ✦ Como funciona o Palpite

Para cada jogo da Copa, você pode dar seu palpite: quantos gols cada time vai fazer.

**Pontuação:**

- **Placar exato** — Se você acertar o placar certinho (ex: Brasil 2×1 Argentina e o jogo termina 2×1) → **10 pontos**
- **Resultado certo** — Se você acertar quem venceu ou se foi empate, mas errou o número de gols (ex: você colocou Brasil 3×0 e o jogo terminou 2×1) → **5 pontos**
- **Errou** — Se você apostou no time A e o time B venceu → **0 pontos**

**Quando os pontos são calculados?**

Assim que o jogo termina e o resultado é registrado, seus pontos são calculados automaticamente — você não precisa fazer nada.

**Dica:** Você pode editar seu palpite quantas vezes quiser até a bola rolar. Depois que o jogo começa, o palpite é bloqueado.

### Tabela resumo

| Situação | Pontos |
|---|---|
| Placar exato | 10 pts |
| Vencedor/empate certo | 5 pts |
| Errou | 0 pts

---

## ✦ Tech Stack

<div align="center">

| Camada | Tecnologia |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start/latest) (SSR + Server Functions) |
| **Frontend** | React 19 + TypeScript |
| **Roteamento** | TanStack Router *(file-based)* |
| **Estados** | TanStack Query |
| **Build** | Vite 8 + Nitro 3 |
| **Estilos** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Banco** | Supabase (PostgreSQL + RLS) |
| **Autenticação** | Supabase Auth |
| **API de resultados** | [football-data.org](https://www.football-data.org) |
| **Deploy** | Vercel (serverless) |
| **Cron** | GitHub Actions (diário 23:59 BRT) |

</div>

---

## ✦ Começando

```bash
# Clone
git clone https://github.com/DashiLovaB-le/copa-epica.git
cd copa-epica

# Instale as dependências
bun install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, etc.

# Inicie o servidor de desenvolvimento
bun run dev
```

### Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do seu projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Chave anônima (pública) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) do Supabase |
| `FOOTBALL_API_KEY` | Chave da API football-data.org |

---

## ✦ Scripts

```bash
bun run dev          # Servidor de desenvolvimento
bun run build        # Build de produção (Nitro + Vercel)
bun run preview      # Preview do build
bun run lint         # ESLint
bun run format       # Prettier
bun run fetch-results # Busca resultados da API manualmente
```

---

## ✦ Projeto

```
src/
├── assets/               # Imagens estáticas
├── components/           # Componentes React
│   └── ui/               # shadcn/ui primitives
├── hooks/
├── integrations/
│   └── supabase/         # Clientes Supabase (client + admin)
├── lib/
│   ├── api/              # Server Functions (TanStack Start)
│   ├── update-results.server.ts  # Lógica de busca de resultados
│   └── format.ts         # Utilitários de formatação
└── routes/               # Rotas (file-based TanStack Router)
    ├── __root.tsx         # Layout raiz
    ├── auth.tsx           # Login/Cadastro
    └── _authenticated/    # Rotas protegidas
        ├── index.tsx      # Redireciona para /palpites
        ├── palpites.tsx   # Palpites
        ├── ranking.tsx    # Ranking
        ├── perfil.tsx     # Perfil
        └── rodadas.tsx    # Histórico de rodadas
```

---

## ✦ Deploy

O deploy é feito na **Vercel** com o preset Nitro `vercel`:

```bash
bun run build
vercel --prod
```

Ou conecte o repositório no Dashboard da Vercel para deploys automáticos.

---

<p align="center">
  <strong>Copa Épica</strong> — <em>Feito com paixão pelo futebol brasileiro</em> 🇧🇷
  <br>
  <br>
  <img src="https://img.shields.io/badge/feito_no_br 🇧🇷-002776?style=flat" alt="Feito no Brasil">
</p>
