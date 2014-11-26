module.exports = InterviewDAO;
var db = require('./db.js');
var Lock = require('./lock.js');
var lock = new Lock();


function InterviewDAO() {
    if(!(this instanceof InterviewDAO)) {
        return new InterviewDAO();
    }
    this.innerError = false;
}

InterviewDAO.prototype.createInterview = function (name,interviewers,interviewees,problems,callback) {
    lock.acquire(name, function() {
        db.interview.findOne({name:name}, {_id:1}, function(err, interview) {
            if (err) {
                lock.release(name);
                return callback("inner error");
            }
            if (interview) {
                lock.release(name);
                return callback("interview exists");
            }
            db.interview.find({},{_id:1},function(err, interviews) {
                if (err) {
                    lock.release(name);
                    return callback("inner error");
                }
                db.interview.insert({
                        name: name,
                        interviewer:interviewers,
                        interviewee:interviewees,
                        problemlist:problems,
                        status:"waiting",
                        createTime: new Date().getTime()
                    },
                    function (err, newInterview) {
                        if(err) {
                            lock.release(name);
                            return callback("inner error");
                        }
                        if(!newInterview) {
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

InterviewDAO.prototype.getInterviewByName = function (name, callback) {
    db.interview.findOne({name:name}, {name:1, interviewer:1, interviewee:1, problemlist:1,status:1 ,createTime:1}, function (err, interview) {
        if (err) {
            return callback("inner error");
        }
        if (!interview) {
            return callback("interview not found");
        }
        return callback(null, interview);
    });
};

InterviewDAO.prototype.getInterviews = function (userName,mode,callback) {
    if(mode == 1){
        db.interview.find({"interviewer":userName}, {name:1,interviewer:1,interviewee:1,status:1, createTime:1}, function (err,interviews) {
            if (err) {
                return callback("inner error");
            }
            if (!interviews) {
                return callback("interview not found");
            }
            return callback(null, interviews);
        });
    }
    else if(mode == 2){
        db.interview.find({"interviewee":userName}, {name:1,interviewer:1,interviewee:1,status:1, createTime: 1}, function (err,interviews) {
            if (err) {
                return callback("inner error");
            }
            if (!interviews) {
                return callback("interview not found");
            }
            return callback(null, interviews);
        });
    }
    else{
        return callback("bad mode infomation");
    }

};


InterviewDAO.prototype.deleteInterview = function (name,callback) {
    lock.acquire(name, function() {
        db.interview.findOne({name:name}, {_id:1}, function (err, interview) {
            if (err) {
                lock.release(name);
                return callback("inner error");
            }
            if (!interview) {
                lock.release(name);
                return callback("interview not found");
            }
            db.interview.remove({_id: interview._id}, function (err, reply) {
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

InterviewDAO.prototype.updateProblem = function(name, problem, callback) {
    lock.acquire(name, function() {
        db.interview.findAndModify({
            query: {name: name},
            update: {problemlist: problem},
            new: true,
            fields: {problemlist: 1}
        }, function(err, interview) {
            if (err) {
                lock.release(name);
                return callback("inner error");
            }
            if (!interview) {
                lock.release(name);
                return callback("interview not found");
            }
            lock.release(name);
            return callback(null, interview);
        });
    });
};