// Fork & Join Promotional Media Server adding the parse-server module to expose Parse
// compatible API routes.

appConfig = require('./app.json');
//console.log(appConfig);
var databaseUri = appConfig.env.DATABASE_URI.value;
var cloudPath = __dirname + appConfig.env.CLOUD_CODE_MAIN.value;
var APP_ID = appConfig.env.APP_ID.value;
var master_KEY = appConfig.env.MASTER_KEY.value;
var parse_MOUNT = appConfig.env.PARSE_MOUNT.value;
var serverURL = appConfig.env.SERVER_URL.value;

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/mediaprom_server_db',
  cloud: cloudPath || __dirname + '/cloud/main.js',
  appId: APP_ID || 'MEDIA_PROM',
  masterKey: master_KEY || 'MEDIA_PROM_MASTER_KEY', //Add your master key here. Keep it secret!
  serverURL: serverURL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  verifyUserEmails: true,
  emailVerifyTokenValidityDuration: 2 * 60 * 60, // in seconds (2 hours = 7200 seconds)
  preventLoginWithUnverifiedEmail: false, // defaults to false
  
  publicServerURL: serverURL,
  // Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: 'Media Prom Server',
  // The email adapter
  emailAdapter: {
    module: 'parse-server-simple-mailgun-adapter',
    options: {
      // The address that your emails come from
      fromAddress: 'support@forkandjoin.com',
      // Your domain from mailgun.com
      domain: 'forkandjoin.com',
      // Your API key from mailgun.com
      apiKey: 'key-32f2fc775560682ef61d240c93a8262b',
    }
  },

  
  liveQuery: {
    classNames: ["Device", "MediaItem", "Plays"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('MediaProm Server is Up!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('MediaProm server is running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
