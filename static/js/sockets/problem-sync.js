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

    var syncProblems = function(method, collection, options) {
        if (m != 'read') {
            return;
        }
        if (!options.data) {
            return;
        }
        options.success(options.data);
    };


        /*(function() {
        var method = 'reset', success = null, dealProblem = function(data) {
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
            options.success = dealProblem;
            if (!(app.Lock.attach(options))) {
                return false;
            }
            success = newSuccess;
            method = options.reset ? 'reset' : 'set';
            if (options.virtual === true) {
                return;
            }
            app.socket.emit('read-problem', {
                name: c.name,
                all: c.all
            });
        };
    })();*/

    app.init || (app.init = {});
    app.init.problemSync = function() {
        app.Problem.prototype.sync = syncProblem;
        app.Problems.prototype.sync = syncProblems;
    };

    /*app.init_suf || (app.init_suf = {});
    (function() {
        var _init = false;
        app.init_suf.problemSync = function() {
            if(_init) {
                return;
            }
            _init = true;

            var detach = app.Lock.detach;
        };
    })();*/
})();