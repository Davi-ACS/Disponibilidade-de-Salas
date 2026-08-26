# Próximos Passos — Refatoração Flask → FastAPI + UV

> De onde estamos (scaffold vazio) até a **versão final 2.0** em produção.
> Todos os arquivos citados já existem como placeholders — basta preencher na ordem abaixo.

**Stack final:** FastAPI + SQLModel/SQLAlchemy 2.0 + Alembic + Authlib (Google @ufrrj.br) + Jinja2 + `frontend/` vanilla moderno + **UV** como gerenciador.

---

## 0) Estado atual

- [x] Estrutura criada: `app/core`, `app/models`, `app/schemas`, `app/api/v1`, `app/services`, `app/templates`, `app/static` — todos com `TODO` sem código (`app/main.py:1`)
- [x] `frontend/` completo e navegável (`frontend/index.html:1`, `frontend/src/styles/main.css:1`)
- [x] `pyproject.toml:1`, `.python-version:1`, `.env.example:1`, `Makefile:1`, `README.md:1`
- [x] `app.py` legado ainda intacto (referência para migração)

**Antes de começar:** decida se o frontend final será **(A) SSR via `app/templates`** ou **(B) SPA estático `frontend/` consumindo API** (recomendado B, mantendo `app/templates` como fallback para quiosque/SEO).

---

## Fase 1 — Fundação (1-2 dias) — `BLOQUEANTE para todo o resto`

**Objetivo:** `uv run uvicorn app.main:app --reload` subir sem erro.

1. **UV e ambiente**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh  # ou pipx install uv
   cp .env.example .env  # preencher GOOGLE_CLIENT_ID/SECRET, SECRET_KEY
   uv sync               # cria .venv + uv.lock a partir de pyproject.toml:17
   uv run ruff check .   # deve passar vazio
   ```

2. **Implementar `app/core/config.py:1`**
   - `class Settings(BaseSettings)` com `DATABASE_URL`, `SECRET_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`
   - `model_config = SettingsConfigDict(env_file=".env")`
   - Exportar `settings = Settings()`

3. **Implementar `app/core/database.py:1`**
   - `engine = create_async_engine(settings.DATABASE_URL)` ou `create_engine` sync para começar simples (sqlite `sqlite:///./database.db`)
   - `SessionLocal`, `Base = declarative_base()`
   - `def get_db()` como dependency (`yield db`)
   - `async def init_db()` / `lifespan` que chama `Base.metadata.create_all`

4. **Implementar `app/main.py:1`**
   - `app = FastAPI(title="Disponibilidade de Salas - UFRRJ", version="2.0.0")`
   - `app.include_router(api_router, prefix="/api/v1")` de `app/api/router.py:1`
   - `CORSMiddleware` liberando `FRONTEND_URL`
   - `app.mount("/static", StaticFiles(directory="app/static"), name="static")`
   - `lifespan` que chama `init_db()` (substitui `app.py:404` `before_request create_tables`)
   - Validar: `uv run uvicorn app.main:app --reload` → `http://localhost:8000/docs` deve abrir (vazio)

**DoD Fase 1:** `/docs` abre, `http://localhost:8000/api/v1/health` (crie temporário) retorna `{"status":"ok"}`.

---

## Fase 2 — Modelos, Schemas e Migração de Dados (2-3 dias)

1. **`app/models/aula.py:1` e `app/models/solicitacao.py:1`**
   - Migrar `app.py:23` `class Aula` e `app.py:71` `class Solititacao` (corrigir typo → `Solicitacao`)
   - Usar `SQLModel` ou `SQLAlchemy` com tipagem: `id: int | None = Field(default=None, primary_key=True)`, etc.
   - Campos exatos: `Bloco, Sala, inicio, fim, Conteudo, Responsavel, Dia, Vencimento` e `numero_pedido, email, responsavel, aprovado`
   - Criar `app/models/__init__.py:1` exportando ambos

2. **`app/schemas/aula.py:1`, `solicitacao.py:1`, `common.py:1`**
   - `AulaBase`, `AulaCreate`, `AulaRead`; `SolicitacaoCreate` (valida `bloco/dia/sala/inicio/fim/motivo`), `SolicitacaoRead`, `Card` (para `get_card` em `app.py:356`), `ScheduleResponse`, `Message`

3. **Alembic**
   ```bash
   uv run alembic init alembic  # já existe alembic.ini:1 placeholder
   # editar alembic/env.py para importar Base de app.core.database
   uv run alembic revision --autogenerate -m "init aula e solicitacao"
   uv run alembic upgrade head
   ```

4. **Migração do `database.db` legado**
   - Copiar `database.db` do Flask para `./database.db` e rodar `uv run python scripts/seed.py` ou script de import que lê o sqlite antigo e insere via nova `Session`

**DoD Fase 2:** `uv run alembic upgrade head` cria tabelas; `SELECT * FROM aula` retorna dados do legado.

---

## Fase 3 — Services (lógica pura, sem HTTP) (1-2 dias)

1. **`app/services/schedule_service.py:1`**
   - Portar `app.py:312` `get_schedule(day, bloco)` → `def get_schedule(db: Session, day: str, bloco: str) -> dict`
   - Portar `app.py:356` `get_card(email)` → `def get_card(db: Session, email: str) -> list[dict]`
   - Manter `hours` fixo `08:00-22:00` e lógica `schedule[sala][time_slot]`
   - Escrever testes unitários puros em `tests/test_salas.py:1` (mock DB)

2. **`app/services/scraper_service.py:1`**
   - Portar `app.py:373` `atualizarBD()` (BeautifulSoup + `horario/administrativo.html`)
   - Adicionar `def parse_horario(html_path: str) -> list[AulaCreate]` + `def upsert_aulas(db, aulas)`
   - Expor CLI: `if __name__ == "__main__": atualizar_bd()`

**DoD Fase 3:** `uv run python -m app.services.scraper_service` popula `aula` sem duplicar; `get_schedule` retorna estrutura idêntica ao Flask.

---

## Fase 4 — Auth (Google @ufrrj.br) (2 dias) — `BLOQUEANTE para /agendar e /admin`

1. **`app/core/security.py:1`**
   - Registrar `oauth = OAuth(); oauth.register(name="google", ...)` migrando `app.py:98`
   - `create_access_token`, `decode_token` (JWT via `python-jose`)
   - Validador `domain == "ufrrj.br"` (de `app.py:131`)

2. **`app/core/dependencies.py:1`**
   - `get_current_user(request)`, `require_ufrrj_user`, `require_admin`

3. **`app/api/v1/auth.py:1`**
   - `GET /auth/login` → `google.authorize_redirect` (ex-`app.py:114`)
   - `GET /auth/callback` → `authorize_access_token`, `userinfo`, set cookie/JWT, redirect `/consulta` (ex-`app.py:122`)
   - `POST /auth/logout` e `GET /auth/me` (ex-`app.py:139`)

**DoD Fase 4:** Login com conta `@ufrrj.br` funciona; conta `@gmail.com` é rejeitada com 403; `/api/v1/auth/me` retorna usuário quando logado.

---

## Fase 5 — API REST (3-4 dias) — coração da refatoração

Implementar na ordem de dependência, sempre usando `Depends(get_db)` e services da Fase 3:

| Arquivo | Rotas | Origem Flask | Notas |
|---|---|---|---|
| `app/api/v1/salas.py:1` | `GET /`, `GET /blocos?dia=&bloco=`, `GET /slides` | `app.py:151`, `app.py:284`, `app.py:300` | Públicas, sem auth. `schedule.html` consome `get_schedule`. |
| `app/api/v1/agendamento.py:1` | `GET /agendar`, `POST /agendar` | `app.py:229`, `app.py:249` | `POST` exige `require_ufrrj_user`; body JSON `{bloco,dia,sala,inicio,fim,motivo,vencimento}` |
| `app/api/v1/consulta.py:1` | `GET /consulta` | `app.py:273` | Exige auth; retorna `get_card(email)` |
| `app/api/v1/admin.py:1` | `GET /admin`, `GET /solicitacoes`, `POST /aprovar`, `POST /rejeitar` | `app.py:156`, `app.py:180`, `app.py:190`, `app.py:206` | Exige `require_admin`; corrigir bug `Hora` em `app.py:199` |

- **`app/api/router.py:1`** agregar: `api_router.include_router(auth.router, prefix="/auth")` etc.
- Documentar cada rota com `response_model` e `tags` para Swagger ficar útil.

**DoD Fase 5:** Todas as rotas do Flask têm equivalente FastAPI; `frontend/src/pages/schedule.html:1` e `agendar.html:1` funcionam trocando `fetch('/salas/agendar_sala')` por `fetch('/api/v1/agendar')`.

---

## Fase 6 — Templates / Frontend integração (2-3 dias)

**Escolha A (SSR):** adaptar `templates/` legados para `app/templates/`:
- `app/templates/base.html:1` → layout com `request.url_for('static', path='css/main.css')`
- Portar `templates/Index.html:1`, `schedule.html:1`, `Agendar.html:1`, `Consulta_Rework.html:1`, `Slides.html:1` usando `Jinja2` do FastAPI (` Jinja2Templates(directory="app/templates")`)
- Migrar `static/schedule.js:1`, `Slides.js:1` para `app/static/js/`

**Escolha B (recomendado, já pronto):** servir `frontend/`:
- Em `app/main.py:1` adicionar `app.mount("/", StaticFiles(directory="frontend", html=True))` **depois** do `api_router`
- Atualizar `frontend/src/js/app.js:1` e páginas para chamar `fetch('/api/v1/...')` com `credentials: "include"`
- Unificar design: `frontend/src/styles/main.css:1` já é o design final — copiar para `app/static/css/main.css:1` se manter SSR

**DoD Fase 6:** Usuário consegue navegar `frontend/index.html:1` → `schedule.html` → `agendar.html` → `consulta.html` sem erro 404; quiosque `slides.html` roda em fullscreen e auto-refresh 60s.

---

## Fase 7 — Qualidade, Testes e Scripts (2 dias)

1. **Testes `tests/`**
   - `tests/conftest.py:1` → `AsyncClient` + override `get_db` com sqlite `:memory:`
   - `tests/test_auth.py:1`, `test_salas.py:1`, `test_solicitacoes.py:1` (cobrir happy path + 403 @ufrrj.br + admin guard)
   - Rodar `uv run pytest -v --cov` (adicionar `pytest-cov` se quiser)

2. **Lint/Format**
   - `uv run ruff check .` e `uv run ruff format .` (config em `pyproject.toml:68`)
   - `uv run mypy app` (config `pyproject.toml:76`)
   - Adicionar `pre-commit` com ruff/mypy

3. **Scripts `scripts/seed.py:1`**
   - Popular DB de demo para onboarding de novos devs

**DoD Fase 7:** `make test` (ou `uv run pytest`) verde; `make lint` sem erros.

---

## Fase 8 — Deploy e Operação (1-2 dias)

1. **Docker (opcional mas recomendado)**
   ```dockerfile
   FROM python:3.11-slim
   COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
   WORKDIR /app
   COPY pyproject.toml uv.lock ./
   RUN uv sync --frozen --no-dev
   COPY . .
   CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Variáveis prod** em `.env` + `ProxyFix` (já previsto em `app/main.py:1` TODO)
3. **Systemd / Docker Compose** + volume para `database.db` ou migrar para Postgres (`DATABASE_URL=postgresql+asyncpg://...`)
4. **Backup** do `horario/` e cron para `scraper_service` diário

**DoD Fase 8:** `docker compose up --build` sobe API + frontend em `http://servidor/salas/`.

---

## Fase 9 — Versão Final 2.0 — Checklist de entrega

- [ ] `README.md:110` atualizado com URL de prod, credenciais Google e instruções `uv sync`
- [ ] `app.py` legado removido ou movido para `legacy/` (manter `database.db` migrado)
- [ ] Remover `requirements.txt`, `pips.txt`, `.flaskenv` após confirmar `pyproject.toml` completo
- [ ] Tag `v2.0.0` no git + `uv lock` commitado
- [ ] Documentar no `PROXIMOS_PASSOS.md` o que ficou para `v2.1` (ex: WebSocket para atualização ao vivo, paginação server-side, testes E2E com Playwright)
- [ ] Demo para DCC/IM com quiosque `frontend/src/pages/slides.html` em TV

---

## Ordem sugerida se tempo for curto

**MVP em 1 semana:** Fase 1 → Fase 2 (só `Aula`, sem Alembic) → Fase 3 → Fase 5 (`salas.py` apenas) → Fase 6 (servir `frontend/` estático). Auth e admin ficam para semana 2.

**Caminho crítico:** `Fase 1` → `Fase 2` → `Fase 4` → `Fase 5` (sem isso nada de agendamento funciona).

---

## Comandos de referência

```bash
uv sync                           # instala
uv run uvicorn app.main:app --reload  # dev API
uv run alembic revision --autogenerate -m "msg"
uv run alembic upgrade head
uv run pytest -v
uv run ruff check . && uv run ruff format .
make frontend                     # serve frontend em :5173 (Makefile:1)
```

Dúvidas? Comece pela **Fase 1** — ela desbloqueia todo o resto e valida o `pyproject.toml:17`.
