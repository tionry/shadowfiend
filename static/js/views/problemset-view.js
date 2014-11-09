/*problemset*/
var app = app || {};
(function(){
    'use strict' ;
    app.ProblemsetView = Backbone.View.extend({
        el:"#problemset",
        events:{
            'click #addproblem':'addproblem'
        },
        addproblem: function(){
            alert('haha');
        }
    });
    app.init || (app.init = {});
    app.init.ProblemsetView = function () {
        if (app.views['problemset']) {
            return;
        }
        app.views['problemset'] = new app.ProblemView();
    };
})();