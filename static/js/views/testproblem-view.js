/**
 * 专门在面试中呈现的题目列表项
 */
var app = app || {};
(function(){
    'use strict'
    app.TestProblemView = Backbone.View.extend({
        tagName: 'li',
        template : _.template($('#allproblem-template').html(), null, {
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