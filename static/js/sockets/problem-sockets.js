/**
 * Created by tarma on 14年11月9日.
 */
var app = app || {};

(function() {
    var listeners = {

        // Add problem
        "add-problem": function() {
            app.collection.problems.fetch({
                all: true,
                name: '',
                success: function() {
                    app.views['problemset'].renewList();
                },
                virtual: true
            });
        }

    };

    // Start listening
    (function() {
        app.init_suf.problemSocket = function() {
            if (app.socket) {
                return;
            }
            var socket = app.socket = io.connect(app.Package.SOCKET_IO);
            for (var i in listeners) {
                socket.on(i, listeners[i]);
            }
        };
        app.init_suf.problemSocket();
    })();

})();