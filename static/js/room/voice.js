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
				var username = $('#nav-user-name').html();
				var connection = new RTCMultiConnection(this.docData.id);
				connection.session = {
					audio: true,
					video: false
				};
				window.voiceConnection = connection;
				connection.autoCloseEntireSession = true;

				connection.onstream = function (stream) {
					if ((stream.type == 'remote') && (stream.extra.username != username)) {
						stream.mediaElement.style.display = "none";
						stream.mediaElement.muted = false;
						stream.mediaElement.play();
						document.body.appendChild(stream.mediaElement);
					}
				};
				connection.onNewSession = function (session){
					if(window.joinedARoom){
						return;
					}
					connection.join(session, {
						username: username
					});
				};

				var SIGNALING_SERVER = app.Package.SOCKET_IO;
				var socket = io.connect(SIGNALING_SERVER);
				socket.on('presence', function (isChannelPresent) {
					if (!isChannelPresent) {
						connection.open();
					} else {
						connection.connect();
					}
				});
				socket.emit('presence', connection.channel);
				connection.openSignalingChannel = function(config) {
					var channel = config.channel || this.channel;
					io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
						sender : connection.userid
					});
					var socket = io.connect(SIGNALING_SERVER + channel);
					socket.channel = channel;
					socket.on('connect', function () {
						if (config.callback) config.callback(socket);
					});
					socket.send = function (message) {
						socket.emit('message', {
							sender: connection.userid,
							data : message
						});
					};
					socket.on('message', config.onmessage);
					return socket;
				};
			}
			catch(err){
				alert(err);
			}
		} else {
			this.leaveVoiceRoom();
		}
	}

});
