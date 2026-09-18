# LeadFlow Postman Collection

Import `LeadFlow Mini CRM.postman_collection.json` into Postman.

Before running `2. Auth → Login`, open the collection variables and replace only:

- `adminEmail` with the `ADMIN_EMAIL` from `api/.env`
- `adminPassword` with the `ADMIN_PASSWORD` from `api/.env`
- `apiSecret` with the `API_SECRET` from `api/.env`

The collection automatically saves the JWT as `token` after login and saves the created MongoDB ID as `leadId`. Run the requests in order:

1. Health
2. Login
3. WordPress Integration or Create Dashboard Lead
4. List/Search/Get/Update/Status
5. Stats and Angular Insights
6. Delete (optional; it removes the generated test lead)

The collection does not contain MongoDB credentials or any real secret.
