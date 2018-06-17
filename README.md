# Author

Enrico Murru (blog.enree.co)


# IoT Proxy Server

The proxy has been developed to link a connected device (e.g. Arduino with Ethernet/WiFi shield) to Salesforce, using Platform Events.

The device should make a `POST` call to `https://proxy.doma.in/api/level` (or `http://localhost:3000/api/level`) passing the following JSON as body:

```json
{
    "level": 30,
    "device_id": "XXXXXXXX"
}
```

Providing a Basic Auth autentication, with the following header:

```
Authorization: BASIC BASE64(username:password)
Content-Type: application/json
```

Users are stored in a PostgreSQL database (see `utils\db.sql`): the database must  initialized with:

```javascript
var utils = require('./utils');
utils.initDB();
```

The proxy logs in to Salesforce using the provided username/password with a *OAuth Username-Password flow* and writes the `Nutellevent__e` platform event: an orchestration handles this event.

## Run Locally
Update the `.env` file with the following values:

* `SF_CLIENT_ID`: Salesforce Connected App Client Key
* `SF_CLIENT_SECRET`: Salesforce Connected App Client Secret
* `SF_USERNAME`: Salesforce username
* `SF_PASSWORD`: Salesforce password + token
* `SF_LOGIN_URL`: login.salesforce.com
* `DATABASE_URL`: PostgreSQL connection string

Run with **foreman**:

```
npm install foreman -g
nf start
```
