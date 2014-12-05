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
            'click a.operation':'delete',
            'click a.problem-toggle':'toggleDone',
        },
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
            var name = model.name;
            var that = this;
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('shown');
                modal.off('hide');
            });
            cnfm.on('click', function () {
                if (app.Lock.attach({
                        loading: modal.find('.modal-buttons'),
                        error: function (m, data) {
                            app.showMessageBox('delete', data.err);
                        },
                        success: function (){
                            that.$el.hide();
                            modal.modal('hide');
                        }
                    })) {
                    app.socket.emit('delete-problem', {
                        name: name,
                    });
                }
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