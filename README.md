# IoT Proxy Server

The proxy has been developed to link a connected device (e.g. Arduino with Ethernet/WiFi shield) to Salesforce, using Platform Events.

The device should make a `POST` call to `https://proxy.doma.in/temperature` (or `http://localhost:3000/temperature`) passing the following JSON as body:
```json
{
    "temperature": 30,
    "device_id": "XXXXXXXX"
}
```

The proxy logs in to Salesforce using the provided username/password with a *OAuth Password flow* and writes the `Temperature_Notification__e` platform event: an orchestration handles this event.

## Run Locally
Update the `.env` file with the following values:

* `SF_CLIENT_ID`: Salesforce Connected App Client Key
* `SF_CLIENT_SECRET`: Salesforce Connected App Client Secret
* `SF_USERNAME`: Salesforce username
* `SF_PASSWORD`: Salesforce password + token
* `SF_LOGIN_URL`: login.salesforce.com

Run with **foreman**:

```
npm install foreman -g
nf start
```
