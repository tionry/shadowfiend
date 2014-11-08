/*problemset*/
var app = app || {};
(function(){
    'use strict' ;
    app.ProblemsetView = Backbone.View.extend({
        el:"#problemset"
    });
    app.init || (app.init = {});
    app.init.ProblemsetView = function () {
        if (app.views['problemset']) {
            return;
        }
        app.views['problemset'] = new app.ProblemView();
    };
})();