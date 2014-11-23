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
}

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
}

InterviewDAO.prototype.getInterviews = function (userName,mode,callback) {
    var interviews = db.interview.find({}, {name:1}, function (err) {
        if (err) {
            return callback("inner error");
        }
        if (!interviews) {
            return callback("interview not found");
        }
    });
    if(interviews == null){
        return callback(null, interviews);
    }
    var allviews = [];
    var length = 0;
    interviews.forEach(function(elements,length){
        //search by interviewer
        if(mode == 1){
            elements.interviewer.forEach(function(viewer){
                if(viewer == userName){
                    allviews[length] = elements;
                    length++;
                }
            });
        }
        //search by interviewee
        else{
            elements.interviewee.forEach(function(viewer){
                if(viewer == userName){
                    allviews[length] = elements;
                    length++;
                }
            });
        }
    });
    return callback(null, allviews);
}


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
            db.interviewm.remove({_id: interview._id}, function (err, reply) {
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