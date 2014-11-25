/**
 * 面试官面试中主页面
 */
var app = app || {};
(function(){
    'use strict';
    app.InterviewerMainView = Backbone.View.extend({
        el: "#interviewer-item",

        events:{
            'click #set-interviewee': 'add_interviewee',
            'click #set-interviewer': 'add_interviewer',
            'click #set-problem': 'add_problem',
            'click #start-interview': 'start_interview'
        },

        initialize: function(){
            this.itv = this.model.attributes;
            this.listenTo(this.intervieweeList, 'add', this.addOneInterviewee);
            this.listenTo(this.intervieweeList, 'reset', this.addAllInterviewee);
            this.listenTo(this.problemList, 'add', this.addOneProblem);
            this.listenTo(this.problemList, 'reset', this.addAllProblem);

            //初始化界面显示
            $('#interviewer-item-name')[0].innerText = this.itv.name;
            this.renewList();

        },

        renewList: function(){

        },

        add_interviewee: function(){
            var modal = $('#set-interviewee');
            app.showInputModal(modal);
        },

        add_interviewer: function(){
            var modal = $('#set-interviewer');
            app.showInputModal(modal);
        },

        add_problem: function(){
            var modal = $('#set-problem');
            app.showInputModal(modal);
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

        addAllInterviewee: function(){
            this.intervieweeList.each(this.add_interviewee);
        },

        addAllProblem: function(){
            this.problemList.each(this.addOneProblem);
        },
    });

})()