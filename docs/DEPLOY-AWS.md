# Deploying FOUR on AWS

One EC2 instance runs the whole platform with `docker compose`: Caddy on 80/443
terminating TLS, the storefront, the API, and Postgres. Nothing else is
published to the internet.

## Why one instance, deliberately

The API keeps live state in memory. Socket.IO has **no Redis adapter**, and the
rate limiter has no shared store, so two API instances would not share rooms: a
status tapped on the kitchen console would reach only the customers whose
browsers happened to be connected to the same instance, and the other half of
the tracking pages would sit on a stale status forever.

Running exactly one API container is therefore correct, not a shortcut. Before
this can scale horizontally someone has to add `@socket.io/redis-adapter` and a
shared rate-limit store. Until then, resist the urge to put this behind an
autoscaling group.

For one restaurant this is the right size. Vertical scaling (a bigger instance)
carries it a long way.

## What you need first

- A domain you control, e.g. `order.four.pk`
- An AWS account with permission to create EC2 instances, security groups and
  Elastic IPs

## 1. Launch the instance

| Setting | Value |
|---|---|
| AMI | Ubuntu Server 24.04 LTS |
| Type | `t4g.small` (2 vCPU, 2 GB, arm64) — add swap, see below. `t4g.medium` if you would rather not think about it |
| Storage | 30 GB gp3 |
| Key pair | one you hold; you will need SSH |

Graviton (`t4g`) is the cheaper family and the images build fine on it — Prisma
resolves its `native` engine at build time, and the build runs on this same
instance, so the architecture always matches.

**Security group** — only three rules:

| Port | Source | Why |
|---|---|---|
| 22 | your IP only | SSH. Not `0.0.0.0/0` |
| 80 | `0.0.0.0/0` | Let's Encrypt validation, redirect to 443 |
| 443 | `0.0.0.0/0` | the site |

Postgres (5432), the API (4000) and the storefront (3000) are deliberately
absent — they are reachable only on the internal Docker network.

Allocate an **Elastic IP** and associate it, so a stop/start does not change the
address your DNS points at.

## 2. Point DNS at it

An `A` record for `order.four.pk` → the Elastic IP. Confirm before continuing,
because Caddy will ask Let's Encrypt for a certificate and repeated failures are
rate limited:

```bash
dig +short order.four.pk
```

## 3. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu   # log out and back in for this to take effect
```

On a 2 GB instance, give the Next.js build room so it is not OOM-killed:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Fetch the code and write the environment

```bash
sudo mkdir -p /opt/four && sudo chown ubuntu:ubuntu /opt/four
git clone https://github.com/syncoretech01/four.git /opt/four
cd /opt/four
```

Create `/opt/four/.env`. Generate the secrets rather than inventing them:

```bash
cat > .env <<EOF
DOMAIN=order.four.pk
PUBLIC_URL=https://order.four.pk
POSTGRES_PASSWORD=$(openssl rand -hex 24)
APP_SECRET=$(openssl rand -hex 24)
ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=' | head -c 16)
POS_PROVIDER=console
EOF
chmod 600 .env
grep ADMIN_PASSWORD .env    # the kitchen console password - save it somewhere
```

`PUBLIC_URL` must be the `https://` address. The API only marks its session
cookie `Secure` when `WEB_ORIGIN` starts with `https`, and Next bakes
`NEXT_PUBLIC_API_URL` into the browser bundle at build time — so if you change
the domain later, rebuild the web image, do not just restart it.

## 5. Start it

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First run takes several minutes: it builds both images, applies the migration,
and seeds the menu. Watch it come up:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

Then check from your own machine:

```bash
curl -sS https://order.four.pk/api/menu | head -c 200   # menu from Postgres
curl -sSI https://order.four.pk/                        # 200, valid certificate
```

Certificate issuance takes a few seconds on first boot. If it fails, the cause
is almost always DNS not yet pointing at the instance, or port 80 blocked.

## 6. Backups

You are running Postgres on the same instance as everything else, so losing the
instance loses the orders. `deploy/backup.sh` dumps the database and, when
`BACKUP_S3_URI` is set, copies the dump off the box — which is the part that
actually protects you.

Attach an instance role allowing `s3:PutObject` on your backup prefix (no access
keys to store), then:

```bash
sudo mkdir -p /var/backups/four
echo 'BACKUP_S3_URI=s3://four-backups/postgres' | sudo tee -a /etc/environment
sudo crontab -e
# 0 3 * * * BACKUP_S3_URI=s3://four-backups/postgres /opt/four/deploy/backup.sh >> /var/log/four-backup.log 2>&1
```

Dumps are kept 14 days locally (`RETAIN_DAYS`). **Restore once, on a throwaway
instance, before you need it** — `deploy/restore.sh <dump.sql.gz>`. A backup
nobody has restored is a guess.

## 7. Deploying a change

```bash
cd /opt/four
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations apply automatically when the API container starts, and the seed is
idempotent — it will not reset item availability that staff have toggled.

There is a short gap while containers restart. For one restaurant that is
acceptable; take it during closed hours.

## 8. Before real orders

- [ ] `ADMIN_PASSWORD` recorded somewhere the kitchen can find it, and not the generated default
- [ ] A backup has been taken **and restored** at least once
- [ ] `POS_PROVIDER` set to whatever operations confirmed (see `docs/POS-INTEGRATION.md`) — `console` means orders reach the kitchen console only
- [ ] A phone number published on the site, so a failed order has somewhere to go
- [ ] Ports 4000, 3000 and 5432 confirmed closed from outside: `nmap -Pn order.four.pk`

## Running costs

Roughly, in `ap-south-1` (Mumbai — closest region to Lahore):

| Item | Monthly |
|---|---|
| `t4g.small` on demand | ~$12 |
| 30 GB gp3 | ~$2.40 |
| Elastic IP (while associated) | $0 |
| S3 backups (a few GB) | < $1 |
| **Total** | **~$15** |

A one-year Savings Plan takes roughly 30% off the instance. `t4g.medium`
instead is about $24/month.
