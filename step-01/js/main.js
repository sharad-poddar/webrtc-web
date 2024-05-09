// using typescript
'use strict';

let localStream;
const localVideo = document.querySelector('video');
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

/*
 * mediaDevices.getUserMedia -> used to get the access of camera video 
 * it is used to get the camera video, here we can also take audio by constraints
 * here now -> video: true, audio: false
*/
navigator.mediaDevices.getUserMedia({ video: true, video: {
  height: {
    min: 720
  },
  width: {
    min: 1280
  }
}})
  .then((mediaStream)=>{
    gotLocalMediaStream(mediaStream);
    console.log(mediaStream.getVideoTracks());
    // mediaStream.getVideoTracks()[0].stop();
  }).catch(()=>{
    console.log('error in getting the user video')
  });
