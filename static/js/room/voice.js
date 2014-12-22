var app = app || {};

/* 房间语音控制器 */
app.Room && _.extend(app.Room.prototype, {

	/* 离开聊天室 */
	leaveVoiceRoom: function() {
		if (!window.voiceon) {
			return;
		}
		try {
			window.voiceConnection.disconnect();
			if (window.voiceConnection.isInitiator) {
				app.socket.emit('disconnect-channel');
			}
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
				window.voiceConnection = new RTCMultiConnection(this.docData.id);
				window.voiceConnection.keepStreamsOpened = false;
				window.voiceConnection.session = {
					audio: true,
					video: false
				};
				window.voiceConnection.extra = {username: username};

				window.voiceConnection.onstream = function (stream) {
					if ((stream.type == 'remote') && (stream.extra.username != username)) {
						stream.mediaElement.style.display = "none";
						stream.mediaElement.muted = false;
						stream.mediaElement.play();
						document.body.appendChild(stream.mediaElement);
					}
				};

				var SIGNALING_SERVER = app.Package.SOCKET_IO;
				var socket = io.connect(SIGNALING_SERVER);
				socket.on('presence', function (isChannelPresent) {
					if (!isChannelPresent) {
						window.voiceConnection.open();
					} else {
						window.voiceConnection.join(that.docData.id);
					}
					window.voiceon = true;
				});
				socket.emit('presence', window.voiceConnection.channel);
				window.voiceConnection.openSignalingChannel = function(config) {
					var channel = config.channel || this.channel;
					io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
						sender : window.voiceConnection.userid
					});
					var socket = io.connect(SIGNALING_SERVER + channel);
					socket.channel = channel;
					socket.on('connect', function () {
						if (config.callback) config.callback(socket);
					});
					socket.send = function (message) {
						socket.emit('message', {
							sender: window.voiceConnection.userid,
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
