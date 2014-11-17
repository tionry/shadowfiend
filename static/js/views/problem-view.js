/*problem*/
var app = app || {};
(function(){
    'use strict'
    app.ProblemView = Backbone.View.extend({
        tagName: 'tr',
        className: 'problem-item',
        template : _.template($('#problem-template').html(), null, {
            variable: 'model'
        }),

        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
    });
})();