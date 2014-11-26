/**
 * 面试官面试中主页面
 */
var app = app || {};
(function(){
    'use strict';
    app.InterviewerMainView = Backbone.View.extend({
        el: "#interviewer-item",

        events:{
            'click #set-interviewee-btn': 'add_interviewee',
            'click #set-interviewer-btn': 'add_interviewer',
            'click #set-problem-btn': 'add_problem',
            'click #start-interview': 'start_interview'
        },

        initialize: function(){
            this.itv = this.model.attributes;
            //this.listenTo(this.options.intervieweeList, 'add', this.addOneInterviewee);
            //this.listenTo(this.options.intervieweeList, 'reset', this.addAllInterviewee);
            this.listenTo(this.options.problemList, 'add', this.addOneProblem);
            this.listenTo(this.options.problemList, 'reset', this.addAllProblem);
            this.listenTo(this.options.allproblems, 'add', this.addOneProblem2);
            this.listenTo(this.options.allproblems, 'reset', this.addAllProblem2);
            //初始化界面显示

            this.renewList();

        },

        renewList: function(){
            $('#interviewer-item-name')[0].innerText = this.itv.name;
            $('#interviewer-problem-list').html('');
            $('#allproblem-list').html('');
            $('#interviewproblem-list').html('');

            if (app.Lock.attach({
                    error: function (data) {
                        //do nothing
                    },
                    success: function () {
                        //do nothing
                    }
                })) {
                app.socket.emit('read-problem', {
                    all: true,
                    name: this.itv.name,
                    virtual: true,
                    mode: 'problem-in-interview'
                });
            }
        },

        add_interviewee: function(){
            var modal = Backbone.$('#set-interviewee');
            app.showInputModal(modal);
        },

        add_interviewer: function(){
            var modal = Backbone.$('#set-interviewer');
            app.showInputModal(modal);
            var add_interviewer = modal.find("#setinterviewer-confirm");

            add_interviewer.on('click', function(){
                var name = Backbone.$.trim(modal.find('#setinterviewer-inputName').val());
            })

        },

        add_problem: function(){
            var modal = Backbone.$('#set-problem');
            var itvname = this.itv.name;
            app.showInputModal(modal);
            var ap = modal.find('#setproblem-add'),
                dp = modal.find('#setproblem-remove'),
                il = $('#interviewproblem-list'),
                al = $('#allproblem-list'),
                cnfm = $('#setinterviewproblem-cnfm');
            $('#interviewer-problem-list').html('');
            il.html('');
            al.html('');
            //获取所有题目，添加在左侧
            if (app.Lock.attach({
                    error: function (data) {
                        //do nothing
                    },
                    success: function () {
                        //do nothing
                    }
                })) {
                app.socket.emit('read-problem', {
                    all: true,
                    name: '',
                    virtual: true,
                    mode: 'all-problem'
                });
            }
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });

            ap.attr('disabled', 'disabled').on('click', function () {
                var l = al.find('.active');
                il.append(l);
                l.removeClass('active');
                ap.attr('disabled', 'disabled');
            });
            dp.attr('disabled', 'disabled').on('click', function () {
                var l = il.find('.active');
                al.append(l);
                l.removeClass('active');
                dp.attr('disabled', 'disabled');
            });
            cnfm.on('click', function(){
                var problemArr = function(){
                    var result = new Array();
                    il.children().each(function(){
                        result.push($(this).text().trim());
                    });
                    return result;
                }
                //
                if (app.Lock.attach({
                        error: function (data) {
                            //app.showMessageBar('#interview-message', 'isInterviewer', 'error');
                        },
                        success: function () {
                            modal.modal('hide');
                        }
                    })) {
                    app.socket.emit('update-problem-in-interview', {
                        name: itvname,
                        problemlist: problemArr()
                    });
                }
            })

        },

        start_interview: function(){

        },

        addOneInterviewee: function(model){
            if (!model) return;
            var v = model.view;
            model.set({"eid": 'CrazyOutput'});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewer-interviewee-control').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.IntervieweeInfoView({
                    model: model
                });
                $('#interviewer-interviewee-control').append(model.view.render().el);
            }
            return this;
        },

        addOneProblem: function(model){
            if (!model) return;
            var v = model.view;
            model.set({"eid": 'CrazyOutput'});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewer-problem-list').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.TestProblemView({
                    model: model
                });
                $('#interviewer-problem-list').append(model.view.render().el);
            }
            return this;
        },

        addOneProblem2: function(model){
            if (!model) return;
            var v = model.view;
            model.set({"eid": 'CrazyOutput'});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#allproblem-list').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.PickProblemView({
                    model: model
                });
                $('#allproblem-list').append(model.view.render().el);
            }
            return this;
        },

        addAllInterviewee: function(){
            this.options.intervieweeList.each(this.add_interviewee);
        },

        addAllProblem: function(){
            this.options.problemList.each(this.addOneProblem);
        },

        addAllProblem2: function(){
            this.options.allproblems.each(this.addOneProblem2);
        }
    });

})()