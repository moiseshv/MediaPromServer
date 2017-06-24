
Parse.Cloud.define('hello', function (req, res) {
   res.success('Hello from MediaPom');
});


Parse.Cloud.define('hello1', function(req, res) {
  res.success('Hi');
});

// Ping de un Device trae el ID del Device, y Su estado
// Hay que garantizar que el cliente envie un status
// playing, stoped, noHDMI
// functions/devicePing  
// {"deviceID" : "s99179l4LT" ,"deviceStatus" : "playing" }
Parse.Cloud.define("updateDeviceStatus", function (request, response) {

  console.log("Parametros: ");
  console.log(request.params);
  var dId = request.params.deviceID;
  var dStatus = request.params.deviceStatus;

  if (!dId || dId == "") {
    response.error("NO Device defined");
  }

  if (!dStatus || dStatus == "") {
    response.error("NO Status defined");
  }

  var activated_status = (dStatus == "Activated");
  // Query para los Devices
  var query = new Parse.Query("Device");
  query.get(dId).then(function (device) {
    console.log(device);
    var now = new Date();
    console.log(now);
    device.set('lastPingDate', now);
    device.set("status", dStatus);
    if (activated_status) {
      device.set("onSystem", true);
    }
    device.save();
    response.success("Hello Device, Ping received");
  }, function (error) {
    // The object was not retrieved successfully.
    // error is a Parse.Error with an error code and message.
    response.error(error);
  });

});


// Lista Actualizada de los videos que hay sido play y sus tiempos.
// Cada device envía cada cierto tiempo esta lista se barren los videos
// y se les agregan estos tiempos
// Si es sucess el device limpiará sus contadores.
// Es mejor asi porque usas un solo endpoint y hará menos request que cuestan
//functions/addServerVideoPlays
// {"deviceID" : "s99179l4LT" , "plays" : [ {"videoID": "bz3pn2CPTN" ,"time" : "33"} , {"videoID": "bz3pn2CPTN" ,"time" : "23"}] }

Parse.Cloud.define("addServerVideoPlays", function (request, response) {
  // Arreglo que tiene [{"videoID" , "time"}]
  var videoPlays = request.params.plays;
  var dID = request.params.deviceID;
  var deviceQuery = new Parse.Query("Device");
  var videoQuery = new Parse.Query("MediaItem");
  var responseMsg = "";

  videoCount = 0;
  []
  deviceQuery.get(dID)
    .done(function (result) {
      if (!result) {
        response.error('Sorry, this device is no longer available.');
        return Parse.Promise.error('Sorry, this device is no longer available.');

      } else {
        // Aqui es que hay un device
        device = result;
        console.log(' Device Found ');
        var promiseCollection = [];
        // Barrer cada video
        videoPlays.forEach(function (play) {
          // videoID
          var videoID = play.videoID;
          var videoTime = play.time;

          console.log("Usando video");
          console.log(videoID);

          var promise = videoQuery.get(videoID).done(function (video) {
            if (video) {
              videoCount = videoCount + 1;
              console.log('encontrado video' + videoCount);
              var newPlay = new Parse.Object("Plays");
              newPlay.set("device", device);
              newPlay.set("item", video);
              newPlay.set("time", videoTime);
              console.log("Before save play");
              newPlay.save();
            }
          });
          promiseCollection.push(promise);
        });

        Parse.Promise.when(promiseCollection).done(function () {

          console.log(videoCount);
          // response for client
          if (videoCount > 0) {
            response.success("Updated " + videoCount + " Videos");

          }
          else {
            response.error("NO videos Updated ");
          }
          // response for client
        })
          .fail(function () {
            if (videoCount > 0) {
              response.success("Updated " + videoCount + " Videos");

            }
            else {
              response.error("NO videos Updated ");
            }
            // response for client
          });
        //
      }
    })
    .fail(function () {
      response.error('An error has occurred. NO device found.');
    });
});


// getRelatesMedias
// Cada device tiene asociados videos que pueden reproducirse 
// El server le entrega la que tiene en ese momento
// functions/getRelatesMedias  
// {"deviceID" : "s99179l4LT"}
Parse.Cloud.define("getRelatesMedias", function (request, response) {
  var dID = request.params.deviceID;
  if (dID == "") {
    response.error("NO Device defined");
  }
  //console.log("device ID")
  //console.log(request.params.deviceID)
  //console.log(dID)

  var deviceQuery = new Parse.Query("Device");

  deviceQuery.get(dID).then(function (device) {
    // El device tiene una lista de items a reproducir
    var relationItems = device.relation("items");
    relationItems.query().find({
      success: function (list) {
        response.success(list);
      },
      error: function (error) {
        response.error(error);
      }
    });
  });
});


// UpdateDeviceList
// Cada device envía cada cierto tiempo un request para actualizar su lista de reproducciÓn
// El server le entrega la que tiene en ese momento
// functions/updateDeviceList  
// {"deviceID" : "s99179l4LT"}
Parse.Cloud.define("updateDeviceList", function (request, response) {
  var dID = request.params.deviceID;
  if (dID == "") {
    response.error("NO Device defined");
  }
  console.log("device ID")
  console.log(dID)


  var deviceQuery = new Parse.Query("Device");

  deviceQuery.get(dID).then(function (device) {
    // El device tiene una lista de items a reproducir
    console.log(device);
    var mediaListQuery = new Parse.Query("MediaList");
    mediaListQuery.equalTo("device", device);
    mediaListQuery.first().then(function (medialist) {
      console.log(medialist);
      // El device tiene una lista de items a reproducir
      var relationItems = medialist.relation("items");
      console.log(relationItems);
      relationItems.query().find({
        success: function (list) {
          response.success(list);
        },
        error: function (error) {
          console.log("errr aca");
          response.error(error);
        }
      });
    });

  });


});




