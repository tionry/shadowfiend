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
            'click #start-interview-btn': 'start_interview',
            'click #end-interview-btn': 'end_interview'
        },

        initialize: function(){
            this.itv = this.model.attributes;
            ////this.listenTo(this.options.intervieweeList, 'add', this.addOneInterviewee);
            //this.listenTo(this.options.intervieweeList, 'reset', this.addAllInterviewee);
            this.listenTo(app.collections.problemList, 'add', this.addOneProblem);
            this.listenTo(app.collections.problemList, 'reset', this.addAllProblem);
            this.listenTo(app.collections.allproblems, 'add', this.addOneProblem2);
            this.listenTo(app.collections.allproblems, 'reset', this.addAllProblem2);
            //初始化界面显示

            this.renewList();

        },

        renewList: function(){
            $('.remark-btn').attr('disabled', 'disabled');
            $('#interviewer-item-name').text(this.itv.name);
            $('#interviewer-problem-list').html('');
            $('#allproblem-list').html('');
            $('#interviewproblem-list').html('');

            app.socket.emit('read-problem', {
                all: true,
                name: this.itv.name,
                virtual: true,
                mode: 'problem-in-interview'
            });
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
            var itvname = $('#interviewer-item-name').text();
            app.showInputModal(modal);
            var ap = modal.find('#setproblem-add'),
                dp = modal.find('#setproblem-remove'),
                il = $('#interviewproblem-list'),
                al = $('#allproblem-list'),
                cnfm = $('#setinterviewproblem-cnfm');
            il.html('');
            al.html('');
            //获取所有题目，添加在左侧
            app.socket.emit('read-problem', {
                all: true,
                name: '',
                virtual: true,
                mode: 'all-problem'
            });
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
                    var result = [];
                    il.children().each(function(){
                        result.push($(this).text().trim());
                    });
                    return result;
                };
                //
                if (app.Lock.attach({
                        error: function (data) {
                            //app.showMessageBar('#interview-message', 'isInterviewer', 'error');
                        },
                        success: function () {
                            $('#interviewer-problem-list').html('');
                            app.socket.emit('read-problem', {
                                all: true,
                                name: itvname,
                                virtual: true,
                                mode: 'problem-in-interview'
                            });
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
            $('#interviewer-item-name').text(this.itv.name+'(进行中)');
            $('#set-interview-menu').hide();
            $('#start-interview-btn').hide();
            $('.interviewee-img').on('click', function(){
                window.location.href = '#interviewee/interview!';
            });
            $('#set-round-btn').on('click', function(){
                var modal = Backbone.$('#set-interviewee');
                app.showInputModal(modal);
                modal.on('hide', function () {
                    cnfm.off('click');
                    modal.off('hide');
                });
                $('#set-round-interviewee-btn').on('click',function(){
                    modal.modal('hide');
                    $('.remark-btn').removeAttr('disabled').on('click', function(){
                        var modal = Backbone.$('#remark');
                        app.showInputModal(modal);
                    });
                })
            });
        },

        end_interview: function(){
            var modal = Backbone.$('#endinterview-cfm');
            app.showInputModal(modal);
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });
            $('endinterview-cnfm').on('click', function(){
                modal.modal('hide');
                $('#interviewer-item-name').text($('#interviewer-item-name').text()+'(已结束)');
            });
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

})();