/* Problems Collection */
/* model: app.Problem */
var app = app || {}; 

(function() {
	'use strict';

	app.Problems = Backbone.Collection.extend({

		model: app.Problem,
	});

	app.init || (app.init = {});

	app.init.problems = function() {
		app.collections['problems'] || (app.collections['problems'] = new app.Problems());
	};

})();
