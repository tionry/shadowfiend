/* Problem Model */
/* Problem Model has 'name', 'description' attributes.
 * name: 题目名
 * description: 题目描述
 */
var app = app || {};

(function () {
	'use strict';

	
	app.Problem = Backbone.Model.extend({
    idAttribute: 'name',
    	//default attributes for problem item
		defaults: function(){
			return {
				name: '',
				description: '',
				done:false
			}
		},
		toggle: function() {
			this.save({done: !this.get("done")});
		},


    
	});
  
})();
