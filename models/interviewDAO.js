/**
 * Created by qiaocy on 14-11-21.
 */
module.exports = interviewDAO;
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
                return callback("name exists");
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
}

InterviewDAO.prototype.getInterviewByName = function (name, callback) {
    db.interview.findOne({name:name}, {name:1, interviewer:1, interviewee:1, problemlist:1,status:1 ,createTime:1}, function (err, interview) {
        if (err) {
            return callback("inner error");
        }
        if (!interview) {
            return callback("unauthorized");
        }
        return callback(null, interview);
    });
}

InterviewDAO.prototype.getAllInterviews = function (callback) {
    db.interview.find({}, {name:1, description:1, ord:1, createTime:1}, function (err, interviews) {
        if (err) {
            return callback("inner error");
        }
        if (!problems) {
            return callback("unauthorized");
        }
        return callback(null, interviews);
    });
}

InterviewDAO.prototype.deleteInterview = function (name, callback) {
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