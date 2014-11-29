//面试官、面试者主界面视图所有面试显示
var app = app || {};
(function(){
    'use strict'
    app.interviewView = Backbone.View.extend({
        tagName: 'tr',
        template : _.template($('#interview-template').html(), null, {
            variable: 'model'
        }),

        events:{
            'click a.interviewer-go':'interviewer_go',
            'click a.interviewee-go':'interviewee_go'
        //    'click a.problem-modify':'modify',
        //    'click a.problem-delete':'delete',
        //    'click a.problem-toggle':'toggleDone',
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

        //enter an interview
        interviewer_go:function(e){
            var v = this.model.v;
            var name = this.model.id;
            if (!v) {
                app.collections['intervieweeList-' + name] || (app.collections['intervieweeList-' + name] = new app.Members());
                app.collections['problemList-' + name] || (app.collections['problemList-' + name] = new app.Problems());
                app.collections['allproblems-' + name] || (app.collections['allproblems-' + name] = new app.Problems());
                this.model.v = new app.InterviewerMainView({
                    model: this.model,
                    interviewerList: app.collections['interviewerList'],
                    intervieweeList: app.collections['intervieweeList'],
                    problemList: app.collections['problemList-' + name],
                    allproblems: app.collections['allproblems-' + name]
                });
            }else{
                this.model.v.renewList();
            }
        },

        interviewee_go:function(e){

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
                    }
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
        }

    });
})();