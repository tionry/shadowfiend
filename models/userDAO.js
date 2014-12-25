module.exports = UserDAO;
var db = require('./db.js');
var crypto = require('crypto');
function UserDAO(){
	if(!(this instanceof UserDAO)){
		return new UserDAO();
	}
	this.innerError = false;
}

function md5(str){
	return crypto.createHash('md5').update(str).digest('hex');
}

function xor(str1, str2){
	var buf1 = new Buffer(str1, 'hex');
	var buf2 = new Buffer(str2, 'hex');
	var buf = new Buffer(16);
	for(var i = 0; i < 16; i++)
		buf[i] = buf1[i] ^ buf2[i];
	return buf.toString('hex');
}

function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function validateName(str){
	var re = /^[A-Za-z0-9]*$/;
	return str.length >= 6 && str.length <= 20 && re.test(str);
}

//注册新用户
UserDAO.prototype.register = function(name, password, avatar, group, callback){

	if(!validateName(name)){
		return callback("name invalid");
	}

	if(password.length > 32){
		return callback("password too long");
	}

	db.user.findOne({name:name}, {_id:1}, function(err, user){
		if(err){
			return callback("inner error");
		}
		if(user){
			return callback("name exists");
		}
		db.user.insert({
				name:name,
				password:md5(xor(md5(name), md5(password))),
				avatar:avatar,
				state:"normal",
				group:group,
				docs:[],
				createTime: new Date().getTime()
			},
			function(err, newUser){
				if(err){
					return callback("inner error");
				}
				else if(!newUser){
					return callback("inner error");
				}
				else{
					return callback(null);
				}
			});
	});
};

//获取用户
UserDAO.prototype.getUserByName = function(name,callback){
	db.user.findOne({name:name}, {name:1, avatar:1, _id:1}, function(err,user){
		if (err){
			return callback("innerError");
		}
		else if(!user){
			return callback("member doesn't exists");
		}
		return callback(null,user);
	});
};

//登录
UserDAO.prototype.login = function(name, password, ip, callback){
	var that = this;
	db.user.findOne({name:name}, function(err, user){
		if(err){
			return callback("inner error");
		}
		if(!user){
			return callback("unauthorized");
		}
		if(md5(xor(md5(name), md5(password))) == user.password){
			delete user.password;
			db.user.update({_id:user._id}, {
				$set:{
					loginTime:new Date().getTime(),
					loginIP:ip
				}
			}, function(err){
				if(err){
					return callback("inner error");
				}
				db.doc.find({_id : {$in:user.docs}}, {revisions:0,_id:0}, function(err, docs){
					if (err){
						return callback("inner error");
					}
					if (docs.length == 0){
						docs = [];
						user.docs = docs;
						return callback(null,user);
					}
					else{
						var counter = 0;
						function t(doc){
							db.user.findOne({_id:doc.owner},{name:1,_id:0,avatar:1},function(err,trueowner){
								if (err){
									that.innerError = true;
								}
								doc.owner = trueowner;
								db.user.find({_id:{$in:doc.members}},{name:1,_id:0,avatar:1},function(err,members){
									if (err){
										that.innerError = true;
									}
									doc.members = members;
									counter++;
									if (counter == docs.length){
										user.docs = docs;
										return callback(null ,user);
									}
								});
							});
						}
						for (i in docs){
							if (that.innerError){
								that.innerError = false;
								return callback("inner error");
							}
							t(docs[i]);
						}
					}
				});
			});
		}else{
			return callback("unauthorized");
		}
	});
};

//更新头像
UserDAO.prototype.updateAvatar = function(userId, avatar, callback){
	db.user.findOne({_id:userId}, function(err, user){
		if(err){
			return callback("inner error");
		}
		if(!user){
			return callback("unauthorized");
		}
		db.user.update({_id:userId}, {
			$set:{
				avatar:avatar
			}
		}, function(err){
			if(err){
				return callback("inner error");
			}
			return callback(null);
		});
	});
};

//更新密码
UserDAO.prototype.updatePassword = function(userId, password, newPassword, callback){
	db.user.findOne({_id:userId},function(err, user){
		if(err){
			return callback("inner error");
		}
		if(!user){
			return callback("unauthorized");
		}
		if(md5(xor(md5(user.name), md5(password))) == user.password){
			db.user.update({_id:userId},{
				$set:{
					password:md5(xor(md5(user.name), md5(newPassword)))
				}
			}, function(err){
				if (err){
					return callback("inner error");
				}
				return callback(null);
			});
		}
		else{
			return callback("password incorrect");
		}
	});
};

//获取用户列表
UserDAO.prototype.getUserListByName = function(name, callback) {
	db.user.find({name: {$in: name}}, {
		name: 1,
		avatar: 1
	}, function(err, users) {
		if (err) {
			return callback("inner error");
		}
		if (!users) {
			return callback("member doesn't exists")
		}
		return callback(null, users);
	});
};

