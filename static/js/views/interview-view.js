/**
 * 面试官、面试者主界面视图单个面试视图
 */
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
            'click a.interviewee-go':'interviewee_go',
            'click a.operation':'delete'
        },
        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.json));
            if (this.model.v) {
                this.model.v.renewView();
            }
            return this;
        },

        //enter an interview
        interviewer_go:function(e){
            var v = this.model.v;
            var name = this.model.id;
            if (!v) {
                app.collections['problemList-' + name] || (app.collections['problemList-' + name] = new app.Problems());
                app.collections['allproblems-' + name] || (app.collections['allproblems-' + name] = new app.Problems());
                app.collections['interviewerList-' + name] || (app.collections['interviewerList-' + name] = new app.Members());
                app.collections['intervieweeList-' + name] || (app.collections['intervieweeList-' + name] = new app.Members());
                app.collections['round-intervieweeList-' + name] || (app.collections['round-intervieweeList-' + name] = new app.Members());
                app.collections['running-problem-'+name] || (app.collections['running-problem-'+name] = new app.Problems());
                this.model.v = new app.InterviewerMainView({
                    model: this.model,
                    roundList:  app.collections['round-intervieweeList-' + name],
                    problemList: app.collections['problemList-' + name],
                    pushedProblem: app.collections['running-problem-'+name]
                });
            }else{
                this.model.v.renewView();
            }
        },

        interviewee_go:function(){
            var interviewName = this.model.id;
            var intervieweeName = app.currentUser.name;
            if (app.Lock.attach({
                    error: function (data) {
                        app.showMessageBox('info', data.err);
                    }
                })) {
                app.socket.emit('enter-interview', {
                    interviewName: interviewName,
                    intervieweeName: intervieweeName
                })
            }
            app.models || (app.models = {});
            app.models['doc-' + interviewName] || (app.models['doc-' + interviewName] = new app.File());
            app.models['doc-' + interviewName].on('change', function() {
                app.room.tryEnter(app.models['doc-' + interviewName], null, '#interviewees', 'interviewee', app.models['pro-' + interviewName], interviewName);
            });
        },

        // Remove the item, destroy the model.
        delete:function(){
            var modal = $('#delete'),
                model = this.model;
            modal.find('#delete-name').text(model.json.name);
            var cnfm = modal.find('.modal-confirm');
            var name = model.json.name;
            var that = this;
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('shown');
                modal.off('hide');
            });
            cnfm.on('click', function () {
                app.socket.emit('delete-interview', {
                    interviewName: name
                });
                that.$el.hide();
                modal.modal('hide');
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