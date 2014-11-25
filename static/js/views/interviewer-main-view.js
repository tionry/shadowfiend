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
            this.listenTo(this.options.intervieweeList, 'add', this.addOneInterviewee);
            this.listenTo(this.options.intervieweeList, 'reset', this.addAllInterviewee);
            this.listenTo(this.options.problemList, 'add', this.addOneProblem);
            this.listenTo(this.options.problemList, 'reset', this.addAllProblem);
            this.listenTo(this.options.allproblems, 'add', this.addOneProblem2);
            this.listenTo(this.options.allproblems, 'reset', this.addAllProblem2);
            //初始化界面显示
            $('#interviewer-item-name')[0].innerText = this.itv.name;
            this.renewList();

        },

        renewList: function(){

        },

        add_interviewee: function(){
            var modal = Backbone.$('#set-interviewee');
            app.showInputModal(modal);
        },

        add_interviewer: function(){
            var modal = Backbone.$('#set-interviewer');
            app.showInputModal(modal);
        },

        add_problem: function(){
            var modal = Backbone.$('#set-problem');
            app.showInputModal(modal);
            //获取所有题目，添加在左侧
            if (app.Lock.attach({
                    error: function (data) {
                    },
                    success: function () {

                    }
                })) {
                app.socket.emit('read-problem', {
                    all: true,
                    name: '',
                    virtual: true
                });

            }
        },

        start_interview: function(){

        },

        addOneInterviewee: function(model){
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
            var v = model.view;
            model.set({"eid": 'CrazyOutput'});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewer-problem-control').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.TestProblemView({
                    model: model
                });
                $('#interviewer-problem-control').append(model.view.render().el);
            }
            return this;
        },

        addOneProblem2: function(model){
            var v = model.view;
            model.set({"eid": 'CrazyOutput'});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#allproblem-list').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.TestProblemView({
                    model: model
                });
                $('#allproblem-list').append(model.view.render().el);
            }
            return this;
        },

        addAllInterviewee: function(){
            this.intervieweeList.each(this.add_interviewee);
        },

        addAllProblem: function(){
            this.problemList.each(this.addOneProblem);
        },

        addAllProblem2: function(){
            app.collections.problems.each(this.addOneProblem2);
        },
    });

})()