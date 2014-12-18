/**
 * Created by tarma on 14年11月21日.
 */
var app = app || {};

// Socket: listening events about interviews.
(function() {
    var listeners = {

        // Refresh interview collection
        "read-interview": function(data) {
            if (data.mode == 1) {
                app.collections['interviewer-interviews'].fetch({
                    username: data.username,
                    interviews: data.interview
                });
            } else {
                app.collections['interviewee-interviews'].fetch({
                    username: data.username,
                    interviews: data.interview
                });
            }
        },

        "check-user": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            app.Lock.detach(data);
        },

        "after-add-interview": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections['interviewer-interviews'].fetch({
                username: data.username,
                interviews: data.interview
            });
            app.Lock.detach(data);
        },

        "read-interviewer-in-interview": function(data) {
            if (data == null || data.err) {
                return;
            }
            app.collections['interviewerList-' + data.interviewName].update(data.interviewers);
        },

        "read-interviewee-in-interview": function(data) {
            if (data == null || data.err) {
                return;
            }
            app.collections['intervieweeList-' + data.interviewName].update(data.interviewees);
        },

        "after-update-interviewer": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections['interviewerList-' + data.interviewName].update(data.interviewers);
            app.Lock.detach(data);
        },

        "after-update-interviewee": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections['intervieweeList-' + data.interviewName].update(data.interviewees);
            app.Lock.detach(data);
        },

        "after-get-status-interviewees": function(data) {
            if (data == null || data.err) {
                return;
            }
            app.collections['round-intervieweeList-' + data.interviewName].update(data.users);
        },

        "after-update-status-interviewees": function(data) {
            if (data == null) {
                app.Lock.remove();
                return;
            }
            app.Lock.removeLoading();
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.collections['round-intervieweeList-' + data.interviewName].update(data.users);
            app.Lock.detach(data);
        },

        "after-get-status-problem": function(data) {
            if (data == null || data.err) {
                return;
            }
            switch (data.status) {
                case 'pushing':
                    app.collections['running-problem-' + data.interviewName].fetch({
                        reset: true,
                        all: true,
                        name: '',
                        data: data.problem
                    });
                    break;
            }
        },

        "after-change-interview-status": function(data) {
            app.Lock.detach(data);
        },

        "after-change-problem-status-interview": function(data) {
            app.Lock.detach(data);
        },

        "after-push-problem": function(data) {
            app.Lock.detach(data);
        },

        "get-doc-in-interview": function(data) {
            if (data == null || data.err) {
                return;
            }
            app.models || (app.models = {});
            app.models['doc-' + data.interviewName] || (app.models['doc-' + data.interviewName] = new app.File());
            app.models['doc-' + data.interviewName].set(data.doc);
        },

        "try-enter-interview": function(data) {
            if (!data) {
                app.Lock.remove();
                return;
            }
            if (data.err) {
                app.Lock.detach(data);
                return;
            }
            app.Lock.remove();
            app.models || (app.models = {});
            app.models['doc-' + data.interviewName] || (app.models['doc-' + data.interviewName] = new app.File());
            app.models['doc-' + data.interviewName].set(data.doc);
        },

        // Notify by other user
        "refresh-interview": function() {
            app.socket.emit('read-interview', {mode: 'interviewer'});
            app.socket.emit('read-interview', {mode: 'interviewee'});
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