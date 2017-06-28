var WSUrl = "ws://140.121.197.130:8050/webrtc/guessgame";
var configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };;
var pc;
var localStream = null,
    remoteStream = null;
var ws;
var userName;
var caller, callee;
var peerConnectionState = null;
var PC_STATE_NEW = "new";
var PC_STATE_PREPARING_OFFER = "preparing-offer";
var PC_STATE_OFFER_SENT = "offer-sent";
var PC_STATE_OFFER_RECEIVED = "offer-recevied";
var PC_STATE_PREPARING_ANSWER = "preparing-answer";
var PC_STATE_ESTABLISHED = "established";
var ans;
var iscorrect=0;
var num;
var ques;
var mquestion;
var question = ["七上八下",    "雞飛狗跳",    "七嘴八舌",    "九牛一毛",    "一毛不拔",    "對牛彈琴",    "開懷大笑",    "機器人",    "蜘蛛俠",    "上廁所",    "騎腳踏車",    "芭蕾舞",
    "化妝",    "香蕉",    "猴子",    "大象",    "毛毛蟲",    "貓咪",    "睡美人",    "小紅帽",    "烏鴉嘴",    "青春痘",    "找錢",    "吹牛",    "相機",    "頭暈",    "錢包",    "掃地",
    "投降",    "投籃",    "游泳",    "眨眼睛",    "臭襪子",    "做鬼臉",    "救生圈",    "溜溜球",    "十字架",    "刮鬍刀",    "指甲刀",    "冰淇淋",    "呼拉圈",    "洗衣服",    "拔河比賽",    "雨傘"
];
var score = 0;
var skipture = true,startture = true;
function generate() {
    num = Math.round(Math.random() * 40);
    mquestion = question[num];
    return mquestion;
}
function set_room_owner() {
	var data = "";
	
	data = JSON.parse("{"+$("#body").data("data-store")+"}"); // { "from": ~, "to": ~}
	console.log(data);
	callee = data.to;
	userName = data.from;
	console.log(userName);
	caller = data.from;
	
}

function connect() {
    console.log("WebRTCTest:connect()");
    ws = new WebSocket(WSUrl);
    ws.onopen = function() {
        console.log("WebRTCTest:connect() onopen!");
        
        ws.send(JSON.stringify({ "from": userName, "to": "all", "content": "has connected!" }));
    };
    ws.onclose = function() {
        console.log("WebRTCTest:startServer() onclose!");
        //ws.send(JSON.stringify({"from":document.getElementById("userName").value,"to":"all","content":"has disconneted!"})); 
    };
    ws.onmessage = function(event) {
        //console.log("onmessage:" + event.data);
        var message = JSON.parse(event.data);
        if (message.content == "call") {
            caller = message.from;
            callee = message.to;
            called();
        } else if (message.content == "bye") {
            caller = message.from;
            callee = message.to;
            byed();
        }
        //else if(message.content =="close" &&(message.from == caller ||message.to == callee)){
        //pc.removeStream(localStream); 
        //} 
        if (message.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function() {
                //如果收到offer，需要回复一个answer 
                if (pc.remoteDescription.type == "offer") {
                    caller = message.from;
                    pc.createAnswer(localAnswerDescCreated, logError);
                }
            }, logError);
        } else if (message.candidate && (message.from == caller || message.from == callee)) {
            pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        } else if (message.question && !message.iscorrect){
        	$("#question").text(message.question);
        	if(skipture){
        		
        		countdownnumber = 100;
        		skipture = false;
        	}
        }
        else if(message.question && message.iscorrect){
        	score += 1;
        	//setScore();
        	console.log("zzz" + score);
        	$("#panelonescore").text(score);
        	$("#question").text(message.question);
        	
        }
    };
}

function startGame(){
	if(startture){
		
		countdownnumber=100;//set playtime
		startture=false;
	}
	console.log("startGame");
	ques=generate();
	sendQuestion();
}

function checkAns(){
	
	console.log("checkAns");
	if($("#answer").val()==mquestion){
		iscorrect=1;
		score += 1;
		startGame();
		iscorrect=0;
						
		$("#paneltwoscore").text(score);
	} 
	$("#answer").val('');
}

function register() {
    connect();
    getLocalStream();
    
}

function getScore(){
	return score;
}



function sendQuestion(){
	ws.send(JSON.stringify({ "from": userName, "to": callee, "question": ques ,"iscorrect": iscorrect}));
}

function call() {
	countdownnumber=100;
    if (!pc) createPeerConnection();
    peerConnectionState = PC_STATE_PREPARING_OFFER;
 
    caller = userName;
    console.log("call():" + caller + " call to :" + callee);
    var msg = "call";
    ws.send(JSON.stringify({ "from": userName, "to": callee,"content":"call" }));
    pc.addStream(localStream);
    pc.createOffer(localOfferDescCreated, logError);

}

function called() {
	countdownnumber=100;//set playtime
    if (!pc) createPeerConnection();
    console.log("called():" + caller + " call to :" + callee);
    peerConnectionState = PC_STATE_OFFER_RECEIVED;
    pc.addStream(localStream);
    
}



function createPeerConnection() {
    console.log("createPeerConnection()");
    peerConnetionState = PC_STATE_NEW;
    pc = new webkitRTCPeerConnection(configuration);
    pc.onicecandidate = function(event) {
        if (event.candidate) ws.send(JSON.stringify({ "from": userName, "to": "all", "candidate": event.candidate }));
    };
    pc.onnegotiationneeded = function() { console.log("onnegotiationneeded()"); };
    pc.onaddstream = function(event) {
        console.log("onaddstream");
        peerConnectionState = PC_STATE_ESTABLISHED;
        remoteStream = event.stream;
        document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
        document.getElementById("remoteVideo").play();
        document.getElementById("remoteVideo").style.visibility = "visible";
    };
    pc.onremovestream = function(event) {
        console.log("onremovestream");
        remoteStream = null;
        document.getElementById("remoteVideo").pause();
        document.getElementById("remoteVideo").src = null;
        document.getElementById("remoteVideo").style.visibility = "hidden";
    };
    pc.onsignalstatechange = function(event) { console.log("onsignalstatechange()"); };
}

function localOfferDescCreated(desc) {
    pc.setLocalDescription(desc, function() { ws.send(JSON.stringify({ "from": userName, "to": callee, "sdp": pc.localDescription })); }, logError);
    peerConnectionState = PC_STATE_OFFER_SENT;
}

function getLocalStream() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) { navigator.getUserMedia({ audio: false, video: true }, getLocalAudioVideoStream, getLocalAudioVideoStreamFailed); } else {
        document.getElementById("remoteVideo").src = 'somevideo.webm'; // fallback. 
    }
}

function getLocalAudioVideoStream(stream) {
    console.log("getLocalAudioVideoStream()");
    localStream = stream;
  
}

function getLocalAudioVideoStreamFailed(error) {
    console.log('Rjected!', error);
    alert("Failed to get access to local media. Error code was " + error.code + ".");
};

function localAnswerDescCreated(desc) {
    pc.setLocalDescription(desc, function() { ws.send(JSON.stringify({ "from": userName, "to": caller, "sdp": pc.localDescription })); }, logError);
    peerConnectionState = PC_STATE_PREPARING_ANSWER;
}

function logError(error) { console.error(error.name + ":" + error.message); }


