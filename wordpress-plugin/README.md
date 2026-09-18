# LeadFlow Connector

The LeadFlow Connector is a custom WordPress plugin for the LeadFlow Mini CRM. It renders a responsive lead form, saves every submission in WordPress, then sends it securely to the Node API.

## What it includes

- `[leadflow_form]` shortcode for a polished responsive form
- Fields: name, email, phone, service, budget range, and project message
- Browser validation plus server-side validation
- WordPress nonce verification, sanitization, escaping, and capability checks
- Secure server-to-server API sync using the `X-API-Secret` request header
- WordPress admin screens for submitted leads, sync state, API settings, and failed-sync retry
- Clear public success/error notices and internal sync-error detail

## Why a custom post type?

Each submitted lead is stored as a private `leadflow_lead` custom post type. The standard WordPress posts table gives the plugin reliable timestamps, permissions, and querying without introducing a second custom database schema. The lead fields and CRM sync metadata are stored as protected post meta.

## Add the form to a page

1. In WordPress, open **Pages → Add New**.
2. Add a **Shortcode** block.
3. Paste:

   ```text
   [leadflow_form]
   ```

4. Publish the page and open it on the public site.

## Configure CRM sync

1. Start the API from the monorepo root:

   ```bash
   cd api
   npm run dev
   ```

2. In WordPress, open **LeadFlow → Settings**.
3. Set **Node API endpoint** to:

   ```text
   http://host.docker.internal:5000/api/integrations/wordpress/leads
   ```

   The root `docker-compose.yml` maps `host.docker.internal` to your computer, so the WordPress container can reach the API running on the host.

4. Copy the `API_SECRET` value from `api/.env` into **Integration API secret**.
5. Save settings.

The secret is stored in WordPress, is never shown again after saving, and is not committed to Git.

## Lead delivery flow

```text
Visitor submits shortcode form
        ↓
Nonce + server validation
        ↓
Private WordPress lead record
        ↓
POST /api/integrations/wordpress/leads
        ↓
LeadFlow Node API + MongoDB
```

WordPress saves the lead before it makes the API request. If the API is down, misconfigured, or rejects a duplicate, the WordPress record remains available in **LeadFlow → All leads** with a visible sync status and a **Retry CRM sync** button.

## Local plugin location

The root Docker Compose file mounts this directory into:

```text
/var/www/html/wp-content/plugins/leadflow-connector
```

After changing plugin files, refresh the WordPress page. No image rebuild is needed because the directory is bind-mounted.
