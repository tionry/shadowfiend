module.exports = ProblemDAO;
var db = require('./db.js');
var Lock = require('./lock.js');
var lock = new Lock();

function ProblemDAO(){
	if(!(this instanceof ProblemDAO)){
		return new ProblemDAO();
	}
	this.innerError = false;
}

