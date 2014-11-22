//面试官、面试者主界面视图所有面试显示
var app = app || {};
(function(){
    'use strict'
    app.interviewView = Backbone.View.extend({
        tagName: 'li',
        //className: 'problem-item',
        template : _.template($('#interview-template').html(), null, {
            variable: 'model'
        }),

        //events:{
        //    'click a.problem-go':'go',
        //    'click a.problem-modify':'modify',
        //    'click a.problem-delete':'delete',
        //    'click a.problem-toggle':'toggleDone',
        //},
        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.json));
            return this;
        },

        //Check one problem
        go:function(e){

            $('#problem-name').html(this.model.attributes.name);
            $('#problem-description').html(this.model.attributes.description);
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