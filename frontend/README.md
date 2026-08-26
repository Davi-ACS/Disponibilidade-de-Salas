# Frontend — Salas UFRRJ

Frontend standalone **sem build**, consome `GET /api/v1/*` quando o backend FastAPI estiver no ar, mas já funciona com mocks.

```
frontend/
├── index.html              # Landing
└── src/
    ├── styles/main.css     # Design system completo
    ├── js/app.js           # Tema/menu/toast
    └── pages/
        ├── schedule.html   # Grade + filtros
        ├── agendar.html    # Agendamento
        ├── consulta.html   # Meus agendamentos
        ├── slides.html     # Quiosque (auto-refresh 60s)
        └── admin.html      # Admin
```

Abrir:

```bash
# servir
python -m http.server 5173 --directory frontend
# ou via uv
uv run python -m http.server 5173 --directory frontend
```
