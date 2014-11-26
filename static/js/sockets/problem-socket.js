/**
 * Created by tarma on 14年11月9日.
 */
var app = app || {};

(function() {
    var listeners = {

        // Refresh problem collection
        "read-problem": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }

            app.Lock.detach(data);
            switch (data.mode) {
                case 'interview':
                    app.collections.allproblems.fetch({
                        all: true,
                        name: '',
                        virtual: true
                    });
                    break;
                case 'problemset':
                    app.collections.problems.fetch({
                        all: true,
                        name: '',
                        virtual: true
                    });
                    break;
                case 'update-interview':
                    app.collections.problemList.fetch({
                        all: true,
                        name: '',
                        virtual: true
                    });
                    break;
            }
            app.Lock.detach(data);
            delete data.problem;
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