module.exports = ProblemDAO;
var db = require('./db.js');
function ProblemDAO() {
	if(!(this instanceof ProblemDAO)) {
		return new ProblemDAO();
	}
	this.innerError = false;
}

//命名规范
function validateName(str){
	var re = /[\*\\\|:\"\'\/\<\>\@]/;
	return re.test(str);
}

function validateNameLength(str, len){
	return (str.length <= len);
}

//新建题目
ProblemDAO.prototype.createProblem = function (name, description, callback) {
	db.problem.findOne({name:name}, {_id:1}, function(err, problem) {
		if (err) {
			return callback("inner error");
		}

		if (problem) {
			return callback("problem exists");
		}
		if (validateName(name)){
			return callback("problem name error");
		}
		if (!validateNameLength(name, 20)){
			return callback("nametoolong");
		}
		db.problem.find({},{_id:1},function(err, problems) {
			if (err) {
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
						return callback("inner error");
					}
					if(!newProblem) {
						return callback("inner error");
					}
					return callback(null);
				});
		});
	});
};

//获取题目
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

//获取全部题目
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

//删除题目
ProblemDAO.prototype.deleteProblem = function (name, callback) {
	db.problem.findOne({name:name}, {_id:1}, function (err, problem) {
		if (err) {
			return callback("inner error");
		}
		if (!problem) {
			return callback("problem not found");
		}
		db.problem.remove({_id: problem._id}, function (err, reply) {
			if (err) {
				return callback("inner error");
			}
			return callback(null);
		});
	});
};

//获取题目
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