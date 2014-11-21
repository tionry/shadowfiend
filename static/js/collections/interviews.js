/*
*Interview Collection
 */
(function() {
    'use strict';

    app.Interviews = Backbone.Collection.extend({

        model: app.Interview,

        fetch: function(opts) {
            var _fetch = Backbone.Collection.prototype.fetch;
            if (opts.all || opts.name) {
                opts.reset = (opts.all != this.all) && (opts.name != this.name);
                var oldName = this.name, oldAll = this.all, err = opts.error, fail = opts.fail, that = this;
                this.all = opts.all;
                this.name = opts.name;
                opts.error = function() {
                    that.name = oldName;
                    that.all = oldAll;
                    if (typeof err == 'function') {
                        err.apply(that, arguments);
                    }
                };
                opts.fail = function() {
                    that.name = oldName;
                    that.all = oldAll;
                    if (typeof fail == 'function') {
                        fail.apply(that, arguments);
                    }
                };
            }
            _fetch.call(this, opts);
        }
    });

    app.init || (app.init = {});

    app.init.interview = function() {
        app.collections['interview'] || (app.collections['interview'] = new app.Interview());
    };

})();