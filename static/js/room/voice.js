var app = app || {};

/* 房间语音控制器 */
app.Room && _.extend(app.Room.prototype, {

	/* 离开聊天室 */
	leaveVoiceRoom: function() {
		while(window.userArray.length > 0){
			$(window.audioArray[window.userArray.shift()]).remove();
		}
		while(window.peerUserArray.length > 0){
			var peerUName = window.peerUserArray.shift();
			if(window.peerArray[peerUName]){
				window.peerArray[peerUName].myOnRemoteStream = function (stream){
					stream.mediaElement.muted = true;
					return;
				};
			}
		}
		if(!window.joinedARoom){
			return;
		}
		$('#voice-on').removeClass('active');
		window.voiceConnection.myLocalStream.stop();
		window.voiceConnection.leave();
		delete window.voiceConnection;
	},

	/* 进入并初始化聊天室 */
	openVoice: function() {
		if(app.novoice)
			return;
		window.voiceon = !window.voiceon;
		if(window.voiceon) {
			if(window.joinedARoom){
				return;
			}
			$('#voice-on').addClass('active');
			try{
				var rtcMultiConnection = new RTCMultiConnection(this.docData.id);
				rtcMultiConnection.userid = app.currentUser._id;
				rtcMultiConnection.session = { data: true };
				rtcMultiConnection.sdpConstraints.mandatory = {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: false
				};

				app.socket.on('presence', function (isChannelPresent) {
					if (!isChannelPresent) {
						rtcMultiConnection.open();
					} else {
						rtcMultiConnection.connect();
					}
				});
				app.socket.emit('presence', rtcMultiConnection.channel);
				rtcMultiConnection.openSignalingChannel = function(config) {
					var channel = config.channel || this.channel;
					io.connect(app.Package.SOCKET_IO).emit('new-channel', {
						channel: channel,
						sender : rtcMultiConnection.userid
					});
					var socket = io.connect(app.Package.SOCKET_IO + channel);
					socket.channel = channel;
					socket.on('connect', function () {
						if (config.callback) config.callback(socket);
					});
					socket.send = function (message) {
						socket.emit('message', {
							sender: rtcMultiConnection.userid,
							data : message
						});
					};
					socket.on('message', config.onmessage);
				};

				var username = $('#nav-user-name').html();
				var that = this;

				var sessions = { };
				rtcMultiConnection.onNewSession = function(session) {
					if (sessions[session.sessionid]) return;
					sessions[session.sessionid] = session;
					session.join();
				};

				rtcMultiConnection.onRequest = function(request) {
					rtcMultiConnection.accept(request);
				};

				rtcMultiConnection.blobURLs = { };
				rtcMultiConnection.onstream = function (stream) {
					if ((stream.type == 'remote') && (stream.extra.username != username)) {
						stream.mediaElement.style.display = "none";
						stream.mediaElement.muted = false;
						stream.mediaElement.play();
						document.body.appendChild(stream.mediaElement);
						window.userArray.push(stream.extra.username);
						window.audioArray[stream.extra.username] = stream.mediaElement;
					}
				};

				rtcMultiConnection.sendMessage = function(message) {
					message.userid = rtcMultiConnection.userid;
					message.extra = rtcMultiConnection.extra;
					rtcMultiConnection.sendCustomMessage(message);
				};
			} catch(err){
				alert(err);
			}
		} else {
			this.leaveVoiceRoom();
		}
	}

});
