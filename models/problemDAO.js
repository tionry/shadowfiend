module.exports = ProblemDAO;
var db = require('./db.js');
var Lock = require('./lock.js');
var lock = new Lock();

function ProblemDAO() {
	if(!(this instanceof ProblemDAO)) {
		return new ProblemDAO();
	}
	this.innerError = false;
}

function validateName(str){
	var re = /[\*\\\|:\"\'\/\<\>\?\@]/;
	return str.length <= 40 && re.test(str);
};

ProblemDAO.prototype.createProblem = function (name, description, callback) {
	lock.acquire(name, function() {
		db.problem.findOne({name:name}, {_id:1}, function(err, problem) {
			if (err) {
				lock.release(name);
				return callback("inner error");
			}
			if (problem) {
				lock.release(name);
				return callback("problem exists");
			}
			if(validateName(name)){
				lock.release(name);
				return callback("problem name error");
			}
			db.problem.find({},{_id:1},function(err, problems) {
				if (err) {
					lock.release(name);
					return callback("inner error");
				}
				db.problem.insert({
					name: name,
					description: description,
					ord: problems.length + 1,
					createTime: new Date().getTime()
				},
				function (err, newProblem) {
					if(err) {
						lock.release(name);
						return callback("inner error");
					}
					if(!newProblem) {
						lock.release(name);
						return callback("inner error");
					}
					lock.release(name);
					return callback(null);
				});
			});
		});
	});
};

ProblemDAO.prototype.getProblemByName = function (name, callback) {
	db.problem.findOne({name:name}, {name:1, description:1, ord:1, createTime:1}, function (err, problem) {
		if (err) {
			return callback("inner error");
		}
		if (!problem) {
			return callback("problem not found");
		}
		return callback(null, problem);
	});
};

ProblemDAO.prototype.getAllProblems = function (callback) {
	db.problem.find({}, {name:1, description:1, ord:1, createTime:1}, function (err, problems) {
		if (err) {
			return callback("inner error");
		}
		if (!problems) {
			return callback("problem not found");
		}
		return callback(null, problems);
	});
};

ProblemDAO.prototype.deleteProblem = function (name, callback) {
	lock.acquire(name, function() {
		db.problem.findOne({name:name}, {_id:1}, function (err, problem) {
			if (err) {
				lock.release(name);
				return callback("inner error");
			}
			if (!problem) {
				lock.release(name);
				return callback("problem not found");
			}
			db.problem.remove({_id: problem._id}, function (err, reply) {
				if (err) {
					lock.release(name);
					return callback("inner error");
				}
				lock.release(name);
				return callback(null);
			});
		});
	});
};

ProblemDAO.prototype.getProblemByNameList = function(nameList, callback) {
	db.problem.find({name: {$in: nameList}}, {name: 1}, function(err, problems) {
		if (err) {
			return callback("inner error");
		}
		if (!problems) {
			return callback("problem not found");
		}
		return callback(null, problems);
	});
};