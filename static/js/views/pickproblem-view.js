/**
 * 选择题目视图
 */
var app = app || {};
(function(){
    'use strict'
    app.PickProblemView = Backbone.View.extend({
        tagName: 'li',
        template : _.template($('#allproblem-template').html(), null, {
            variable: 'model'
        }),

        events:{
            'click a': 'select',
        },

        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        select: function(){
            $('li').removeClass('active');
            this.$el.addClass('active');

            if (this.$el.parents('#interviewproblem-list').length > 0){
                var dp = $('#setproblem-remove');
                dp.removeAttr('disabled');
            }else{
                var ap = $('#setproblem-add');
                ap.removeAttr('disabled');
            }
        },


    });
})();