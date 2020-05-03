$(function () {
  let localStream = null;
  let peer = null;
  let existingCall = null;
  let audioSelect = $("#audioSource");
  let videoSelect = $("#videoSource");

  get_query();

  navigator.mediaDevices
    .enumerateDevices()
    .then(function (deviceInfos) {
      for (let i = 0; i !== deviceInfos.length; ++i) {
        let deviceInfo = deviceInfos[i];
        let option = $("<option>");

        option.val(deviceInfo.deviceId);
        if (deviceInfo.kind === "audioinput") {
          option.text(
            deviceInfo.label != "" ? deviceInfo.label : deviceInfo.deviceId
          );
          audioSelect.append(option);
        } else if (deviceInfo.kind === "videoinput") {
          option.text(
            deviceInfo.label != "" ? deviceInfo.label : deviceInfo.deviceId
          );
          videoSelect.append(option);
        }
      }
      videoSelect.on("change", setupGetUserMedia);
      audioSelect.on("change", setupGetUserMedia);
      setupGetUserMedia();
    })
    .catch(function (error) {
      console.error("mediaDevices.enumerateDevices() error:", error);
      return;
    });

  peer = new Peer({
    key: "80156788-28ff-4304-83fc-d04d9bd5d9ad",
    debug: 3,
  });

  peer.on("open", function () {
    // $("#my-id").text(peer.id);
  });

  peer.on("error", function (err) {
    alert(err.message);
  });

  $("#make-call").submit(function (e) {
    e.preventDefault();
    let roomName = $("#join-room").val();
    if (!roomName) {
      return;
    }
    const call = peer.joinRoom(roomName, { mode: "sfu", stream: localStream });
    setupCallEventHandlers(call);
  });

  $("#end-call").click(function () {
    existingCall.close();
  });

  function setupGetUserMedia() {
    let audioSource = $("#audioSource").val();
    let videoSource = $("#videoSource").val();
    let constraints = {
      audio: { deviceId: { exact: audioSource } },
      video: { deviceId: { exact: videoSource } },
    };
    //constraints.video.width = {
    //    min: 320,
    //    max: 320
    //};
    //constraints.video.height = {
    //    min: 240,
    //    max: 240
    //};

    if (localStream) {
      localStream = null;
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        $("#myStream").get(0).srcObject = stream;
        localStream = stream;

        if (existingCall) {
          existingCall.replaceStream(stream);
        }
      })
      .catch(function (error) {
        console.error("mediaDevice.getUserMedia() error:", error);
        return;
      });
  }

  function setupCallEventHandlers(call) {
    if (existingCall) {
      existingCall.close();
    }

    existingCall = call;
    setupEndCallUI();
    // $("#room-id").text(call.name);

    call.on("stream", function (stream) {
      addVideo(stream);
    });

    call.on("removeStream", function (stream) {
      removeVideo(stream.peerId);
    });

    call.on("peerLeave", function (peerId) {
      removeVideo(peerId);
    });

    call.on("close", function () {
      removeAllRemoteVideos();
      setupMakeCallUI();
    });
  }

  function get_query() {
    var vars = [],
      max = 0,
      hash = "",
      array = "";
    var url = window.location.search;

    hash = url.slice(1).split("&");
    max = hash.length;
    for (var i = 0; i < max; i++) {
      array = hash[i].split("=");
      query_key = array[0];
      query_val = array[1];
      if ("room" == query_key) {
        $("#join-room").val(query_val);
        break;
      }
    }

    return vars;
  }

  function addVideo(stream) {
    const videoDom = $("<video autoplay>");
    videoDom.attr("id", stream.peerId);
    videoDom.get(0).srcObject = stream;
    $(".videosContainer").append(videoDom);
  }

  function removeVideo(peerId) {
    $("#" + peerId).remove();
  }

  function removeAllRemoteVideos() {
    $(".videosContainer").empty();
  }

  function setupMakeCallUI() {
    $("#make-call").show();
    $("#end-call").hide();
  }

  function setupEndCallUI() {
    $("#make-call").hide();
    $("#end-call").show();
  }
});
