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
            'click #end-interview-btn': 'end_interview',
            'click #set-round-btn': 'set_round_interviewee',
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
            $('#set-round-btn').attr('disabled', 'disabled');
            $('#end-interview-btn').attr('disabled', 'disabled');
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
            //fetch intervieweeList here...
            //show

            var that = this;
            var input = modal.find('#setinterviewee-inputName');
            var cnfm = modal.find('#setinterviewee-confirm');
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
                    app.showMessageBar('#setinterviewee-message', err, 'error');
                    cnfm.attr('disabled', 'disabled');
                } else {
                    modal.find('.help-inline').text('');
                    modal.find('.form-group').removeClass('error');
                    cnfm.removeAttr('disabled');
                }
            });

            cnfm.attr('disabled', 'disabled').on('click', function () {
                var name = Backbone.$.trim(modal.find('#setinterviewee-inputName').val());
                if (app.Lock.attach({
                        loading: modal.find('.modal-buttons'),
                        error: function (data) {
                            app.showMessageBar('#setinterviewee-message', data.err, 'error');
                        },
                        success: function () {
                            modal.modal('hide');
                            app.showMessageBox('newinterviewee', 'addintervieweesuccess');
                        }
                    })) {
                    app.socket.emit('add-interviewee', {
                        name: name,
                        itvname: that.itv.name
                    });

                }
            });
        },

        add_interviewer: function(){
            var modal = Backbone.$('#set-interviewer');
            app.showInputModal(modal);

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
            setTimeout(app.socket.emit('read-problem', {
                all: true,
                name: '',
                virtual: true,
                mode: 'all-problem'
            }), 1000);
            //获取所有题目，添加在左侧
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

        set_round_interviewee: function(){
            //fetch all interviewee in the interview here.. and show.

            var modal = Backbone.$('#set-round');
            var ap = modal.find('#setround-add'),
                dp = modal.find('#setround-remove'),
                il = $('#rounduser-list'),
                al = $('#alluser-list'),
                cnfm = $('#setinterviewproblem-cnfm');
            app.showInputModal(modal);
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });
            al.find('li').on('click', function(){
                if ($(this).hasClass('active')){
                    $(this).removeClass('active');
                }else{
                    $(this).addClass('active');
                }
            });
            il.find('li').on('click', function(){
                if ($(this).hasClass('active')){
                    $(this).removeClass('active');
                }else{
                    $(this).addClass('active');
                }
            });
            ap.on('click', function () {
                var l = al.find('.active');
                il.append(l);
                l.removeClass('active');
            });
            dp.on('click', function () {
                var l = il.find('.active');
                al.append(l);
                l.removeClass('active');
            });
            cnfm.on('click',function(){
                var roundArr = function(){
                    var result = [];
                    il.children().each(function(){
                        result.push($(this).text().trim());
                    });
                    return result;
                };
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
                        problemlist: roundArr()
                    });
                }
                $('.remark-btn').removeAttr('disabled');
            })
        },

        start_interview: function(){
            // change the interview state here..
            $('#end-interview-btn').removeAttr('disabled');
            $('#interviewer-item-name').text(this.itv.name+'(进行中)');
            $('#set-interview-menu').fadeOut('fast');
            $('#start-interview-btn').fadeOut('fast');
            $('#set-round-btn').removeAttr('disabled');
        },

        end_interview: function(){
            var modal = Backbone.$('#endinterview-cfm');
            app.showInputModal(modal);
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });
            $('#endinterview-cnfm').on('click', function(){
                modal.modal('hide');
                $('#interviewer-item-name').text(this.itv.name+'(已结束)');
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
                if (v.$el.is(':hidden')) {
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
                if (v.$el.is(':hidden')) {
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
