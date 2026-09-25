- Hard Rules
  - Keep changes scoped to this repository.
  - Do not commit changes unless explicitly requested.
  - Keep `go.mod` and `go.sum` in sync with Go dependency changes.
  - Use existing build files and package scripts before adding new tooling.
  - Use package scripts from `package.json` for frontend build and lint.

- Authority & Links
  - Project README: `README.md`.
  - Go module: `github.com/support-pl/nocloud-app`.
  - `go.mod`.
  - `package.json`.
  - `pnpm-lock.yaml`.
  - `Dockerfile`.
  - `docker-compose.yml`.
  - Entrypoint: `main.go`.

- Setup / Test
  - Use `go mod download` to fetch Go module dependencies.
  - Use `go test ./...` for Go package checks.
  - Use `pnpm install` before package scripts.
  - No `test` script is defined in `package.json`.

- Workflow
  - `go mod download`
  - `go test ./...`
  - `go run .`
  - `pnpm install`
  - `pnpm run build`

- Stop Conditions
  - Ask before using or changing secrets, credentials, or `.env` files.
  - Ask before broad regeneration or formatting that changes unrelated files.
  - Ask if required external services, credentials, or generator plugins are missing.
  - Refuse destructive git operations unless explicitly requested.
  - Omit uncertain repository rules instead of guessing.
