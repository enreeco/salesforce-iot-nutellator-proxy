var express    = require('express')
var bodyParser = require('body-parser');
var request = require('request');
var rp = require('request-promise');
var basicAuth = require('express-basic-auth');

var app = express();

app.use(bodyParser.json())

var PORT = process.env.PORT || 3000;
var CLIENT_ID = process.env.SF_CLIENT_ID;
var CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
var USERNAME = process.env.SF_USERNAME;
var PASSWORD = process.env.SF_PASSWORD;
var LOGIN_URL = 'https://'+(process.env.SF_LOGIN_URL || 'login.salesforce.com')+'/services/oauth2/token';

app.get('/', function(req, res){
    return res.send('Salesforce IoT Proxy <br/> &copy; Enrico Murru - WebResults '+((new Date()).getFullYear()));
});

app.use(basicAuth({
    users: {
        'admin': 'supersecret'
    },
    unauthorizedResponse: getUnauthorizedResponse
}));

app.post('/api/level', function (req, res) {
    console.log(req.body);

    loginWithSalesforce()
    .then(function(loginResp) {

        sendPlatformEvent(loginResp.instance_url, loginResp.access_token, req.body)
        .then(function(resp){
            console.log('Salesforce correctly invoked', resp);
        })
        .catch(function(err){
            console.log('FATAL ERROR 1: '+ err);
        });

    }, function(err) {
        console.log('FATAL ERROR 3: '+ err);
    })
    .catch(function(err){
        console.log('FATAL ERROR 4: '+ err);
    });

    return res.send('OK');
});

app.listen(PORT, function(){
    console.log('IoT proxy server listening on port '+PORT+'...');
});

function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

function sendPlatformEvent(url, token, event){
    
    return new Promise(function(resolve, reject) {
    
        rp({
            url: url+'/services/data/v42.0/sobjects/Temperature_Notification__e/',
            headers:{
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token
            },
            method: 'POST',
            json: true,
            json: {
                'Temperature__c': event.temperature,
                'Device_ID__c': event.device_id,
            },
        }).then(function (parsedBody) {
            //console.log('200 OK', parsedBody);
            return resolve(parsedBody);
        })
        .catch(function (err) {
            //console.log('error', err);
            return reject(err);
        });

    });
}

function loginWithSalesforce(){
    return new Promise(function(resolve, reject) {
    
        rp({
            url: 'https://login.salesforce.com/services/oauth2/token',
            method: 'POST',
            formData: {
                'grant_type': 'password',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'username': USERNAME,
                'password': PASSWORD
            },
            transform: function (body) {
                return JSON.parse(body);
            },
        }).then(function (parsedBody) {
            //console.log('200 OK', parsedBody);
            return resolve(parsedBody);
        })
        .catch(function (err) {
            //console.log('error', err);
            return reject(err);
        });

    });
}