# NoCloud End-User App

## Installation

Add this to your nocloud `docker-compose.yml` services:

```yaml
  app:
    image: ghcr.io/support-pl/nocloud-app:latest
    restart: always
    depends_on:
      - proxy
    labels:
      - nocloud.update=true
      - traefik.enable=true
      - traefik.http.routers.app.entrypoints=https
      - traefik.http.routers.app.rule=Host(`app.${BASE_DOMAIN}`)
      - traefik.http.routers.app.tls=true
      - traefik.http.routers.app.tls.certresolver=letsencrypt

      # - traefik.http.routers.app.service=app@docker
      - traefik.http.services.app.loadbalancer.server.port=8080
    environment:
      BASE_URL: "https://api.${BASE_DOMAIN}"
    networks:
      - proxy
```

Run `docker compose up -d`

## Customizing

1. Generate `config.json` using NoCloud Admin.
2. Upload config.json and your logo in /root/deployment/app_config/ directory.
3. Pass it to App container using volume like:

```
volumes:
  - ./app_config/config.json:/dist/config.json
  - ./app_config/logo.svg:/dist/logo.svg
```
