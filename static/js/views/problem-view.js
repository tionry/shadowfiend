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

        events:{
            'click .problem-go':'go',
            'click .problem-modify':'modify',
            'click .problem-delete':'delete',
            'click .problem-toggle':'toggleDone',
        },
        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            //this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            return this;
        },

        //Check one problem
        go:function(){

        },
        //Modify problem information
        modify:function(){

        },
        // Toggle the `"done"` state of the model.
        toggleDone: function() {
            this.model.toggle();
        },

        // Remove the item, destroy the model.
        delete: function() {
            this.model.destroy();
        },
    });
})();