/**
 * Author: Enrico Murru (https://enree.co)
 */
var request = require('request');
var rp      = require('request-promise');
var pg      = require('pg');
var parse   = require('pg-connection-string').parse;
var fs      = require('fs');

var CLIENT_ID     = process.env.SF_CLIENT_ID;
var CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
var USERNAME      = process.env.SF_USERNAME;
var PASSWORD      = process.env.SF_PASSWORD;
var LOGIN_URL     = 'https://'+(process.env.SF_LOGIN_URL || 'login.salesforce.com')+'/services/oauth2/token';

//the ?ssl=true parameter have to be added when running locale
var POSTGRE_CONN_STR = process.env.DATABASE_URL+'?ssl=true';
var postGreConfig  = parse(POSTGRE_CONN_STR);

var pool = new pg.Pool(postGreConfig);

module.exports = {

    /**
     * Initialize DB
     */
    initDB: function(){
        //DB initialization
        var sql = fs.readFileSync(__dirname+'/db.sql').toString();
        pool.connect(function(err, client, done) {

          if (err) {
            return console.error('error fetching client from pool', err);
          }
          client.query(sql, function(err, result) {
            done();
            if (err) {
              return console.error('error running query', err);
            }
          });
        });
    },

    /**
     * Authorize against the DB
     */
    myAsyncAuthorizer: function(username, password, cb) {

        pool.connect(function(err, client, done) {

            if (err) {
                console.error('error fetching client from pool', err);
                return cb(err, false);
            }

            client.query('Select count(*) From iot_user where username = $1 and password = $2', 
                [username, password],
                function(err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        return cb(err, false);
                    }
                    if(!result || !result.rowCount){
                        return cb(null, false);
                    }
                    return cb(null, true);
            });
        });
    },

    /**
     * Set an "anauthorized request" response
     */
    getUnauthorizedResponse: function(req) {
        return req.auth
            ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
            : 'No credentials provided'
    },

    /**
     * Sends a Salesforce Platform Event using REST APIs
     * @param  {String} url   Salesforce server url
     * @param  {String} token Salesforce session id
     * @param  {Object} event Event object received from the IoT device
     * @return {Promise}
     */
    sendPlatformEvent: function(url, token, event){
        
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
                    'Nutellevel__c': event.level,
                    'Nutellator_ID__c': event.device_id,
                },
            }).then(function (parsedBody) {
                return resolve(parsedBody);
            })
            .catch(function (err) {
                return reject(err);
            });

        });
    },

    /**
     * Login to Salesforce using Oauth 2.0 Username-Password Flow
     * @return {Promise}
     */
    loginWithSalesforce: function(){
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
    },

};