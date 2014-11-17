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

		comparator:'order'
	});

	app.init || (app.init = {});

	app.init.problems = function() {
		app.collections['problems'] || (app.collections['problems'] = new app.Problems());
	};

})();
