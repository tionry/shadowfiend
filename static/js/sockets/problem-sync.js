/**
 * Author: FU CHIN SENG
 */

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
        if (method != 'read') {
            return;
        }
        if (!options.data) {
            return;
        }
        options.success(options.data);
    };

    app.init || (app.init = {});
    app.init.problemSync = function() {
        app.Problem.prototype.sync = syncProblem;
        app.Problems.prototype.sync = syncProblems;
    };

})();