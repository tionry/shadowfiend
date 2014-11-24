/*
*Interview Collection
 */
(function() {
    'use strict';

    app.Interviews = Backbone.Collection.extend({

        model: app.Interview,

        fetch: function(opts) {
            var _fetch = Backbone.Collection.prototype.fetch;
            if (opts.username) {
                opts.reset = opts.username != this.username;
                var oldUsername = this.username, err = opts.error, fail = opts.fail, that = this;
                this.username = opts.username;
                opts.error = function() {
                    that.username = oldUsername;
                    if (typeof err == 'function') {
                        err.apply(that, arguments);
                    }
                };
                opts.fail = function() {
                    that.username = oldUsername;
                    if (typeof fail == 'function') {
                        fail.apply(that, arguments);
                    }
                };
            }
            _fetch.call(this, opts);
        }
    });

    app.init || (app.init = {});

    app.init.interviews = function() {
        app.collections['interviewer-interviews'] || (app.collections['interviewer-interviews'] = new app.Interviews());
        app.collections['interviewee-interviews'] || (app.collections['interviewee-interviews'] = new app.Interviews());
    };

})();