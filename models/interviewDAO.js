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

function validateName(str){
    var re = /[\*\\\|:\"\'\/\<\>\?\@]/;
    return str.length <= 40 && re.test(str);
};

InterviewDAO.prototype.createInterview = function (name,interviewers,interviewees,problems,callback) {
    lock.acquire(name, function() {
        db.interview.findOne({name:name}, {_id:1}, function(err, interview) {
            if (err) {
                lock.release(name);
                return callback("inner error");
            }
            if(validateName(name)){
                lock.release(name);
                return callback("interview name error");
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
                var intervieweelist = [];
                var i = 0;
                interviewees.forEach(function(iname,i){
                    intervieweelist[i] = {name:iname,status:"waiting"};
                    i++;
                });
                db.interview.insert({
                        name: name,
                        interviewer:interviewers,
                        interviewee:intervieweelist,
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
        db.interview.find({"interviewee.name":userName}, {name:1,interviewer:1,interviewee:1,status:1, createTime: 1}, function (err,interviews) {
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
            update: {$set: {problemlist: problem}},
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

InterviewDAO.prototype.changestatus = function(name, status){
    lock.acquire(name, function() {
       db.interview.findAndModify({
        query:{name:name},
        update:{$set:{status:status}},
        fields:{status:1},
        new:true
    },function(err,interview){
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

InterviewDAO.prototype.updateIntervieweestatus = function(interviewname, intervieweename,status, callback) {
    lock.acquire(interviewname, function() {
        var interv = db.interview.find({name:interviewname});
        var i = 0,index = -1;
        interv.interviewee.forEach(function(iname,i){
            if(iname == intervieweename){
                index = i;
            }
            i++;
        })
        if(index == -1){
            lock.release(name);
            return callback("inner error");
        }
        var toeditinterviewee = "interviewee." + index.toString();
        db.interview.update(
            {name: interviewname},
            {
                $set:{
                    toeditinterviewee :{name:name,status:status}
                }

        }, function(err, interview) {
            if (err) {
                lock.release(interviewname);
                return callback("inner error");
            }
            db.interview.find({name:interviewname},{name:1,interviewee:1},function(err,interview){
                if (err) {
                    lock.release(interviewname);
                    return callback("inner error");
                }
                if (!interview) {
                    lock.release(interviewname);
                    return callback("interview not found");
                }
                lock.release(interviewname);
                return callback(null, interview);
            });
        });
    });
};

InterviewDAO.prototype.updateInterviewstatus = function(interviewname,status, callback) {
    lock.acquire(interviewname, function() {
        db.interview.update(
            {name: interviewname},
            {
                $set:{
                    status:status
                }

            }, function(err, interview) {
                if (err) {
                    lock.release(interviewname);
                    return callback("inner error");
                }
                db.interview.find({name:interviewname},{name:1,status:1},function(err,interview){
                    if (err) {
                        lock.release(interviewname);
                        return callback("inner error");
                    }
                    if (!interview) {
                        lock.release(interviewname);
                        return callback("interview not found");
                    }
                    lock.release(interviewname);
                    return callback(null, interview);
                });
            });
    });
};

InterviewDAO.prototype.modifyinterviewers = function(interviewname,interviewers,callback){
    lock.acquire(interviewname, function() {
        db.interview.update(
            {name: interviewname},
            {
                $set:{
                    interviewer:interviewers
                }

            }, function(err, interview) {
                if (err) {
                    lock.release(interviewname);
                    return callback("inner error");
                }
                db.interview.find({name:interviewname},{name:1,interviewer:1},function(err,interview){
                    if (err) {
                        lock.release(interviewname);
                        return callback("inner error");
                    }
                    if (!interview) {
                        lock.release(interviewname);
                        return callback("interview not found");
                    }
                    lock.release(interviewname);
                    return callback(null, interview);
                });
            });
    });
};

InterviewDAO.prototype.modifyinterviewees = function(interviewname,interviewees,callback){
    lock.acquire(interviewname, function() {
        var intervieweelist = [];
        var i = 0;
        interviewees.forEach(function(iname,i){
            intervieweelist[i] = {name:iname,status:"waiting"};
            i++;
        });
        db.interview.update(
            {name: interviewname},
            {
                $set:{
                    interviewee:intervieweelist
                }

            }, function(err, interview) {
                if (err) {
                    lock.release(interviewname);
                    return callback("inner error");
                }
                db.interview.find({name:interviewname},{name:1,interviewee:1},function(err,interview){
                    if (err) {
                        lock.release(interviewname);
                        return callback("inner error");
                    }
                    if (!interview) {
                        lock.release(interviewname);
                        return callback("interview not found");
                    }
                    lock.release(interviewname);
                    return callback(null, interview);
                });
            });

    });
};