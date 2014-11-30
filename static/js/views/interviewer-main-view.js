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
            //this.listenTo(this.options.intervieweeList, 'add', this.addOneInterviewee);
            //this.listenTo(this.options.intervieweeList, 'reset', this.addAllInterviewee);
            this.listenTo(this.options.problemList, 'add', this.addOneProblem);
            this.listenTo(this.options.problemList, 'reset', this.addAllProblem);
            //this.listenTo(this.options.allproblems, 'add', this.addOneProblem2);
            //this.listenTo(this.options.allproblems, 'reset', this.addAllProblem2);
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
            $('#setinterviewee-list').html('');

            app.socket.emit('read-problem', {
                all: true,
                name: this.itv.name,
                virtual: true,
                mode: 'problem-in-interview'
            });
            var itvname = $('#interviewer-item-name').text();
            app.socket.emit('read-problem', {
                all: true,
                name: itvname,
                virtual: true,
                mode: 'all-problem'
            });
            app.socket.emit('read-interviewee-in-interview',{
                name: itvname,
            });
        },

        add_interviewee: function(){
            $('#setinterviewee-list').html('');
            var modal = Backbone.$('#set-interviewee');
            app.showInputModal(modal);
            //fetch intervieweeList here...
            //show

            var that = this;
            var input = modal.find('#setinterviewee-inputName'),
                add_cnfm = modal.find('#setinterviewee-confirm'),
                cnfm = modal.find('#set-round-interviewee-btn'),
                newinterviewees = [],
                newinterviewers = [],
                al = $('#setinterviewee-list');
            var c = app.collections['intervieweeList-'+that.itv.name];

            var deleteUserInList = function(){
                $(".sharer-delete").click(function(){
                    var l = $(this).prev();
                    var p = $(this).parent().parent();
                    var Mname = l.text();
                    for (var i = 0; i < newinterviewees.length; i++)
                        if (newinterviewees[i] == Mname){
                            newinterviewees.splice(i,1);
                            break;
                        }
                    p.remove();
                });
            };

            for (var i = 0; i < c.length; i++){
                var model = c.models[i].attributes;
                newinterviewees.push(model.name);
                var m = new app.User({
                    name: model.name,
                    avatar: model.avatar
                });
                var view = new app.SharerView({
                    model: m
                });
                var text = view.render().el;
                al.append(text);
                deleteUserInList();
            }
            modal.on('hide', function () {
                input.off('input');
                add_cnfm.off('click');
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
                    add_cnfm.attr('disabled', 'disabled');
                } else {
                    modal.find('.help-inline').text('');
                    modal.find('.form-group').removeClass('error');
                    add_cnfm.removeAttr('disabled');
                }
            });

            add_cnfm.attr('disabled', 'disabled').on('click', function(){
                var name = Backbone.$.trim(modal.find('#setinterviewee-inputName').val());
                if (app.Lock.attach({
                        error: function (data){
                            app.showMessageBar('#setinterviewee-message', data.err, 'error');
                        },
                        success: function (model){
                            for (var i = 0; i < newinterviewees.length; i++)
                                if (newinterviewees[i] == model.name){
                                    app.showMessageBar('#setinterviewee-message', 'name exists', 'error');
                                    return;
                                }
                            for (var i = 0; i < newinterviewers.length; i++)
                                if (newinterviewers[i] == model.name){
                                    app.showMessageBar('#setinterviewee-message', 'isInterviewer', 'error');
                                    return;
                                }
                            $('#setinterviewee-message').hide();
                            $('#setinterviewee-inputName').val('');
                            newinterviewees.push(model.name);
                            var m = new app.User({
                                name: model.name,
                                avatar: model.avatar
                            });
                            var view = new app.SharerView({
                                model: m
                            });
                            var text = view.render().el;
                            al.append(text);
                            deleteUserInList();
                        }
                    })) {
                    app.socket.emit('check-user', {
                        name: name
                    })
                }
            });

            cnfm.on('click', function () {
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
                    app.socket.emit('update-interviewee-in-interview', {
                        name: that.itv.name,
                        interviewee: newinterviewees,
                    });

                }
            });
        },

        add_interviewer: function(){
            var modal = Backbone.$('#set-interviewer');
            app.showInputModal(modal);

        },

        add_problem: function(){
            var itvname = $('#interviewer-item-name').text();
            var modal = Backbone.$('#set-problem');
            app.showInputModal(modal);
            var ap = modal.find('#setproblem-add'),
                dp = modal.find('#setproblem-remove'),
                il = $('#interviewproblem-list'),
                al = $('#allproblem-list'),
                cnfm = $('#setinterviewproblem-cnfm');
            il.html('');
            al.html('');

            //获取所有题目，添加在左侧

            for (var i = 0; i < app.collections['allproblems-' + this.itv.name].length; i++){
                var l = $('<li></li>');
                l.html('<a href="#">'+ app.collections['allproblems-' + this.itv.name].models[i].id +'</a>');
                al.append(l);
            }
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
            var modal = Backbone.$('#set-round');
            var ap = modal.find('#setround-add'),
                dp = modal.find('#setround-remove'),
                il = $('#rounduser-list'),
                al = $('#alluser-list'),
                sl = $('#interviewer-interviewee-control'),
                cnfm = $('#setrounduser-cnfm'),
                that = this;

            //获取所有面试者，添加在左侧
            al.html('');
            il.html('');
            var c = app.collections['intervieweeList-'+that.itv.name];
            for (var i = 0; i < c.length; i++){
                var model = c.models[i].attributes;
                var m = new app.User({
                    name: model.name,
                    avatar: model.avatar
                });
                var view = new app.SharerView({
                    model: m
                });
                var text = view.render().el;
                al.append(text);
            }
            modal.find('.sharer-delete').hide();

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
                sl.html('');
                //il.children().each(function(){
                    for (var i = 0; i < c.length; i++){
                        var model = c.models[i].attributes;
                        //if (model.name == $(this).text().trim()){
                            var m = new app.User({
                                name: model.name,
                                avatar: model.avatar
                            });
                            var view = new app.IntervieweeInfoView({
                                model: m
                            });
                            var text = view.render().el;
                            sl.append(text);
                        //}
                    }
                //});
                modal.modal('hide');
                app.showMessageBox('setroundintervieweesuccess', 'roundinterviewstart');
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


        addAllInterviewee: function(){
            this.options.intervieweeList.each(this.add_interviewee);
        },

        addAllProblem: function(){
            this.options.problemList.each(this.addOneProblem);
        },

    });

})();
