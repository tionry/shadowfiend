var VERSION = require('./package.json').version;
var crypto = require('crypto');
var fs = require('fs');
var UserDAO = require('./models/userDAO');
var DocDAO = require('./models/docDAO');
var ProblemDAO = require('./models/problemDAO');
var InterviewDAO = require('./models/interviewDAO');
var DocBuffer = require('./models/docBuffer');
var Runner = require('./models/runner');
var Debugger = require('./models/debugger');
var DEBUG = require('./package.json').debug;

var session = {};
var users = {};
var rooms = {};

function log(){
	function formatDate(t) {
		var y = t.getFullYear();
		var o = t.getMonth() + 1;
		var d = t.getDate();
		var h = t.getHours();
		var m = t.getMinutes();
		var s = t.getSeconds();
		return y + '/' + (o < 10 ? '0' + o : o) + '/' + d + ' ' +
			(h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
	}
	console.log('\n[' + formatDate(new Date()) + ']');
	console.log.apply(console.log, arguments);
}

(function(){
	var sig = [
		'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 
		'SIGTRAP', 'SIGABRT', 'SIGIOT', 'SIGBUS', 
		'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 
		'SIGPIPE', 'SIGALRM', 'SIGTERM', 'SIGSTKFLT', 
		'SIGXCPU', 'SIGXFSZ', 'SIGVTALRM', 'SIGPROF'
	];
	for(var i in sig){
		process.on(sig[i], function(){
			log('server stop');
			process.kill(process.pid, 'SIGKILL');
		});
	}
	process.on('uncaughtException', function(err){
		log('uncaughtException: ' + err);
	});
})();

log('server start');

var io = require('socket.io').listen(require('./package.json').port, {log:false});

function _broadcast(id, msg, data){
	if(DEBUG){
		if(data){
			log('>> [' + id + ']', msg, data);
		}else{
			log('>> [' + id + ']', msg);
		}
	}
	io.sockets.in(id).emit(msg, data);
}

var channels = {};

io.sockets.on('connection', function(socket){

	(function() {
		var ignore = {
			'change':1,
			'ok':1,
			'avatar':1
		};
		function _log(id, arg){
			id += '[' + (socket.session ? socket.session.user.name : ip) + ']';
			if(arg[1] === undefined){
				log(id, arg[0]);
			}else{
				log(id, arg[0], JSON.stringify(arg[1]));
			}
		}
		if(DEBUG){
			var emit = socket.emit;
			socket.emit = function(){
				if((DEBUG || !ignore[arguments[0]]) && arguments[0] != 'newListener'){
					_log('>> ', arguments);
				}
				emit.apply(socket, arguments);
			};
		}
		var $emit = socket.$emit;
		socket.$emit = function(){
			if((DEBUG || !ignore[arguments[0]]) && arguments[0] != 'newListener'){
				_log('', arguments);
			}
			$emit.apply(socket, arguments);
		};
	})();

	if (!io.isConnected) {
		io.isConnected = true;
	}

	var userDAO = new UserDAO();
	var docDAO = new DocDAO();
	var problemDAO = new ProblemDAO();
	var interviewDAO = new InterviewDAO();

	var ip = socket.handshake.headers['x-real_ip'];
	if(!ip){
		ip = socket.handshake.address.address;
	}

	log('[' + ip + ']', 'connect "socket begin"');

	function check(data){
		if(data === undefined){
			return false;
		}
		for(var i = 1; i < arguments.length; i++){
			if(data[arguments[i]] === undefined){
				return false;
			}
		}
		return true;
	}

	socket.on('disconnect', function(){
		if(socket.session){
			_leave();
		}
	});

	socket.on('version', function(){
		socket.emit('version', {version:VERSION});
	});

	socket.on('register', function(data) { // name, password
		if(!check(data, 'name', 'password')){
			return;
		}
		userDAO.register(data.name, data.password, data.avatar || 'images/character.png', 'user', function(err){
			socket.emit('register', {err:err});
		});
	});

	socket.on('relogin', function(data){ // sid
		if(!check(data, 'sid')){
			return;
		}
		if(session[data.sid]){
			socket.session = session[data.sid];
			var user = socket.session.user;
			if(users[user.name] && users[user.name] != socket){
				delete users[user.name].session;
				users[user.name].emit('unauthorized');
			}
			users[user.name] = socket;
			docDAO.getDocByPath(socket.session.user._id, '/' + socket.session.user.name, function(err, docs){
				socket.session.user.docs = docs;
				socket.emit('login', {user:socket.session.user, sid:socket.session.sid});
			});
		}else{
			socket.emit('login', {err:'expired'});
		}
	});

	socket.on('login', function(data){ // name, password
		if(!check(data, 'name', 'password')){
			return;
		}
		userDAO.login(data.name, data.password, ip, function(err, user){
			if(err){
				return socket.emit('login', {err:err});
			}
			var sid;
			while(sid = crypto.randomBytes(32).toString('base64')){
				if(!session[sid])
					break;
			}
			socket.session = session[sid] = {user:user, sid:sid};
			if(users[user.name]){
				delete session[users[user.name].session.sid];
				delete users[user.name].session;
				users[user.name].emit('unauthorized');
			}
			users[user.name] = socket;
			socket.emit('login', socket.session);
		});
	});

	socket.on('logout', function(){
		if(socket.session){
			_leave();
			delete session[socket.session.sid];
			delete users[socket.session.user.name];
			delete socket.session;
		}
	});

	socket.on('password', function(data){ // password, newPassword
		if(!check(data, 'password', 'newPassword')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		userDAO.updatePassword(user._id, data.password, data.newPassword, function(err){
			socket.emit('password', {err:err});
		});
	});

	socket.on('avatar', function(data){ // avatar, type
		if(!check(data, 'avatar', 'type')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		if(data.avatar.length > 1048576){
			return socket.emit('avatar', {err:'too large'});
		}
		var user = socket.session.user;
		var name = new Date().getTime();
		switch(data.type){
			case 'image/png':
				name += '.png';
				break;
			case 'image/jpeg':
				name += '.jpg';
				break;
			default:
				return socket.emit('avatar', {err:'not supported'});
		}
		var path = 'static/faces/' + name;
		var url = 'faces/' + name;
		fs.writeFile(path, new Buffer(data.avatar, 'base64'), function(err){
			if(err){
				return socket.emit('avatar', {err:'inner error'});
			}
			userDAO.updateAvatar(user._id, url, function(err){
				if(err){
					return socket.emit('avatar', {err:err});
				}
				user.avatar = url;
				return socket.emit('avatar', {url:url});
			});
		});
	});
	
	socket.on('upload', function(data){
		if (!check(data, 'path', 'type', 'text')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		
		var user = socket.session.user;
		docDAO.createDoc(user._id, data.path, data.type, function(err, ctime){
			if (err)
				return socket.emit('new', {err:err});
			socket.emit('new', {createTime: ctime});
			
			_leave();
			
			docDAO.getRevision(user._id, data.path, 0, null, function(err, revision, obj){
			if(err){
				return socket.emit('upload', {err:err});
			}
			var room = rooms[data.path] = {id:revision.doc, path:data.path, count:0, users:{}, version:0, buffer:new DocBuffer(revision.content), bps:'', exprs:{}};
			room.users[user.name] = true;
			room.count++;
			room.buffer.update(0, 0, data.text, function(err){
				if(err){
					return socket.emit('upload', {err:err});
				}
				
			});
			
			_leave();
			
			});	
			
		});	
	});

	socket.on('new', function(data){ // path, type
		if(!check(data, 'path', 'type')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.createDoc(user._id, data.path, data.type, function(err, ctime){
      if(!err && ctime) {
        socket.emit('new', {createTime: ctime, modifyTime: ctime});
      } else {
        socket.emit('new', {err:err});
      }
		});
	});

	socket.on('delete', function(data){ // path	
		if(!check(data, 'path')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.deleteDoc(user._id, data.path, function(err){
			socket.emit('delete', {err:err});
			if(!err && rooms[data.path]){
				var room = rooms[data.path];
				socket.broadcast.to(room.id).emit('deleted');
				for(var u in room.users){
					users[u].leave(room.id);
					delete users[u].session.room;
				}
				delete rooms[data.path];
				if(room.runner){
					room.runner.kill();
				}
			}
		});
	});

	socket.on('move', function(data){ // path, newPath
		if(!check(data, 'path', 'newPath')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.moveDoc(user._id, data.path, data.newPath, function(err){
			socket.emit('move', {err:err});
			if(!err && rooms[data.path]){
				var room = rooms[data.path];
				delete rooms[data.path];
				room.path = data.newPath;
				rooms[room.path] = room;
				socket.broadcast.to(room.id).emit('moved', {newPath:data.newPath, time:new Date().getTime()});
			}
		});
	});

	socket.on('share', function(data){ // path, name
		if(!check(data, 'path', 'name')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.addMember(user._id, data.path, data.name, function(err){
			socket.emit('share', {err:err});
			if(!err && rooms[data.path]){
				userDAO.getUserByName(data.name, function(err, user){
					if(!err){
						var room = rooms[data.path];
						socket.broadcast.to(room.id).emit('shared', {name:user.name, avatar:user.avatar, time:new Date().getTime()});
					}
				});
			}
		});
	});

	socket.on('unshare', function(data){ // path, name
		if(!check(data, 'path', 'name')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.removeMember(user._id, data.path, data.name, function(err){
			socket.emit('unshare', {err:err});
			if(!err){
				var room = null;
				if(rooms[data.path]){
					room = rooms[data.path];
				}else if(users[data.name]){
					var t = users[data.name].session.room;
					if(t && t.path.indexOf(data.path) == 0 && t.path[data.path.length] == '/'){
						room = t;
					}
				}
				if(room){
					socket.broadcast.to(room.id).emit('unshared', {name:data.name, time:new Date().getTime()});
					if(room.users[data.name]){
						users[data.name].leave(room.id);
						delete users[data.name].session.room;
						delete room.users[data.name];
						room.count--;
						if(room.count == 0){
							if(room.runner){
								room.runner.kill();
							}
							docDAO.save(user._id, room.id, room.buffer.toString(), function(err){});
							delete rooms[room.path];
						}
					}
				}
			}
		});
	});

	socket.on('doc', function(data){ // path
		if(!check(data, 'path')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		docDAO.getDocByPath(user._id, data.path, function(err, doc){
			if(err){
				return socket.emit('doc', {err:err});
			}
			socket.emit('doc', {doc:doc});
		});
	});

	function _leave(){
		if(socket.session && socket.session.room){
			var user = socket.session.user;
			var room = socket.session.room;
			socket.leave(room.id);
			delete socket.session.room;
			_broadcast(room.id, 'leave', {name:user.name, time:new Date().getTime()});
			delete room.users[user.name];
			room.count--;
			if(room.count == 0){
				if(room.runner){
					room.runner.kill();
				}
				if(room.dbger){
					room.dbger.kill();
				}
				docDAO.save(user._id, room.id, room.buffer.toString(), function(err){});
				delete rooms[room.path];
			}
		}
	}
	
	socket.on('downzip', function(data) {
		if (!check(data, 'path', 'mode'))
			return;
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var files = [];
		var count = 1;
		var getDocs = function(files, path, mode) {
			docDAO.getDocByPath(user._id, path, function(err, doc){
			if(err){
				return;
			}
			if (mode == 1)
				doc = doc.docs;
			for (var i = 0; i < doc.length; ++i) {
				files.push({path: doc[i].path, type: doc[i].type, text: null})
			}
			for (var i = 0; i < doc.length; ++i) {
				if (doc[i].type == 'dir') {
					count = count + 1;
					getDocs(files, doc[i].path, 1);
				}
			}
			--count;
			if (count == 0) {
				var counts = 1;
				var setText = function(ind, text) {
					ind.text = text;
				}
				var sendmsg = function() {
					--counts;
					console.log(counts);
					if (counts == 0) {
						counts = 1;
						console.log(files);
						socket.emit('downzip', {file: files, path: data.path});
					}
				};
				var getContents = function(files) {
					for (var i = 0; i < files.length; ++i) {
						if (files[i].type == 'doc') {
							++counts;
							docDAO.getRevision(user._id, files[i].path, 0, files[i], function(err, revision, obj){
								var room = rooms[obj.path];
								if (!room || room === undefined)
								{
									setText(obj, revision.content.toString());
								}
								else
								{
									setText(obj, room.buffer.toString());
								}
								sendmsg();
							});
						}
					}
					sendmsg();
				};
				getContents(files);
			}
			});
		};
		getDocs(files, data.path, data.mode);
	});
	
	socket.on('download', function(data){
		if(!check(data, 'path')){
			return;
		}
		if (!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		_leave();
		docDAO.getRevision(user._id, data.path, 0, null, function(err, revision, obj){
			var room = rooms[data.path];
			var n = data.path.split('/');
			n = n[n.length - 1];
			if (!room)
				socket.emit('download', { 
					text: revision.content.toString(),
					name: n
				});
			else
				socket.emit('download', {
					text: room.buffer.toString(),
					name: n
				});
		});
	});

	socket.on('join', function(data){ // path
		if(!check(data, 'path')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		_leave();
		docDAO.getRevision(user._id, data.path, 0, null, function(err, revision, obj){
			if(err){
				return socket.emit('join', {err:err});
			}
			var room = rooms[data.path];
			if(!room){
				room = rooms[data.path] = {id:revision.doc, path:data.path, count:0, users:{}, version:0, buffer:new DocBuffer(revision.content), bps:'', exprs:{}};	
			}else{
				socket.broadcast.to(room.id).emit('join', {name:user.name, time:new Date().getTime()});
			}
			room.users[user.name] = true;
			room.count++;
			socket.session.room = room;
			socket.join(room.id);
			var r = {id:room.id, users:room.users, version:room.version, text:room.buffer.toString(), bps:room.bps, exprs:room.exprs};
			if(room.runner){
				r.running = true;
			}
			if(room.dbger){
				r.debugging = true;
				r.state = room.dbger.state;
				r.line = room.line;
			}
			socket.emit('set', r);
		});
	});

	socket.on('leave', function(data){ //
		if(!data) return;
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		_leave();
	});

	socket.on('change', function(data){ // version, from, to, text
		if(!check(data, 'version', 'from', 'to', 'text')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.version == data.version && !room.dbger){
			room.version = (room.version + 1) % 65536;
			room.buffer.update(data.from, data.to, data.text, function(err){
				if(!err){
					socket.emit('ok');
					data.name = user.name;
					socket.broadcast.to(room.id).emit('change', data);
				}
			});
		}
	});

	socket.on('bps', function(data){ // version, from, to, text
		if(!check(data, 'version', 'from', 'to', 'text')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.version == data.version && data.from <= data.to && data.from >= 0){
			room.version = (room.version + 1) % 65536;
			while(room.bps.length < data.to){
				room.bps += '0';
			}
			room.bps = room.bps.substr(0, data.from) + data.text + room.bps.substr(data.to);
			socket.emit('bpsok');
			data.name = user.name;
			socket.broadcast.to(room.id).emit('bps', data);
			if(room.dbger && room.dbger.state == 'waiting'){
				if(data.text == '0'){
					room.dbger.removeBreakPoint(data.from + 1, function(line){
						// To do
					});
				}else{
					room.dbger.addBreakPoint(data.from + 1, function(line){
						// To do
					});
				}
			}
		}
	});

	socket.on('revision', function(data){ // path, revision
		if(!check(data, 'path', 'revision')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		socket.emit('not supported');
	});

	socket.on('commit', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		socket.emit('not supported');
	});

	socket.on('chat', function(data){ // text
		if(!check(data, 'text')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room){
			data.name = user.name;
			data.time = new Date().getTime();
			_broadcast(room.id, 'chat', data);
		}
	});

	socket.on('run', function(data){ // type, version
		if(!check(data, 'type', 'version')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && !room.runner && !room.dbger && room.version == data.version){
			var runner = new Runner(room.path.substr(room.path.lastIndexOf('/') + 1), data.type, room.buffer.toString());
			if(runner.ready()){
				room.runner = runner;
				_broadcast(room.id, 'run', {name:user.name, time:new Date().getTime()});
				runner.on('stdout', function(data){
					_broadcast(room.id, 'stdout', {data:data});
				});
				runner.on('stderr', function(data){
					_broadcast(room.id, 'stderr', {data:data});
				});
				runner.on('start', function(){
					_broadcast(room.id, 'start');
				});
				runner.run(function(err){
					delete room.runner;
					err.time = new Date().getTime();
					_broadcast(room.id, 'exit', err);
				});
			}
		}
	});

	socket.on('kill', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room){
			if(room.runner){
				room.runner.kill();
			}else if(room.dbger){
				room.dbger.kill();
			}
		}
	});

	socket.on('stdin', function(data){ // data
		if(!check(data, 'data')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room){
			var t;
			if(room.runner){
				t = room.runner;
			}else if(room.dbger){
				t = room.dbger;
			}
			if(t){
				t.input(data.data, function(err){
					if(err){
						return socket.emit('stdin', {err:err});
					}
					_broadcast(room.id, 'stdin', data);
				});
			}
		}
	});

	socket.on('debug', function(data){ // type, version
		if(!check(data, 'type', 'version')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && !room.runner && !room.dbger && room.version == data.version){
			var dbger = new Debugger(room.path.substr(room.path.lastIndexOf('/') + 1), data.type, room.buffer.toString());
			if(dbger.ready()){
				room.dbger = dbger;
				_broadcast(room.id, 'debug', {name:user.name, time:new Date().getTime(), text:room.buffer.toString(), bps:room.bps});
				dbger.on('stdout', function(data){
					_broadcast(room.id, 'stdout', {data:data});
				});
				dbger.on('stderr', function(data){
					_broadcast(room.id, 'stderr', {data:data});
				});
				dbger.on('running', function(){
					_broadcast(room.id, 'running');
				});
				dbger.on('waiting', function(line){
					room.line = line;
					var exprs = [];
					for(var expr in room.exprs){
						exprs.push(expr);
					}
					var i = 0;
					function print(){
						if(i >= exprs.length){
							return _broadcast(room.id, 'waiting', {line:line, exprs:room.exprs});
						}
						dbger.print(exprs[i], function(val){
							if(val === undefined){
								val = null;
							}
							room.exprs[exprs[i]] = val;
							i++;
							return print();
						});
					}
					return print();
				});
				dbger.on('ready', function(){
					var i = 0;
					function add(){
						while(i < room.bps.length && room.bps[i] == '0'){
							++i;
						}
						if(i >= room.bps.length){
							return dbger.run();
						}
						dbger.addBreakPoint(i + 1, function(line){
							i++;
							return add();
						});
					}
					return add();
				});
				dbger.start(function(err){
					delete room.dbger;
					err.time = new Date().getTime();
					for(var i in room.exprs){
						room.exprs[i] = null;
					}
					_broadcast(room.id, 'exit', err);
				});
			}
		}
	});

	socket.on('step', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.dbger){
			return room.dbger.step();
		}
	});

	socket.on('next', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.dbger){
			return room.dbger.next();
		}
	});

	socket.on('resume', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.dbger){
			return room.dbger.resume();
		}
	});

	socket.on('finish', function(){
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.dbger){
			return room.dbger.finish();
		}
	});

	socket.on('add-expr', function(data){ // expr
		if(!check(data, 'expr')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
//		if(room && !room.exprs.hasOwnProperty(data.expr) && data.expr != ''){
			room.exprs[data.expr] = null;
			if(room.dbger && room.dbger.state == 'waiting'){
				room.dbger.print(data.expr, function(val){
					if(val === undefined){
						val = null;
					}
					room.exprs[data.expr] = val;
					return _broadcast(room.id, 'add-expr', {expr:data.expr, val:room.exprs[data.expr]});
				});
			}else{
				return _broadcast(room.id, 'add-expr', {expr:data.expr, val:room.exprs[data.expr]});
			}
//		}
	});

	socket.on('rm-expr', function(data){ // expr
		if(!check(data, 'expr')){
			return;
		}
		if(!socket.session){
			return socket.emit('unauthorized');
		}
		var user = socket.session.user;
		var room = socket.session.room;
		if(room && room.exprs.hasOwnProperty(data.expr)){
			delete room.exprs[data.expr];
			return _broadcast(room.id, 'rm-expr', {expr:data.expr});
		}
	});

	socket.on('add-problem', function(data) {
		if (!check(data, 'name', 'description')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		problemDAO.createProblem(data.name, data.description, function(err) {
			if (err) {
				return socket.emit('after-add-problem', {err: err});
			}
			problemDAO.getAllProblems(function(err, problem) {
				if (err) {
					return socket.emit('after-add-problem', {err: err});
				}
				socket.emit('after-add-problem', {
					problem: problem,
					mode: 'problemset'
				});
				socket.broadcast.emit('refresh-problemset');
			});
		});
	});

	socket.on('delete-problem', function(data) {
		if (!check(data, 'name')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		problemDAO.deleteProblem(data.name, function(err) {
			if (err) {
				return socket.emit('delete-problem', {err: err});
			}
			socket.broadcast.emit('refresh-problemset');
		});
	});

	socket.on('read-problem', function(data) {
		if (!check(data, 'name', 'all', 'mode')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		switch (data.mode) {
			case 'problem-in-interview':
				interviewDAO.getInterviewByName(data.name, function(err, interview) {
					if (err) {
						return socket.emit('read-problem', {err: err});
					}
					var problemList = [];
					interview.problemlist.forEach(function(problem) {
						problemList.push(problem.name);
					});
					problemDAO.getProblemByNameList(problemList, function(err, problems) {
						if (err) {
							return socket.emit('read-problem', {err: err});
						}
						socket.emit('read-problem', {
							problem: problems,
							mode: 'problem-in-interview',
							name: data.name
						});
					});
				});
				break;
			case 'problemset':
				if (data.all == true) {
					problemDAO.getAllProblems(function(err, problem) {
						if (err) {
							return socket.emit('read-problem', {err: err});
						}
						socket.emit('read-problem', {
							problem: problem,
							mode: data.mode
						});
					});
				}
				break;
			case 'all-problem':
				if (data.all == true) {
					problemDAO.getAllProblems(function(err, problem) {
						if (err) {
							return socket.emit('read-problem', {err: err});
						}
						socket.emit('read-problem', {
							problem: problem,
							mode: data.mode,
							name: data.name
						});
					});
				}
				break;
		}
	});

	socket.on('add-interview', function(data) {
		if (!check(data, 'name', 'interviewer', 'interviewee', 'problem')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.createInterview(data.name, data.interviewer, data.interviewee, data.problem, function(err) {
			if (err) {
				return socket.emit('after-add-interview', {err: err});
			}
			interviewDAO.getInterviews(socket.session.user.name, 1, function(err, interview) {
				if (err) {
					return socket.emit('after-add-interview', {err: err});
				}
				socket.emit('after-add-interview', {
					interview: interview,
					mode: 1,
					username: socket.session.user.name
				});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	socket.on('check-user', function(data) {
		if (!check(data, 'name')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		userDAO.getUserByName(data.name, function(err, user) {
			if (err) {
				return socket.emit('check-user', {err: err});
			}
			socket.emit('check-user', {
				name: user.name,
				avatar: user.avatar
			});
		});
 	});

	socket.on('read-interview', function(data) {
		if (!check(data, 'mode')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		var mode = 2;
		if (data.mode == 'interviewer') {
			mode = 1;
		}
		interviewDAO.getInterviews(socket.session.user.name, mode, function(err, interview) {
			if (err) {
				return socket.emit('read-interview', {err: err});
			}
			socket.emit('read-interview', {
				interview: interview,
				mode: mode,
				username: socket.session.user.name
			});
		});
	});

	socket.on('update-problem-in-interview', function(data) {
		if (!check(data, 'name', 'problemlist')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.updateProblem(data.name, data.problemlist, function(err, interview) {
			if (err) {
				return socket.emit('after-update-interview-problem', {err: err});
			}
			problemDAO.getProblemByNameList(interview.problemlist, function(err, problems) {
				if (err) {
					return socket.emit('after-update-interview-problem', {err: err});
				}
				socket.emit('after-update-interview-problem', {problem: problems});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	socket.on('read-interviewer-in-interview', function(data) {
		if (!check(data, 'name')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.getInterviewByName(data.name, function(err, interview) {
			if (err) {
				return socket.emit('read-interviewer-in-interview', {err: err});
			}
			userDAO.getUserListByName(interview.interviewer, function(err, users) {
				if (err) {
					return socket.emit('read-interviewer-in-interview', {err: err});
				}
				socket.emit('read-interviewer-in-interview', {
					interviewers: users,
					interviewName: data.name
				});
			});
		});
	});

	socket.on('read-interviewee-in-interview', function(data) {
		if (!check(data, 'name')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.getInterviewByName(data.name, function(err, interview) {
			if (err) {
				return socket.emit('read-interviewee-in-interview', {err: err});
			}
			var intervieweeList = [];
			interview.interviewee.forEach(function(interviewee) {
				userDAO.getUserByName(interviewee.name, function(err, user) {
					if (err) {
						return socket.emit('read-interviewee-in-interview', {err: err});
					}
					intervieweeList.push(user);
					if (intervieweeList.length == interview.interviewee.length) {
						return socket.emit('read-interviewee-in-interview', {
							interviewees: intervieweeList,
							interviewName: data.name
						});
					}
				});
			});
		});
	});

	socket.on('update-interviewer-in-interview', function(data) {
		if (!check(data, 'name', 'interviewer')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		if (data.interviewer.length == 0) {
			return socket.emit('after-update-interviewer', {err: 'interviewer list is empty'});
		}
		interviewDAO.modifyinterviewers(data.name, data.interviewer, function(err, interview) {
			if (err) {
				return socket.emit('after-update-interviewer', {err: err});
			}
			userDAO.getUserListByName(interview.interviewer, function(err, users) {
				if (err) {
					return socket.emit('after-update-interviewer', {err: err});
				}
				socket.emit('after-update-interviewer', {
					interviewers: users,
					interviewName: data.name
				});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	socket.on('update-interviewee-in-interview', function(data) {
		if (!check(data, 'name', 'interviewee')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		if (data.interviewee.length == 0) {
			return socket.emit('after-update-interviewer', {err: 'interviewee list is empty'});
		}
		interviewDAO.modifyinterviewees(data.name, data.interviewee, function(err, interview) {
			if (err) {
				return socket.emit('after-update-interviewee', {err: err});
			}
			var intervieweeList = [];
			interview.interviewee.forEach(function(interviewee) {
				userDAO.getUserByName(interviewee.name, function(err, user) {
					if (err) {
						return socket.emit('after-update-interviewee', {err: err});
					}
					interviewee.avatar = user.avatar;
					intervieweeList.push(interviewee);
					if (intervieweeList.length == interview.interviewee.length) {
						socket.emit('after-update-interviewee', {
							interviewees: intervieweeList,
							interviewName: data.name
						});
						socket.broadcast.emit('refresh-interview');
					}
				});
			});
		});
	});

	socket.on('change-interview-status', function(data) {
		if (!check(data, 'name', 'status')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.updateInterviewstatus(data.name, data.status, function(err, interview) {
			if (err) {
				return socket.emit('after-change-interview-status', {err: err});
			}
			if (data.status != 'ready' && data.status != 'completed') {
				return socket.emit('after-change-interview-status', {interview: interview});
			}
			interviewDAO.restoreAllToWaiting(data.name, function(err) {
				if (err) {
					return socket.emit('after-change-interview-status', {err: err});
				}
				socket.emit('after-change-interview-status', {log: 'success'});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	function _callCreateDocByName(interviewee, interviewName, problemName, callback) {
		var path = '/' + interviewee + '/' + problemName + '@' + interviewName;
		docDAO.createDocByname(interviewee, path, 'doc', function(err) {
			if (err) {
				return userDAO.getUserByName(interviewee, function(err, user) {
					if (err) {
						return callback(err);
					}
					docDAO.deleteDoc(user._id, path, function(err) {
						if (err) {
							return callback(err);
						}
						return _callCreateDocByName(interviewee, interviewName, problemName, callback);
					});
				});
			}
			return callback(null, path);
		});
	}

	socket.on('push-problem', function(data) {
		if (!check(data, 'interviewName', 'intervieweeList', 'interviewerList', 'problemName')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		var i = 0;
		if (data.intervieweeList.length == 0) {
			return socket.emit('after-push-problem', {log: 'no interviewee'});
		}
		interviewDAO.updateProblemstatus(data.interviewName, data.problemName, 'pushing', function(err) {
			if (err) {
				return socket.emit('after-push-problem', {err: err});
			}
			data.intervieweeList.forEach(function(interviewee) {
				_callCreateDocByName(interviewee, data.interviewName, data.problemName, function(err, path) {
					if (err) {
						return socket.emit('after-push-problem', {err: err});
					}
					docDAO.setinterviewmember(path, interviewee, data.interviewerList, function(err) {
						if (err) {
							return socket.emit('after-push-problem', {err: err});
						}
						i++;
						if (i == data.intervieweeList.length) {
							socket.emit('after-push-problem', {log: 'success'});
							socket.broadcast.emit('refresh-interview');
						}
					});
				});
			});
		});
	});

	socket.on('delete-interview', function(data) {
		if (!check(data, 'interviewName')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.deleteInterview(data.interviewName, function(err) {
			if (err) {
				return socket.emit('read-interview', {err: err});
			}
			interviewDAO.getInterviews(socket.session.user.name, 1, function(err, interviews) {
				if (err) {
					return socket.emit('read-interview', {err: err});
				}
				socket.emit('read-interview', {
					interview: interviews,
					mode: 1,
					username: socket.session.user.name
				});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	socket.on('change-interviewee-status', function(data) {
		if (!check(data, 'interviewName', 'intervieweeList', 'status')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		if (data.intervieweeList.length == 0) {
			return socket.emit('after-update-status-interviewees', {err: 'empty list'});
		}
		interviewDAO.updateIntervieweestatus(data.interviewName, data.intervieweeList, data.status, function(err) {
			if (err) {
				return socket.emit('after-update-status-interviewees', {err: err});
			}
			userDAO.getUserListByName(data.intervieweeList, function(err, users) {
				if (err) {
					return socket.emit('after-update-status-interviewees', {err: err});
				}
				socket.emit('after-update-status-interviewees', {
					users: users,
					interviewName: data.interviewName
				});
				socket.broadcast.emit('refresh-interview');
			});
		});
	});

	socket.on('get-status-interviewees', function(data) {
		if (!check(data, 'interviewName', 'status')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.getstatusinterviewees(data.interviewName, data.status, function(err, intervieweeList) {
			if (err) {
				return socket.emit('after-get-status-interviewees', {err: err});
			}
			userDAO.getUserListByName(intervieweeList, function(err, users) {
				if (err) {
					return socket.emit('after-get-status-interviewees', {err: err});
				}
				socket.emit('after-get-status-interviewees', {
					users: users,
					interviewName: data.interviewName
				});
			});
		});
	});

	socket.on('change-problem-status-interview', function(data) {
		if (!check(data, 'interviewName', 'problemName', 'status')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.updateProblemstatus(data.interviewName, data.problemName, data.status, function(err, interview) {
			if (err) {
				return socket.emit('after-change-problem-status-interview', {err: err});
			}
			socket.emit('after-change-problem-status-interview', {interview: interview});
			socket.broadcast.emit('refresh-interview');
		});
	});

	socket.on('get-status-problems-interview', function(data) {
		if (!check(data, 'interviewName', 'status')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.getstatusproblems(data.interviewName, data.status, function(err, problemList) {
			if (err) {
				return socket.emit('after-get-status-problem', {err: err});
			}
			switch (data.status) {
				case 'waiting':
					problemDAO.getProblemByNameList(problemList, function(err, problems) {
						if (err) {
							return socket.emit('after-get-status-problem', {err: err});
						}
						socket.emit('after-get-status-problem', {
							status: data.status,
							interviewName: data.interviewName,
							problems: problems
						});
					});
					break;
				case 'pushing':
					problemDAO.getProblemByName(problemList[0], function(err, problem) {
						if (err) {
							return socket.emit('after-get-status-problem', {err: err});
						}
						socket.emit('after-get-status-problem', {
							status: data.status,
							interviewName: data.interviewName,
							problem: problem
						});
					});
					break;
				case 'complete':
					problemDAO.getProblemByNameList(problemList, function(err, problems) {
						if (err) {
							return socket.emit('after-get-status-problem', {err: err});
						}
						socket.emit('after-get-status-problem', {
							status: data.status,
							interviewName: data.interviewName,
							problems: problems
						});
					});
					break;
			}
		});
	});

	socket.on('get-doc-in-interview', function(data) {
		if (!check(data, 'interviewName', 'intervieweeName', 'problemName')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		var path = '/' + data.intervieweeName + '/' + data.problemName + '@' + data.interviewName;
		userDAO.getUserByName(data.intervieweeName, function(err, user) {
			if (err) {
				return socket.emit('get-doc-in-interview', {err: err});
			}
			docDAO.getDocByPath(user._id, path, function(err, doc) {
				if (err) {
					return socket.emit('get-doc-in-interview', {err: err});
				}
				socket.emit('get-doc-in-interview', {
					doc: doc,
					interviewName: data.interviewName
				});
			});
		});
	});

	socket.on('enter-interview', function(data) {
		if (!check(data, 'interviewName')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		interviewDAO.getInterviewByName(data.interviewName, function(err, interview) {
			if (err) {
				return socket.emit('try-enter-interview', {err: err});
			}
			if (interview.status != 'running') {
				return socket.emit('try-enter-interview', {err: "not a running interview"});
			}
			var i;
			for (i = 0; i < interview.interviewee.length; i++) {
				if (interview.interviewee[i].name == socket.session.user.name) {
					if (interview.interviewee[i].status != 'onRound') {
						return socket.emit('try-enter-interview', {err: "not an onRound interviewee"});
					}
					break;
				}
			}
			var problem = null;
			for (i = 0; i < interview.problemlist.length; i++) {
				if (interview.problemlist[i].status == 'pushing') {
					problem = interview.problemlist[i].name;
					break;
				}
			}
			if (!problem) {
				return socket.emit('try-enter-interview', {err: "no pushing problem"});
			}
			var path = '/' + socket.session.user.name + '/' + problem + '@' + data.interviewName;
			docDAO.getDocByPath(socket.session.user._id, path, function(err, doc) {
				if (err) {
					return socket.emit('try-enter-interview', {err: err});
				}
				socket.emit('try-enter-interview', {
					doc: doc,
					interviewName: data.interviewName
				});
			});
		});
	});

	socket.on('save-image', function(data) {
		if (!check(data, 'fileName', 'image')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		io.emit('refresh-drawing-board', {
			image: data.image,
			fileName: data.fileName
		});
		docDAO.updatedrawingboard(data.fileName, data.image, function(err) {
			if (err) {
				return socket.emit('after-save-image', {err: err});
			}
		});
	});

	socket.on('get-image', function(data) {
		if (!check(data, 'fileName')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		docDAO.getdrawingboard(data.fileName, function(err, doc) {
			if (err) {
				return socket.emit('after-get-image', {err: err});
			}
			socket.emit('after-get-image', {doc: doc});
		});
	});

	socket.on('update-comment', function(data) {
		if (!check(data, 'path', 'LineList', 'line')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		socket.broadcast.emit('refresh-line-comment', {
			path: data.path,
			comment: data.LineList,
			line: data.line
		});
		docDAO.updatenotes(data.path, data.LineList, function(err) {
			if (err) {
				return socket.emit('after-update-comment', {err: err});
			}
		});
	});

	socket.on('get-comment', function(data){
		if (!check(data, 'path')) {
			return;
		}
		if (!socket.session) {
			return socket.emit('unauthorized');
		}
		docDAO.getnotes(data.path, function(err, doc) {
			if (err) {
				return socket.emit('after-get-comment', {err: err});
			}
			socket.emit('after-get-comment', {
				path: data.path,
				comment: doc.notes
			});
		});
	});

	// voice control in room
	// Reference: https://github.com/muaz-khan/WebRTC-Experiment/tree/master/socketio-over-nodejs
	var initiatorChannel = '';
	socket.on('new-channel', function (data) {
		if (!channels[data.channel]) {
			initiatorChannel = data.channel;
		}
		channels[data.channel] = data.channel;
		onNewNamespace(data.channel, data.sender);
	});
	socket.on('presence', function (channel) {
		var isChannelPresent = !! channels[channel];
		socket.emit('presence', isChannelPresent);
	});
	socket.on('disconnect', function (channel) {
		if (initiatorChannel) {
			delete channels[initiatorChannel];
		}
	});
});

// voice control in room
// Reference: https://github.com/muaz-khan/WebRTC-Experiment/tree/master/socketio-over-nodejs
function onNewNamespace(channel, sender) {
	io.of('/' + channel).on('connection', function (socket) {
		var username;
		if (io.isConnected) {
			io.isConnected = false;
			socket.emit('connect', true);
		}
		socket.on('message', function (data) {
			if (data.sender == sender) {
				if(!username) username = data.data.sender;
				socket.broadcast.emit('message', data.data);
			}
		});
		socket.on('disconnect', function() {
			if(username) {
				socket.broadcast.emit('user-left', username);
				username = null;
			}
		});
	});
}