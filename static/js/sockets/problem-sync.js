var app = app || {};

(function() {
    // Reset 'sync' method of problem model
    var syncProblem = function(method, model, options) {
        if (!(app.Lock.attach(options))) {
            return false;
        }
        if (options.virtual === true) {
            return;
        }
        var m;
        var d = {
            name: model.get('name'),
            all: model.get('all')
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

    var syncProblems = (function() {
        var method = 'reset', success = null;

        return function(m, c, options) {
            if (m !== 'read') {
                return;
            }
            if (!(app.Lock.attach(options))) {
                return false;
            }
            method = options.reset ? 'reset' : 'set';
            if (options.virtual === true) {
                return;
            }
            app.socket.emit('read-problem', {name: c.name});
        };
    })();

    app.init || (app.init = {});
    app.init.problemSync = function() {
        app.Problem.prototype.sync = syncProblem;
        app.Problems.prototype.sync = syncProblems;
    };

    app.init_suf || (app.init_suf = {});
    (function() {
        var _init = false;
        app.init_suf.problemSync = function() {
            if(_init) {
                return;
            }
            _init = true;

            var detach = app.Lock.detach;
            app.socket.on('read-problem', detach);
        };
    })();
})();