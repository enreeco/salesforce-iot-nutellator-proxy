var express    = require('express')
var basicAuth  = require('express-basic-auth');
var bodyParser = require('body-parser');
var pg         = require('pg');
var parse      = require('pg-connection-string').parse;
var utils      = require('./utils');

var PORT = process.env.PORT || 3000;

//DB initialization
utils.initDB();

var app = express();
app.use(bodyParser.json())

/**
 * Root route
 */
app.get('/', function(req, res){
    return res.send('Salesforce IoT Proxy <br/> &copy; Enrico Murru - blog.enree.co '+((new Date()).getFullYear()));
});

/**
 * Basic Auth Support
 */
app.use(basicAuth({
    authorizer: utils.myAsyncAuthorizer,
    unauthorizedResponse: utils.getUnauthorizedResponse,
    authorizeAsync: true,
}));

/**
 * Post Nutellator level API
 */
app.post('/api/level', function (req, res) {

    utils.loginWithSalesforce()
    .then(function(loginResp) {

        utils.sendPlatformEvent(loginResp.instance_url, loginResp.access_token, req.body)
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

