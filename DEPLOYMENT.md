# Udhëzuesi i Vendosjes në Prodhim (Portainer, Docker & Cloudflare Tunnel)

Ky dokument shpjegon hap pas hapi vendosjen e **Posta Fast** në një server (VPS, Homelab, ose Cloud) duke përdorur **Portainer**, **Docker**, dhe **Cloudflare Tunnel** për lidhje të sigurt pa pasur nevojë të hapni porte në router/firewall (Zero Port Forwarding).

---

## 1. Skedarët e Konfigurimit të Krijuar

* [`Dockerfile`](./Dockerfile): Ndërtim me disa faza (multi-stage) i optimizuar me `node:20-alpine`, `output: "standalone"` në Next.js, dhe përdorues të sigurt `nextjs:nodejs` (non-root).
* [`docker-compose.yml`](./docker-compose.yml): Stack gati për Portainer me shërbimin `app` dhe shërbimin e tunelit `cloudflare/cloudflared`.
* [`.dockerignore`](./.dockerignore): Parandalon ngarkimin e `node_modules`, `.next`, dhe skedarëve `.env` gjatë ndërtimit të imazhit.
* [`.env.example`](./.env.example): Shembull i variablave të mjedisit.

---

## 2. Hapi 1: Krijimi i Tunelit në Cloudflare Zero Trust

1. Hyni në llogarinë tuaj në [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Shkoni te **Networks** &rarr; **Tunnels** &rarr; **Add a Tunnel**.
3. Zgjidhni **Cloudflared** si llojin e lidhjes dhe vendosni një emër (p.sh. `posta-fast-tunnel`).
4. Te hapi **Install and run a connector**:
   - Zgjidhni opsionin **Docker**.
   - Do t'ju shfaqet një komandë me një token të gjatë:
     `--token eyJhIjoi...`
   - Kopjoni këtë token (kjo është vlera e `CLOUDFLARE_TUNNEL_TOKEN`).
5. Te skeda **Public Hostname**:
   - **Subdomain**: p.sh. `posta` (ose lëreni bosh për root domain).
   - **Domain**: Zgjidhni domenin tuaj të menaxhuar nga Cloudflare (p.sh. `example.com`).
   - **Type**: `HTTP`
   - **URL**: `app:3000` *(sepse kontenti i cloudflared dhe app ndodhen në të njëjtin rrjet Docker `posta-net`)*.
   - Klikoni **Save tunnel**.

---

## 3. Hapi 2: Vendosja e Stack-ut në Portainer

### Opsioni A: Direkt nga Repozitori GitHub (Rekomanduar)

1. Hapni panelin e **Portainer** (p.sh. `https://your-server-ip:9443`).
2. Zgjidhni ambientin tuaj (p.sh. **local** ose **primary**).
3. Shkoni te **Stacks** &rarr; **Add stack**.
4. Zgjidhni opsionin **Repository**:
   - **Name**: `posta-fast`
   - **Repository URL**: `https://github.com/NextDeveloperNetwork/posta-fast.git`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`
5. Te seksioni **Environment variables**, shtoni variablat e mëposhtme:
   - `DATABASE_URL`: Lidhja juaj e bazës së të dhënave Neon/Postgres.
   - `AUTH_SECRET`: Çelësi sekret i NextAuth (gjenerojeni me `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: Domini juaj i plotë publik në Cloudflare (p.sh. `https://posta.yourdomain.com`).
   - `CLOUDFLARE_TUNNEL_TOKEN`: Token-i i marrë nga Cloudflare Zero Trust në Hapin 1.
6. Opsionale (Për përditësime automatike):
   - Aktivizoni **Git repository polling** ose krijoni një **Webhook** në Portainer që ta lidhni me GitHub Actions/Webhooks për ri-ndërtim automatik me çdo `git push`.
7. Klikoni **Deploy the stack**.

---

### Opsioni B: Vendosja Lokale / Manuale me Docker CLI

Nëse dëshironi ta testoni me komanda në terminalin e serverit:

```bash
# 1. Krijoni skedarin .env nga shembulli
cp .env.example .env

# 2. Vendosni kredencialet tuaja në .env
nano .env

# 3. Ndërtoni dhe ngrini kontejnerët në prapaskenë
docker compose up -d --build

# 4. Kontrolloni log-et
docker compose logs -f
```

---

## 4. Përparësitë e Këtij Konfigurimi

| Veçoria | Përshkrimi |
| :--- | :--- |
| **Zero Port Forwarding** | Nuk nevojitet të hapni portën 80 ose 443 në router ose VPS. Serveri është tërësisht i izoluar. |
| **Certifikatë SSL Falas & Automatike** | Cloudflare menaxhon automatikisht certifikatën HTTPS/SSL me enkriptim të plotë end-to-end. |
| **Mbrojtje nga Sulmet DDoS** | I gjithë trafiku kalon përmes rrjetit global Anycast dhe WAF të Cloudflare. |
| **Madhësi Minimale e Imazhit** | Përdorimi i `output: "standalone"` në Next.js redukton madhësinë e kontejnerit nën 150MB. |
| **Restart Automatik** | Politika `restart: unless-stopped` garanton rindezjen e shërbimit automatikisht pas çdo fikjeje serveri. |
