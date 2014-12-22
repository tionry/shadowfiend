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
                    intervieweelist[i] = {name:iname,status:"waiting",evaluation:""};
                    i++;
                });
                var problemlist = [];
                var j = 0;
                problems.forEach(function(iname,j){
                    problemlist[j] = {name:iname,status:"waiting"};
                    j++;
                });
                db.interview.insert({
                        name: name,
                        interviewer:interviewers,
                        interviewee:intervieweelist,
                        problemlist:problemlist,
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

InterviewDAO.prototype.getInterviews = function (userName, mode, callback) {
    if (mode == 1) {
        db.interview.find({"interviewer": userName}, {
            name: 1,
            interviewer: 1,
            interviewee: 1,
            problemlist: 1,
            status: 1,
            createTime: 1
        }, function (err, interviews) {
            if (err) {
                return callback("inner error");
            }
            if (!interviews) {
                return callback("interview not found");
            }
            return callback(null, interviews);
        });
    } else {
        if (mode == 2) {
            db.interview.find({"interviewee.name":userName}, {name:1,interviewer:1,interviewee:1,status:1, createTime: 1}, function (err,interviews) {
                if (err) {
                    return callback("inner error");
                }
                if (!interviews) {
                    return callback("interview not found");
                }
                return callback(null, interviews);
            });
        } else {
            return callback("bad mode infomation");
        }
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

InterviewDAO.prototype.updateProblem = function(name, problems, callback) {
    lock.acquire(name, function() {
        var probleml = [];
        var i = 0;
        problems.forEach(function(problemname,i){
            probleml[i] = {name:problemname,status:"waiting"};
            i++;
            if(i == problems.length){
                db.interview.findAndModify({
                    query: {name: name},
                    update: {$set: {problemlist: probleml}},
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
            }
        });

    });
};

//change interviewee's status.
InterviewDAO.prototype.updateIntervieweestatus = function(interviewname, intervieweename,status, callback) {
    lock.acquire(interviewname, function() {
        db.interview.findOne({name:interviewname},{interviewee:1},function(err,interv){
            if(err){
                lock.release(interviewname);
                return callback("inner error");
            }
            var intervieweelist=[];
            var i = 0,j = 0;
            var flag = 0;
            interv.interviewee.forEach(function(viewee){
                intervieweename.forEach(function(vieweename){
                    if(viewee.name == vieweename){
                        intervieweelist[i] = {name:vieweename,status:status,evaluation:viewee.evaluation};
                        i++;
                        flag = 1;
                    }
                    j++;
                    if(j == intervieweename.length){
                        j = 0;
                        if(flag == 0){
                            intervieweelist[i] = viewee;
                            i++;
                        }
                        flag = 0;
                    }
                    if(i == interv.interviewee.length)
                    {
                        db.interview.update(
                            {
                                name:interviewname
                            },
                            {
                                $set:{
                                    interviewee:intervieweelist
                                }
                            }, function(err, interview) {
                                if (err) {
                                    lock.release(interviewname);
                                    return callback("inner error");
                                }

                                db.interview.findOne({name: interviewname}, {
                                    name: 1,
                                    interviewee: 1
                                }, function (err, interview) {
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
                    }
                })
            })
        })
    });
};

InterviewDAO.prototype.updateProblemstatus = function(interviewname, problemname,status, callback) {
    lock.acquire(interviewname, function() {
        db.interview.findOne({name:interviewname},{problemlist:1},function(err,interv){
            if(err){
                lock.release(interviewname);
                return callback("inner error");
            }
            var problems=[];
            var i = 0;
            interv.problemlist.forEach(function(problem){
                    if(problemname == problem.name){
                        problems[i] = {name:problemname,status:status}
                    }
                    else{
                        problems[i] = problem;
                    }
                    i++;
                    if(i == interv.problemlist.length)
                    {
                        db.interview.update(
                            {
                                name:interviewname
                            },
                            {
                                $set:{
                                    problemlist:problems
                                }
                            }, function(err, interview) {
                                if (err) {
                                    lock.release(interviewname);
                                    return callback("inner error");
                                }
                                db.interview.findOne({name: interviewname}, {
                                    name: 1,
                                    problemlist: 1
                                }, function (err, interview) {
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
                    }
                })
            })
        })
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
                db.interview.findOne({name:interviewname},{name:1,status:1},function(err,interview){
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

InterviewDAO.prototype.getstatusinterviewees = function(interviewname,status,callback){
    db.interview.findOne({name:interviewname},{interviewee:1},function(err,inter){
        if(err){
            return callback("inner error");
        }
        var intervieweelist = [];
        var i,j;
        i = 0;
        j = 0;

        inter.interviewee.forEach(function(interviewee){
            if(interviewee.status == status){
                intervieweelist[i] = interviewee.name;
                i++;
            }
            j++;
            if(j == inter.interviewee.length){
                return callback(null,intervieweelist);
            }
        });
    })
};

InterviewDAO.prototype.getstatusproblems = function(interviewname,status,callback){
    db.interview.findOne({name:interviewname},{problemlist:1},function(err,inter){
        if(err){
            return callback("inner error");
        }
        var problemlist = [];
        var i,j;
        i = 0;
        j = 0;
        inter.problemlist.forEach(function(problem){
            if(problem.status == status){
                problemlist[i] = problem.name;
                i++;
            }
            j++;
            if(j == inter.problemlist.length){
                return callback(null,problemlist);
            }
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

                db.interview.findOne({name:interviewname},{name:1,interviewer:1},function(err,interview){
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
            if(i == interviewees.length){
                db.interview.update(
                    {
                        name: interviewname
                    },
                    {
                        $set:{
                            interviewee:intervieweelist
                        }

                    }, function(err, interview) {
                        if (err) {
                            lock.release(interviewname);
                            return callback("inner error");
                        }
                        db.interview.findOne({name:interviewname},{name:1,interviewee:1},function(err,interview){
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
            }
        });
    });
};

InterviewDAO.prototype.restoreAllToWaiting = function(interviewName, callback) {
    lock.acquire(interviewName, function() {
        db.interview.findOne({name: interviewName}, {
            problemlist: 1,
            interviewee: 1
        }, function(err, interview) {
            if (err) {
                lock.release(interviewName);
                return callback("inner error");
            }
            var newProblemList = [];
            var newIntervieweeList = [];
            interview.problemlist.forEach(function(problem) {
                problem.status = 'waiting';
                newProblemList.push(problem);
            });
            interview.interviewee.forEach(function(interviewee) {
                interviewee.status = 'waiting';
                newIntervieweeList.push(interviewee);
            });
            db.interview.update({name: interviewName}, {$set: {
                problemlist: newProblemList,
                interviewee: newIntervieweeList
            }}, function(err) {
                if (err) {
                    lock.release(interviewName);
                    return callback("inner error");
                }
                lock.release(interviewName);
                return callback(null);
            })
        });
    });
};

//change interviewee's evaluation.
InterviewDAO.prototype.updateIntervieweeevaluation = function(interviewname, intervieweename,evaluation, callback) {
    lock.acquire(interviewname, function() {
        db.interview.findOne({name:interviewname},{interviewee:1},function(err,interv){
            if(err){
                lock.release(interviewname);
                return callback("inner error");
            }
            var intervieweelist=[];
            var i = 0,j = 0;
            var flag = 0;
            interv.interviewee.forEach(function(viewee){
                intervieweename.forEach(function(vieweename){
                    if(viewee.name == vieweename){
                        intervieweelist[i] = {name:vieweename,status:viewee.status,evaluation:evaluation}
                        i++;
                        flag = 1;
                    }
                    j++;
                    if(j == intervieweename.length){
                        j = 0;
                        if(flag == 0){
                            intervieweelist[i] = viewee;
                            i++;
                        }
                        flag = 0;
                    }
                    if(i == interv.interviewee.length)
                    {
                        db.interview.update(
                            {
                                name:interviewname
                            },
                            {
                                $set:{
                                    interviewee:intervieweelist
                                }
                            }, function(err, interview) {
                                if (err) {
                                    lock.release(interviewname);
                                    return callback("inner error");
                                }

                                db.interview.findOne({name: interviewname}, {
                                    name: 1,
                                    interviewee: 1
                                }, function (err, interview) {
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
                    }
                });
            });
        });
    });
};

InterviewDAO.prototype.getintervieweeevaluation = function(interviewname,intervieweename,callback){
    db.interview.findOne({name:interviewname},{interviewee:1},function(err,inter){
        if(err){
            return callback("inner error");
        }
        var intervieweeobj = [];
        var i,j;
        i = 0;
        j = 0;

        inter.interviewee.forEach(function(interviewee){
            if(interviewee.name == intervieweename){
                intervieweeobj = interviewee;
                i++;
            }
            j++;
            if(j == inter.interviewee.length){
                return callback(null,intervieweeobj);
            }
        });
    })
};