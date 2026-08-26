.PHONY: install dev run test lint format

install:
	uv sync

dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run:
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

test:
	uv run pytest -v

lint:
	uv run ruff check .

format:
	uv run ruff format .

seed:
	uv run python scripts/seed.py

frontend:
	uv run python -m http.server 5173 --directory frontend
