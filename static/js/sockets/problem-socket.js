/**
 * Created by FU CHIN SENG on 14年11月9日.
 */
var app = app || {};

(function() {
    var listeners = {

        // Refresh problem collection
        "read-problem": function(data) {
            switch (data.mode) {
                // show in interview room for selection
                case 'all-problem':
                    app.collections['allproblems-' + data.name].fetch({
                        all: true,
                        name: '',
                        reset: true,
                        data: data.problem
                    });
                    break;
                // show in problem list
                case 'problemset':
                    app.collections.problems.fetch({
                        all: true,
                        name: '',
                        data: data.problem
                    });
                    break;
                // show the problems selected in interview
                case 'problem-in-interview':
                    app.collections['problemList-' + data.name].fetch({
                        all: true,
                        name: '',
                        reset: true,
                        data: data.problem
                    });
                    break;
            }
        },

        "after-add-problem": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections.problems.fetch({
                all: true,
                name: '',
                data: data.problem
            });
            app.Lock.detach(data);
        },

        "after-update-interview-problem": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections.problemList.fetch({
                all: true,
                name: '',
                data: data.problem,
                reset: true
            });
            app.Lock.detach(data);
        },

        // Notify by other user
        "refresh-problemset": function() {
            app.socket.emit('read-problem', {
                all: true,
                name: '',
                mode: 'problemset'
            });
        }

    };

    app.init_suf || (app.init_suf = {});

    // Start listening
    (function() {
        var _init = false;
        app.init_suf.problemSocket = function() {
            if (_init) {
                return;
            } else {
                _init = true;
            }
            app.init_suf.socket();
            var socket = app.socket;

            for (var i in listeners) {
                socket.on(i, listeners[i]);
            }
        };
    })();

})();