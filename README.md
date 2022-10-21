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
2. Pass it to App container using volume like:

```
volumes:
  - /root/config.json:/app/dist/
```
