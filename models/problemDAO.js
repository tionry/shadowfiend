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

ProblemDAO.prototype.createProblem = function (name, description, callback) {
	lock.acquire(name, function() {
		db.problem.findOne({name:name}, {_id:1}, function(err, problem) {
			if (err) {
				lock.release(name);
				return callback("inner error");
			}
			if (problem) {
				lock.release(name);
				return callback("name exists");
			}
			db.problem.insert({
				name:name,
				description:description
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
}

ProblemDAO.prototype.getProblemByName = function (name, callback) {
	db.problem.findOne({name:name}, {name:1, description:1}, function (err, problem) {
		if (err) {
			return callback("inner error");
		}
		if (!problem) {
			return callback("unauthorized");
		}
		return callback(null, problem);
	});
}

ProblemDAO.prototype.getAllProblems = function (callback) {
	db.problem.find({}, {name:1, description:1}, function (err, problems) {
		if (err) {
			return callback("inner error");
		}
		if (!problems) {
			return callback("unauthorized");
		}
		return callback(null, problems);
	});
}

ProblemDAO.prototype.deleteProblem = function (name, callback) {
	lock.acquire(name, function() {
		db.problem.findOne({name:name}, {_id:1}, function (err, problem) {
			if (err) {
				lock.release(name);
				return callback("inner error");
			}
			if (!problem) {
				lock.release(name);
				return callback("unauthorized");
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
}
