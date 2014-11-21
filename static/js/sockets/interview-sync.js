/**
 * Created by tarma on 14年11月21日.
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

    var syncInterviews = (function() {
        var method = 'reset', success = null, dealInterview = function(data) {
            if (!data || !data.problem) {
                return;
            }
            if (typeof success == 'function') {
                success(data.problem);
            }
        };

        return function(m, c, options) {
            if (m !== 'read') {
                return;
            }
            var newSuccess = options.success;
            options.success = dealInterview;
            if (!(app.Lock.attach(options))) {
                return false;
            }
            success = newSuccess;
            method = options.reset ? 'reset' : 'set';
            if (options.virtual === true) {
                return;
            }
            app.socket.emit('read-interview', {
                name: c.username,
                mode: c.mode
            });
        };
    })();

    app.init || (app.init = {});
    app.init.InterviewSync = function() {
        app.Interview.prototype.sync = syncInterview;
        app.Interviews.prototype.sync = syncInterviews;
    };

    app.init_suf || (app.init_suf = {});
    (function() {
        var _init = false;
        app.init_suf.interviewSync = function() {
            if(_init) {
                return;
            }
            _init = true;
        };
    })();
})();