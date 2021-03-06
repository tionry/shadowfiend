var app = app || {};

/* 房间语音控制器 */
app.Room && _.extend(app.Room.prototype, {

	/* 离开聊天室 */
	leaveVoiceRoom: function() {
		if (!window.voiceon) {
			return;
		}
		try {
			if (window.localStreamID) {
				window.voiceConnection.localStreams[window.localStreamID].stop();
				io.connect(app.Package.SOCKET_IO + window.voiceConnection.channel).emit('disconnect');
			}
			if (window.isInitiator) {
				app.socket.emit('disconnect-channel', window.voiceConnection.channel);
			}
			window.voiceConnection.leave();
			delete window.voiceConnection;
			$('#voice-on').removeClass('active');
			window.voiceon = false;
		} catch (err) {
		}
	},

	/* 进入并初始化聊天室 */
	openVoice: function() {
		if(app.novoice)
			return;
		if(!window.voiceon) {
			$('#voice-on').addClass('active');
			try{
				var username = $('#nav-user-name').html();
				var that = this;
				var connection = new RTCMultiConnection(this.docData.id);
				connection.sessionid = this.docData.id;
				connection.keepStreamsOpened = false;
				connection.session = {
					audio: true,
					video: false
				};
				connection.extra = {username: username};

				connection.onstream = function (stream) {
					if ((stream.type == 'remote') && (stream.extra.username != username)) {
						stream.mediaElement.style.display = "none";
						stream.mediaElement.muted = false;
						stream.mediaElement.play();
						document.body.appendChild(stream.mediaElement);
					}
					if (stream.type == 'local') {
						window.localStreamID = stream.streamid;
					}
				};
				var sessions = {};
				connection.onNewSession = function (session){
					return;
				};
				window.onbeforeunload = function() {
					that.leaveVoiceRoom();
				};
				connection.onstreamended = function (e) {
					e.mediaElement.parentNode.removeChild(e.mediaElement);
					if (e.type == 'remote') {
						delete connection[e.streamid];
					}
				};

				var SIGNALING_SERVER = app.Package.SOCKET_IO;
				var socket = io.connect(SIGNALING_SERVER);
				socket.on('presence', function (isChannelPresent) {
					window.voiceon = true;
					if (!isChannelPresent) {
						connection.open();
						window.isInitiator = true;
					} else {
						connection.connect(connection.sessionid);
						connection.join(connection.sessionid);
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
				window.voiceConnection = connection;
			}
			catch(err){
				alert(err);
			}
		} else {
			return;
		}
	}

});
