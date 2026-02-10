# DDEV Setup (Local)

This repo is a Next.js PWA. We use DDEV to provide a consistent local URL and containerized runtime.

## Prereqs

- Docker running
- DDEV installed (`ddev --version`)

## Start

1. `ddev start`
2. `ddev describe` (shows the project URL)

If Docker is not running, `ddev` will fail with: `Cannot connect to the Docker daemon`.

## Notes

- `.ddev/config.yaml` starts `next dev` as a `web_extra_daemon` on port `3000`.
- `.ddev/nginx_full/nginx-site.conf` proxies port 80 to `127.0.0.1:3000` so the app works at the DDEV URL.

