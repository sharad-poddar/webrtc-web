'use strict';

let startTime = null;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;


function gotLocalMediaStream(mediaStream) {
  localVideo.srcObject = mediaStream;
  localStream = mediaStream;
  callButton.disabled = false;
}

function gotRemoteMediaStream(event) {
  const mediaStream = event.stream;
  remoteVideo.srcObject = mediaStream;
  remoteStream = mediaStream;
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);


/*
 * handel iceCandidate
 * iceCandidate are the potential connection endpoints
 * here we are getting the ice candidate, we have to pass it to receiver end 
 * making an ice candidate using RTCIceCandidate, then adding it to another's peer
*/
function handleConnection(event) {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => {
        console.log(`${getPeerName(peerConnection)} addIceCandidate success`)
      }).catch((error) => {
        console.log(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
        `${error.toString()}`)
      });
  }
}


/*
 * it shows the changes to the connection state
 * here event.targt gives the current peerConnection
*/ 
function handleConnectionChange(event) {
  const peerConnection = event.target;
  console.log('ICE state change event: ', event);
  console.log(`${getPeerName(peerConnection)} ICE state: ` + `${peerConnection.iceConnectionState}.`);
}



/*
 * here the description is type of info in from of SDP is shared 
 * Logs offer creation and sets peer connection session descriptions
*/
function createdOffer(description) {
  localPeerConnection.setLocalDescription(description)
    .then(() => {
      console.log('offer has been set to local description')
    }).catch((error)=>{
      console.log('error in setting up local description', error);
    });

  remotePeerConnection.setRemoteDescription(description)
    .then(() => {
      console.log('offer has been set to local description by remote peer connection')
    }).catch((error)=>{
      console.log('error in setting up local description by remote peer', error);
    });

  remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch((error)=>{
      console.log('error in creation of answer', error)
    });
}

function createdAnswer(description) {
  remotePeerConnection.setLocalDescription(description)
    .then(() => {
      console.log('answer has been set to local description')
    }).catch((error)=>{
      console.log('error in setting up local answer by remote peer', error);
    });

  localPeerConnection.setRemoteDescription(description)
    .then(() => {
      console.log('answer has been set to remote description by local peer')
    }).catch((error)=>{
      console.log('error in setting up local answer by remote peer', error);
    });
}


// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;
startButton.disabled = false;


function startAction() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(gotLocalMediaStream).catch((error)=>{
      console.log('error in getting local video', error);
    });
}


// Handles call button action: creates peer connection.
function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  startTime = window.performance.now();

  const servers = null;  
  /*
   * creating the connction, where servers are RTPC configuration 
  */
  localPeerConnection = new RTCPeerConnection(servers);
  localPeerConnection.addEventListener('icecandidate', handleConnection);
  localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
  
  remotePeerConnection = new RTCPeerConnection(servers);
  remotePeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
  remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

  localPeerConnection.addStream(localStream);
  localPeerConnection.createOffer({
    offerToReceiveVideo: 1
  }).then(createdOffer).catch(setSessionDescriptionError);
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}


// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);


/*
 * helper function returning name or oposite peerConnection  
*/
function getOtherPeer(peerConnection) {
  return (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
}
function getPeerName(peerConnection) {
  return (peerConnection === localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
}

