/**
 * Created by tarma on 14年11月21日.
 */
var app = app || {};

// Socket: listening events about interviews.
(function() {
    var listeners = {

        // Refresh problem collection
        "read-interview": function(data) {
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
            app.collections.interviews.fetch({
                all: true,
                name: '',
                virtual: true
            });
            app.Lock.detach(data);
            delete data.problem;
        },

        "add-member": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            app.Lock.detach(data);
        }

    };

    app.init_suf || (app.init_suf = {});

    // Start listening
    (function() {
        var _init = false;
        app.init_suf.interviewSocket = function() {
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