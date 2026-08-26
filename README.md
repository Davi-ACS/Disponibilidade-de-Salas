# Disponibilidade de Salas — UFRRJ

> Refatoração Flask → **FastAPI + UV** • Sistema de consulta e agendamento de salas do Instituto Multidisciplinar (Bloco Administrativo, Biblioteca, Informática, Multimídia).

![Python](https://img.shields.io/badge/python-3.11%2B-3776AB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688) ![UV](https://img.shields.io/badge/manager-uv-black) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ O que muda nesta refatoração

| Antes (Flask) | Depois (FastAPI + UV) |
|---|---|
| `app.py` monolito, `requirements.txt` | `app/` modular, `pyproject.toml` + `uv` |
| `Flask-SQLAlchemy` síncrono | `SQLModel`/`SQLAlchemy 2.0` async |
| `Authlib` + session Flask | `Authlib` + JWT/Session + `Depends` |
| `Jinja` via `render_template` | `Jinja2` + API REST documentada (`/docs`) |
| `pip` | `uv` (install 10-100x mais rápido, lock determinístico) |

Frontend novo em `frontend/` — design escuro/claro, responsivo, pronto para consumir a API ou servir via `app/templates` + `app/static`.

---

## 📁 Estrutura

```
.
├── app/                          # Backend FastAPI
│   ├── main.py                   # create_app(), lifespan, routers, StaticFiles
│   ├── core/
│   │   ├── config.py             # Settings (pydantic-settings, .env)
│   │   ├── database.py           # engine, session, get_db, init_db
│   │   ├── security.py           # OAuth Google (@ufrrj.br), JWT
│   │   └── dependencies.py       # get_current_user, require_admin
│   ├── models/
│   │   ├── aula.py               # Modelo Aula (grade oficial)
│   │   └── solicitacao.py        # Modelo Solicitacao (pedidos agendamento)
│   ├── schemas/
│   │   ├── aula.py               # Pydantic AulaCreate/Read
│   │   ├── solicitacao.py        # SolicitacaoCreate/Read, Card
│   │   └── common.py             # Message, ScheduleResponse
│   ├── api/
│   │   ├── router.py             # Agregador APIRouter
│   │   └── v1/
│   │       ├── auth.py           # /login, /callback, /logout, /me
│   │       ├── salas.py          # /blocos, /slides, /
│   │       ├── agendamento.py    # /agendar (GET/POST)
│   │       ├── consulta.py       # /consulta
│   │       └── admin.py          # /admin, /solicitacoes, /aprovar, /rejeitar
│   ├── services/
│   │   ├── schedule_service.py   # get_schedule(), get_card()
│   │   └── scraper_service.py    # atualizarBD() via BeautifulSoup
│   ├── templates/                # Jinja2 (se servir SSR)
│   │   ├── base.html, index.html, schedule.html, agendar.html, consulta.html, slides.html
│   │   └── admin/ dashboard.html, solicitacoes.html
│   └── static/
│       ├── css/ main.css, schedule.css, slides.css
│       ├── js/  main.js, schedule.js, agendar.js, slides.js
│       └── img/
├── frontend/                     # Frontend bonito (standalone, consome API)
│   ├── index.html                # Landing (hero + features + blocos)
│   └── src/
│       ├── styles/main.css       # Design system (tokens, dark/light, responsive)
│       ├── js/app.js             # Tema, menu mobile, toast
│       └── pages/
│           ├── schedule.html     # Grade horária + filtros + paginação
│           ├── agendar.html      # Agendamento autenticado
│           ├── consulta.html     # Meus agendamentos (cards + filtros)
│           ├── slides.html       # Modo quiosque / totens (auto-refresh)
│           └── admin.html        # Painel aprovação/rejeição
├── tests/                        # pytest + httpx
├── scripts/                      # seed.py, scraper CLI
├── horario/                      # HTMLs do horário oficial (input scraper)
├── pyproject.toml                # Dependências + tooling (ruff, mypy, pytest)
├── .python-version               # 3.11 para uv
└── .env.example                  # Template variáveis ambiente
```

> **Arquivos de backend estão com placeholders `TODO` sem código** — prontos para você implementar na refatoração. O frontend (`frontend/`) já está completo e navegável.

---

## 🦀 UV — Gerenciador

[uv](https://docs.astral.sh/uv/) substitui `pip`/`venv`/`poetry`.

```bash
# Instalar uv (Linux/macOS)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Ou via pipx
pipx install uv

# Verificar
uv --version
```

### Comandos principais

```bash
uv sync                  # cria .venv e instala tudo de pyproject.toml (+ cria uv.lock)
uv add fastapi            # adiciona dependência
uv add --dev pytest       # dev dependency
uv run uvicorn app.main:app --reload   # roda dentro do venv sem ativar
uv run pytest
uv lock --upgrade         # atualiza lock
```

---

## 🚀 Como rodar

### 1. Backend (API)

```bash
# Clone
git clone <repo>
cd Disponibilidade-de-Salas

# Env
cp .env.example .env
# edite GOOGLE_CLIENT_ID / SECRET / SECRET_KEY

# Instalar (uv cria .venv sozinho)
uv sync

# Rodar
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Docs
# http://localhost:8000/docs      (Swagger)
# http://localhost:8000/redoc     (ReDoc)
# http://localhost:8000/api/v1/openapi.json
```

### 2. Frontend (standalone, sem build)

É estático — basta abrir no navegador ou servir:

```bash
# Opção A: abrir direto
# abra frontend/index.html no navegador

# Opção B: servir com Python
uv run python -m http.server 5173 --directory frontend
# http://localhost:5173

# Opção C: servir via FastAPI StaticFiles (após implementar app/main.py)
# monte frontend/ em /  e /api/v1 em /api/v1
```

Integração futura: `app/main.py` monta `frontend/` como `StaticFiles` ou mantém `app/templates` para SSR.

---

## 🔐 Autenticação

- OAuth2 Google, **restrito a `@ufrrj.br`** (validado em `security.py`).
- Fluxo: `GET /api/v1/auth/login` → redirect Google → `GET /api/v1/auth/callback` → cria JWT/session → `GET /api/v1/auth/me`.
- `require_admin` via `dependencies.py` para `/api/v1/admin/*`.

---

## 🗃️ Modelos

**Aula** — grade oficial importada do HTML (`horario/administrativo.html`):
`id, Bloco, Sala, inicio, fim, Conteudo, Responsavel, Dia, Vencimento`

**Solicitacao** — pedidos de agendamento:
`numero_pedido (PK), id, email, responsavel, Bloco, Sala, inicio, fim, Dia, vencimento, conteudo, aprovado ∈ {Em análise, Aprovado, Não Aprovado}`

Lógica migrada para `app/services/schedule_service.py` (`get_schedule`, `get_card`) e `app/services/scraper_service.py` (`atualizarBD`).

---

## 🧪 Testes

```bash
uv run pytest -v
uv run ruff check .
uv run ruff format .
uv run mypy app
```

Skeletons em `tests/` (`conftest.py`, `test_auth.py`, `test_salas.py`, `test_solicitacoes.py`).

---

## 📜 Scripts

```bash
uv run python scripts/seed.py              # popula DB demo
uv run python -m app.services.scraper_service  # reimporta horario/*.html
```

---

## 🔄 Migração Flask → FastAPI (checklist)

- [ ] `app.py: Aula/Solititacao` → `app/models/*` (SQLModel)
- [ ] `app.py: get_schedule/get_card/atualizarBD` → `app/services/*`
- [ ] `app.py: /login, /authorize, /logout` → `app/api/v1/auth.py`
- [ ] `app.py: /Blocos/, /Slides/, /` → `app/api/v1/salas.py`
- [ ] `app.py: /Agendar/, /agendar_sala` → `app/api/v1/agendamento.py`
- [ ] `app.py: /Consulta` → `app/api/v1/consulta.py`
- [ ] `app.py: /Admin, /Solicitacoes, /Aprovar, /Rejeitar, /Confirm` → `app/api/v1/admin.py`
- [ ] `templates/*.html` → `app/templates/*` (Jinja2 adaptada) + `frontend/src/pages/*`
- [ ] `static/*` → `app/static/*` + `frontend/src/styles/*`
- [ ] `requirements.txt/.flaskenv/pips.txt` → `pyproject.toml` + `.env`
- [ ] `before_request create_tables` → `lifespan` em `app/main.py`

---

## 🤝 Contribuição

1. Crie branch `feat/...`
2. `uv sync && uv run ruff format . && uv run pytest`
3. PR com descrição + screenshots do frontend se alterar UI.

---

## 📄 Licença

MIT — veja `LICENSE`.

---

## 🙏 Créditos

- DCC/UFRRJ — Instituto Multidisciplinar
- Design frontend: sistema próprio (Inter + JetBrains Mono, gradientes, glassmorphism)
- Backend scaffold preparado para FastAPI + SQLModel + Authlib + BeautifulSoup
