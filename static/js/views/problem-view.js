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
            this.model.collection.fetch({
                name: this.model.get('name'),
                description: this.model.get('description'),
            })
            checkproblem(this.model);
        },

        checkproblem:function(model){
            app.Lock.attach({
                loading: loading,
                tend: 5000,
                fail: function(data) {
                    app.showMessageBox('error', data && data.err);
                },
                error: function(data) {
                    app.showMessageBox('error', data.err);
                },
                success: function(data) {
                    window.location.href = '#problem/';
                    this.onSet(data);
                },
            });
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

        Onset:function(data){
            app.Lock.remove();
            data.notRemove = true;
            var proobj = this.model.json;
            $('#problem-name').html(_.escape(proobj.shownName));
            $('#problem-description').html("hahahahah");
        }

    });
})();