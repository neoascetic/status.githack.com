# status.githack.com

Effortless, open-source status pages for your sites and APIs — with GitHub Actions integration.

## Why use status.githack.com?

- **Instant status page**: Get a beautiful, public dashboard for your service uptime in minutes.
- **Automated monitoring**: Checks your endpoints on schedule and logs results automatically.
- **Transparent & open**: All data and history are stored in your own GitHub repository.
- **No vendor lock-in**: You control your data, your config, and your branding.
- **Free & open-source**: No hidden fees, no limits, no closed code.

## How it works

1. **Create your own status repository**
   - Click "Use this template" on GitHub to create your own repository from this template.
   - No need to create any branches manually — just use the default `master` branch.
2. **Configure your services**
   - Add your endpoints to the `status.cfg` file in your new repository.
     - Example:
       ```
       google https://www.google.com
       github https://www.github.com
       my_service https://my.service.com
       ```
3. **Automated checks**
   - GitHub Actions will be set up automatically — no extra steps required.
   - The workflow will start checking your services and updating `log.csv` on schedule.
4. **Share your status page**
   - Your status dashboard is instantly available at:
     ```
     https://status.githack.com?r=your-username/your-repo
     ```
   - No need to deploy or host anything yourself.

## Configuration

- `status.cfg`: List of services to monitor. Each line: `<id> <url> [curl options]`
- `log.csv`: Automatically updated log of checks (do not edit manually).

## Who is it for?
- Indie hackers, open-source maintainers, small teams, and anyone who wants a simple, transparent status page without SaaS lock-in.

## Why status.githack.com?
- **Trust**: All checks and logs are public and auditable.
- **Simplicity**: No complex setup, no accounts, no billing.
- **No vendor lock-in**: You keep full control of your data and monitoring history.

---

Want a status page like this for your own project? Create your own repo from this template and show your users you care about uptime! 