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
                opts.reset = (opts.username != this.username) || (opts.mode != this.mode);
                var oldUsername = this.username, oldMode = this.mode, err = opts.error, fail = opts.fail, that = this;
                this.username = opts.username;
                this.mode = opts.mode;
                opts.error = function() {
                    that.username = oldUsername;
                    that.mode = oldMode;
                    if (typeof err == 'function') {
                        err.apply(that, arguments);
                    }
                };
                opts.fail = function() {
                    that.username = oldUsername;
                    that.mode = oldMode;
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
        app.collections['interviews'] || (app.collections['interviews'] = new app.Interviews());
    };

})();