/**
 * 面试官主页面
 */
var app = app || {};
(function(){
    app.InterviewerView = Backbone.View.extend({
        el:"#interviewer-control",

        template : _.template($('#interview-template').html(), null, {
            variable: 'model'
        }),

        render: function () {
            this.$el.html(this.template(this.model.json));
            return this;
        },
        initialize: function(){
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
        },

        addOne: function(model) {
            var v = model.view;
            model.set({"eid": model.get("eid") || app.collections['interviews'].length});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewer-table').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.interviewView({
                    model: model
                });
                $('#interviewer-table').append(model.view.render().el);
            }
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne);
        },
    });

    var newinterview = function(){
        var newinterviewers = new Array();
        var newinterviewees = new Array();
        var newinterviewproblems = new Array();
        var modal = Backbone.$('#new-interview');
        app.showInputModal(modal);
        var input = modal.find('.modal-input');
        var add_interviewer = modal.find("#interviewer-confirm");
        var add_interviewee = modal.find("#interviewee-confirm");
        var add_problem = modal.find("#interviewproblem-confirm");
        var cnfm = modal.find('.modal-confirm');
        modal.on('hide', function () {
            input.off('input');
            cnfm.off('click');
            modal.off('hide');
        });

        input.on('input', function(){
            var name = Backbone.$.trim(input.val()),
                err = false;
            if (!name) {
                err = 'inputproblemname';
            }
            if (err) {
                cnfm.attr('disabled', 'disabled');
            } else {
                modal.find('.help-inline').text('');
                modal.find('.form-group').removeClass('error');
                cnfm.removeAttr('disabled');
            }
        });

        add_interviewer.on('click', function(){
            var name = Backbone.$.trim(modal.find('#interviewer-inputName').val());
            if (app.Lock.attach({
                    error: function (data){
                        app.showMessageBar('#interview-message', data.err, 'error');
                    },
                    success: function (model){
                        for (var i = 0; i < newinterviewers.length; i++)
                            if (newinterviewers[i] == model.name){
                                app.showMessageBar('#interview-message', 'name exists', 'error');
                                return;
                            }
                        for (var i = 0; i < newinterviewees.length; i++)
                            if (newinterviewees[i] == model.name){
                                app.showMessageBar('#interview-message', 'isInterviewee', 'error');
                                return;
                            }
                        $('#interview-message').hide();
                        $('#interviewer-inputName').val('');
                        newinterviewers.push(model.name);
                        var m = new app.User({
                            name: model.name,
                            avatar: model.avatar
                        });
                        var view = new app.SharerView({
                            model: m
                        });
                        var text = view.render().el;
                        $("#interviewer-list").append(text);
                    }
                })) {
                app.socket.emit('check-user', {
                    name: name,
                })
            }
        });

        add_interviewee.on('click', function(){
            var name = Backbone.$.trim(modal.find('#interviewee-inputName').val());
            if (app.Lock.attach({
                    error: function (data){
                        app.showMessageBar('#interview-message', data.err, 'error');
                    },
                    success: function (model){
                        for (var i = 0; i < newinterviewees.length; i++)
                            if (newinterviewees[i] == model.name){
                                app.showMessageBar('#interview-message', 'name exists', 'error');
                                return;
                            }
                        for (var i = 0; i < newinterviewers.length; i++)
                            if (newinterviewers[i] == model.name){
                                app.showMessageBar('#interview-message', 'isInterviewer', 'error');
                                return;
                            }
                        $('#interview-message').hide();
                        $('#interviewee-inputName').val('');
                        newinterviewees.push(model.name);
                        var m = new app.User({
                            name: model.name,
                            avatar: model.avatar
                        });
                        var view = new app.SharerView({
                            model: m
                        });
                        var text = view.render().el;
                        $("#interviewee-list").append(text);
                    }
                })) {
                app.socket.emit('check-user', {
                    name: name,
                })
            }
        });

        $(".user-item").dblclick( function(){
            var name = $(this).innerText;
            for (var i = 0; i < newinterviewees.length; i++)
                if (newinterviewees[i] == name){
                    newinterviewees.splice(i,1);
                    break;
                }
            for (var i = 0; i < newinterviewers.length; i++)
                if (newinterviewers[i] == name){
                    newinterviewers.splice(i,1);
                    break;
                }
            $(this).remove();
        });

        cnfm.attr('disabled', 'disabled').on('click', function () {
            var name = Backbone.$.trim(modal.find('#newinterview-name').val());
            var newinterviewproblems = new Array();
            if (app.Lock.attach({
                    loading: '#newinterview-buttons',
                    error: function (data) {
                        app.showMessageBar('#interview-message', data.err, 'error');
                    },
                    success: function () {
                        modal.modal('hide');
                    }
                })) {
                app.socket.emit('add-interview', {
                    name: name,
                    interviewer: newinterviewers,
                    interviewee: newinterviewees,
                    problem: newinterviewproblems,
                });

            }
        });
    }

    app.init || (app.init = {});
    app.init.interviewerView = function () {
        if (app.views['interviewers']) {
            return;
        }
        app.collections['interviews'] || app.init.interviews();
        app.views['interviewers'] = new app.InterviewerView({
            collection: app.collections['interviews'],
        });
    };

    $("#btn_nic").bind('click', newinterview);

})()