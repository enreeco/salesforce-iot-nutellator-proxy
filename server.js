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

var BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || 'username';
var BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'password';

app.get('/', function(req, res){
    return res.send('Salesforce IoT Proxy <br/> &copy; Enrico Murru - blog.enree.co '+((new Date()).getFullYear()));
});

//Basic Auth Support
//Should be replaced with dynamic user selection
app.use(basicAuth({
    users: {
        BASIC_AUTH_USERNAME: BASIC_AUTH_PASSWORD
    },
    unauthorizedResponse: getUnauthorizedResponse
}));

/**
 * Post Nutellator level
 */
app.post('/api/level', function (req, res) {

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

/**
 * Set an "anauthorized request" response
 */
function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

/**
 * Sends a Salesforce Platform Event using REST APIs
 * @param  {String} url   Salesforce server url
 * @param  {String} token Salesforce session id
 * @param  {Object} event Event object received from the IoT device
 * @return {Promise}
 */
function sendPlatformEvent(url, token, event){
    
    return new Promise(function(resolve, reject) {

        rp({
            url: url+'/services/data/v42.0/sobjects/Nutellevent__e/',
            headers:{
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+token
            },
            method: 'POST',
            json: true,
            json: {
                'Nutellevel__e': event.level,
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

/**
 * Login to Salesforce using Oauth 2.0 Username-Password Flow
 * @return {Promise}
 */
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