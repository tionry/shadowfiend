/**
 * 面试官主页面
 */
var app = app || {};
(function(){
    'use strict';
    app.InterviewerView = Backbone.View.extend({
        el:"#interviewer-control",
        template_problemList:_.template($('#all-problem-template').html(), null, {
            variable: 'model'
        }),

        initialize: function(){
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
        },

        addOne: function(model) {
            var v = model.view;
            model.set({"eid": model.get("eid") || app.collections['interviewer-interviews'].length});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewers-control-table').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.interviewView({
                    model: model
                });
                $('#interviewers-control-table').append(model.view.render().el);
            }
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne);
        },

        afterGetList: function(problemList, interviewName, intervieweeName){
            var modal = $('#allproblem'),
                list = $('#all-problem-list');
            modal.on('hide', function () {
                modal.off('hide');
            });
            list.html('');
            for (var i = 0; i < problemList.length; i++){
                var o = {
                    name: problemList[i].name,
                };
                var li = $('<li></li>');
                li.html(this.template_problemList(o));
                list.append(li);
                li.on('click', function(){
                    app.socket.emit('get-doc-in-interview', {
                        interviewName: interviewName,
                        intervieweeName: intervieweeName,
                        problemName: $(this).text().trim(),
                    });
                    app.models || (app.models = {});
                    app.models['doc-' + interviewName] || (app.models['doc-' + interviewName] = new app.File());
                    app.models['doc-' + interviewName].once('change', function(){
                        modal.modal('hide');
                        app.room.tryEnter(app.models['doc-' + interviewName], null, '#interviewer/'+interviewName, 'interviewer', app.models['pro-' + interviewName], interviewName);
                        app.models['doc-' + interviewName] = new app.File();
                    })
                });
            }
            app.showInputModal(modal);
        },
    });

    var newinterviewers = [];
    var newinterviewees = [];
    var newinterviewproblems = [];



    var newinterview = function(){
        var modal = Backbone.$('#new-interview');
        $("#interviewer-list").html('');
        $("#interviewee-list").html('');
        app.showInputModal(modal);
        var input = modal.find('.modal-input');
        var add_interviewer = modal.find("#interviewer-confirm");
        var add_interviewee = modal.find("#interviewee-confirm");
        var add_problem = modal.find("#interviewproblem-confirm");
        var cnfm = modal.find('#newinterview-confirm');
        if (!($("#interviewer-list").text())) {
            var cur = app.currentUser;
            var m = new app.User({
                name: cur.name,
                avatar: cur.avatar
            });
            var view = new app.SharerView({
                model: m
            });
            var text = view.render().el;
            $("#interviewer-list").append(text);
            $('#interviewer-list').find('.sharer-delete').hide();
            newinterviewers.push(cur.name);
        }

        var deleteUserInList = function(){
            $(".sharer-delete").click(function(){
                var l = $(this).prev();
                var p = $(this).parent().parent();
                var Mname = l[0].innerText;
                for (var i = 0; i < newinterviewees.length; i++)
                    if (newinterviewees[i] == Mname){
                        newinterviewees.splice(i,1);
                        break;
                    }
                for (var i = 0; i < newinterviewers.length; i++)
                    if (newinterviewers[i] == Mname){
                        newinterviewers.splice(i,1);
                        break;
                    }
                p.remove();
            });
        };
        modal.on('hide', function () {
            newinterviewers = [];
            newinterviewees = [];
            newinterviewproblems = [];
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
                        deleteUserInList();
                    }
                })) {
                app.socket.emit('check-user', {
                    name: name
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
                        deleteUserInList();
                    }
                })) {
                app.socket.emit('check-user', {
                    name: name
                })
            }
        });


        cnfm.attr('disabled', 'disabled').on('click', function () {
            var name = Backbone.$.trim(modal.find('#newinterview-name').val());
            var newinterviewproblems = [];
            if (newinterviewees.length == 0) {
                app.showMessageBar('#interview-message', 'interviewee list is empty', 'error');
                return;
            }
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
                    problem: newinterviewproblems
                });

            }
        });
    };

    app.init || (app.init = {});
    app.init.interviewerView = function () {
        if (app.views['interviewers']) {
            return;
        }
        app.collections['interviewer-interviews'] || app.init.interviews();
        app.views['interviewers'] = new app.InterviewerView({
            collection: app.collections['interviewer-interviews']
        });
    };

    $("#btn_nic").bind('click', newinterview);

})()