/**
 * Created by tarma on 14年11月9日.
 */
var app = app || {};

(function() {
    var listeners = {

        // Refresh problem collection
        "read-problem": function(data) {
            switch (data.mode) {
                case 'all-problem':
                    app.collections.allproblems.fetch({
                        all: true,
                        name: '',
                        reset: true,
                        data: data.problem
                    });
                    break;
                case 'problemset':
                    app.collections.problems.fetch({
                        all: true,
                        name: '',
                        data: data.problem
                    });
                    break;
                case 'problem-in-interview':
                    app.collections.problemList.fetch({
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

        "after-update-problem": function(data) {
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