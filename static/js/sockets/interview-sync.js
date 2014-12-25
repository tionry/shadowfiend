/**
 * Created by FU CHIN SENG on 14年11月21日.
 */
var app = app || {};

(function() {
    // Reset 'sync' method of interview model
    var syncInterview = function(method, model, options) {
        if (!(app.Lock.attach(options))) {
            return false;
        }
        if (options.virtual === true) {
            return;
        }
        var m;
        var d = {
            username: model.get('username'),
            mode: model.get('mode')
        };

        //消息处理
        switch(method) {
            case 'read':
                m = 'read-problem';
                break;
            case 'patch':
            case 'update':
            case 'create':
            case 'delete':
        }
        app.socket.emit(m, d);
    };

    var syncInterviews = function(method, collection, options) {
        if (method != 'read') {
            return;
        }
        if (options.interview) {
            return;
        }
        options.success(options.interviews);
    };

    app.init || (app.init = {});
    app.init.InterviewSync = function() {
        app.Interview.prototype.sync = syncInterview;
        app.Interviews.prototype.sync = syncInterviews;
    };

})();