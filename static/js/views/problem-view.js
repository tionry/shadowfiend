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
            'click a.problem-go':'go',
            'click a.problem-modify':'modify',
            'click a.problem-delete':'delete',
            'click a.problem-toggle':'toggleDone',
        },
        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            //this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        //Check one problem
        go:function(e){
            var model = this.model.collection.fetch({
                name: this.model.get('name'),
                discription: this.model.get('discription'),
            })
        },

        // Remove the item, destroy the model.
        delete:function(){
            var modal = $('#delete'),
                model = this.model;
            modal.find('#delete-name').text(model.json.name);
            var cnfm = modal.find('.modal-confirm');
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('shown');
                modal.off('hide');
            });
            cnfm.on('click', function () {
                model.destroy({
                    loading: modal.find('.modal-buttons'),
                    success: function () {
                        modal.modal('hide');
                    },
                    error: function (m, data) {
                        app.showMessageBox('delete', data.err);
                    },
                });
            });
            modal.modal('show');
        },

        //Modify problem information
        modify:function(){

        },

        // Toggle the `"done"` state of the model.
        toggleDone: function() {
            this.model.toggle();
        },

    });
})();