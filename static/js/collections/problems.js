/* Problems Collection */
/* model: app.Problem */
var app = app || {}; 

(function() {
	'use strict';

	app.Problems = Backbone.Collection.extend({

		model: app.Problem,


		//Filter down the list of all problems that are finished
		done: function() {
			return this.where({done: true});
		},

		//Filter down the list of problems that are still not finished
		remaining: function() {
			return this.where({done: false});
		},
		//Keep problems in sequence
		nextOrder: function() {
			if (!this.length) return 1;
			return this.last().get('order') + 1;
		},

		comparator:'order',

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

	app.init.problems = function() {
		app.collections['problems'] || (app.collections['problems'] = new app.Problems());
		app.collections['allproblems'] || (app.collections['allproblems'] = new app.Problems());
	};

})();
