"""
app/api/v1/auth.py
Rotas de autenticação Google OAuth (@ufrrj.br).

TODO (FastAPI):
- GET /login -> redirect Google authorize
- GET /callback -> authorize_access_token, get userinfo, validar domínio ufrrj.br, criar session/JWT
- POST /logout
- GET /me (current user)

Equivalente Flask: /login, /authorize, /logout
"""
