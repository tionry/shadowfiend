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
            'click #end-round-btn': 'end_round',
            'click .remark-btn' : 'show_remark',
        },

        initialize: function(){
            this.listenTo(this.options.problemList, 'add', this.addOneProblem);
            this.listenTo(this.options.problemList, 'reset', this.addAllProblem);
            this.listenTo(this.options.roundList, 'add', this.addOneRoundInterviewee);
            this.listenTo(this.options.roundList, 'reset', this.addAllRoundInterviewee);
            this.listenTo(this.options.pushedProblem, 'add', this.renewProblem);
            this.listenTo(this.options.pushedProblem, 'reset', this.resetProblem);
            this.renewView();
        },

        //界面渲染
        renewView: function(){
            this.itv = this.model.attributes;
            $('#interviewer-interviewee-control').html('');
            $('#set-interview-menu').show();
            $('#start-interview-btn').show();
            $('#end-interview-btn').show();
            $('.remark-btn').attr('disabled', 'disabled');
            $('#set-round-btn').attr('disabled', 'disabled');
            $('#end-round-btn').attr('disabled', 'disabled');
            $('#end-interview-btn').attr('disabled', 'disabled');
            $('#interviewer-item-name').text(this.itv.name);
            $('#interviewer-item-status').text(this.itv.status);
            $('#interviewer-problem-list').html('');
            $('#allproblem-list').html('');
            $('#interviewproblem-list').html('');
            $('#setinterviewee-list').html('');
            var name = $('#interviewer-item-name').text().trim();
            this.viewees = [];
            this.viewers = [];
            app.socket.emit('read-problem', {
                all: true,
                name: name,
                virtual: true,
                mode: 'problem-in-interview'
            });
            app.socket.emit('read-problem', {
                all: true,
                name: name,
                virtual: true,
                mode: 'all-problem'
            });
            app.socket.emit('read-interviewee-in-interview',{
                name: name,
            });
            app.socket.emit('read-interviewer-in-interview',{
                name: name,
            });
            app.socket.emit('get-status-interviewees',{
                interviewName:name,
                status:'onRound',
            });

            switch (this.itv.status){
                case 'waiting':
                    $('#interviewer-item-status').removeClass();
                    $('#interviewer-item-status').addClass('red');
                    break;
                case 'ready':
                    $('#interviewer-item-status').removeClass();
                    $('#interviewer-item-status').addClass('yellow');
                    this.renew_ready_interview();
                    break;
                case 'running':
                    $('#interviewer-item-status').removeClass();
                    $('#interviewer-item-status').addClass('green');
                    this.renew_running_interview();
                    break;
                case 'completed':
                    $('#interviewer-item-status').removeClass();
                    $('#interviewer-item-status').addClass('blue');
                    this.renew_completed_interview();
                    break;
            }
        },

        renew_ready_interview: function(){
            $('#interviewer-interviewee-control').html('');
            $('.push-problem-btn').attr('disabled', 'disabled');
            $('#end-interview-btn').removeAttr('disabled');
            $('#set-interview-menu').hide();
            $('#start-interview-btn').hide();
            $('#set-round-btn').removeAttr('disabled');
            $('#end-round-btn').attr('disabled','disabled');
            $('#interviewer-item-status').text('ready');
            $('#interviewer-item-status').removeClass();
            $('#interviewer-item-status').addClass('yellow');
            $('.push-problem-btn').find('.glyphicon-stop').removeClass('glyphicon-stop').addClass('glyphicon-play');
        },

        renew_running_interview: function(){
            $('#set-interview-menu').hide();
            $('#start-interview-btn').hide();
            $('#end-interview-btn').removeAttr('disabled');
            $('.remark-btn').removeAttr('disabled');
            $('#set-round-btn').attr('disabled', 'disabled');
            $('#end-round-btn').removeAttr('disabled');
            $('#interviewer-item-status').text('running');
            $('#interviewer-item-status').removeClass();
            $('#interviewer-item-status').addClass('green');
            $('.push-problem-btn').removeAttr('disabled');
            var name = $('#interviewer-item-name').text().trim();
            app.socket.emit('get-status-problems-interview',{
                interviewName:name,
                status: 'pushing',
            });
        },

        renew_completed_interview: function(){
            $('#interviewer-interviewee-control').html('');
            $('#set-interview-menu').hide();
            $('#start-interview-btn').hide();
            $('.push-problem-btn').attr('disabled', 'disabled');
            $('#set-round-btn').attr('disabled', 'disabled');
            $('#end-round-btn').attr('disabled', 'disabled');
            $('#end-interview-btn').attr('disabled', 'disabled');
            $('#interviewer-item-status').text('completed');
            $('#interviewer-item-status').removeClass();
            $('#interviewer-item-status').addClass('blue');
        },

        addOneRoundInterviewee: function(model){
            if (!model) return;
            var v = model.view;
            if (v) {
                v.render();
                if (v.$el.is(':hidden')) {
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

        //当前轮次面试者列表更新 & 进入文件
        addAllRoundInterviewee: function(){
            $('#interviewer-interviewee-control').html('');
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

        //所有题目列表更新 & 打开推送事件监听
        addAllProblem: function(){
            this.options.problemList.each(this.addOneProblem);
            if (this.itv.status == 'running'){
                $('.push-problem-btn').removeAttr('disabled');
            }else
                $('.push-problem-btn').attr('disabled', 'disabled');
            this.pushstopProblem();
        },

        renewProblem : function(model){
            $('.push-problem-btn').removeAttr('disabled');
            var al = $('#interviewer-problem-list');
            al.find('li').each(function(){
                if (model.attributes.name == $(this).text().trim()){
                    $('.push-problem-btn').attr('disabled', 'disabled');
                    $(this).find('button').removeAttr('disabled');
                    $(this).find('button').children().removeClass('glyphicon-play');
                    $(this).find('button').children().addClass('glyphicon-stop');
                }
            })
        },

        //推送题目状态更新
        resetProblem : function(){
            this.options.pushedProblem.each(this.renewProblem);
        },

        //添加面试者
        add_interviewee: function(){
            $('#setinterviewee-list').html('');
            var modal = Backbone.$('#set-interviewee');
            app.showInputModal(modal);

            var input = modal.find('#setinterviewee-inputName'),
                add_cnfm = modal.find('#setinterviewee-confirm'),
                cnfm = modal.find('#set-round-interviewee-btn'),
                newinterviewees = [],
                newinterviewers = [],
                al = $('#setinterviewee-list'),
                interviewName = $('#interviewer-item-name').text().trim();
            var c = app.collections['intervieweeList-'+interviewName];
            var cc = app.collections['interviewerList-'+interviewName];
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
            for (var i = 0; i < cc.length; i++){
                var model = cc.models[i].attributes;
                newinterviewers.push(model.name);
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
                    err = 'inputnull';
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
                        name: interviewName,
                        interviewee: newinterviewees,
                    });
                }
            });
        },

        //添加面试官
        add_interviewer: function(){
            $('#setinterviewer-list').html('');
            var modal = Backbone.$('#set-interviewer');
            app.showInputModal(modal);

            var input = modal.find('#setinterviewer-inputName'),
                add_cnfm = modal.find('#setinterviewer-confirm'),
                cnfm = modal.find('#set-round-interviewer-btn'),
                newinterviewees = [],
                newinterviewers = [],
                al = $('#setinterviewer-list'),
                interviewName = $('#interviewer-item-name').text().trim();
            var c = app.collections['interviewerList-'+interviewName];
            var cc = app.collections['intervieweeList-'+interviewName];
            var deleteUserInList = function(){
                $(".sharer-delete").click(function(){
                    var l = $(this).prev();
                    var p = $(this).parent().parent();
                    var Mname = l.text();
                    for (var i = 0; i < newinterviewers.length; i++)
                        if (newinterviewers[i] == Mname){
                            newinterviewers.splice(i,1);
                            break;
                        }
                    p.remove();
                });
            };

            for (var i = 0; i < c.length; i++){
                var model = c.models[i].attributes;
                newinterviewers.push(model.name);
                var m = new app.User({
                    name: model.name,
                    avatar: model.avatar
                });
                var view = new app.SharerView({
                    model: m
                });
                var text = view.render().el;
                al.append(text);
                if (model.name == app.currentUser.name){
                    $(text).find('.sharer-delete').remove();
                }else{
                    deleteUserInList();
                }
            }
            for (var i = 0; i < cc.length; i++){
                var model = cc.models[i].attributes;
                newinterviewees.push(model.name);
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
                    err = 'inputnull';
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
                var name = Backbone.$.trim(modal.find('#setinterviewer-inputName').val());
                if (app.Lock.attach({
                        error: function (data){
                            app.showMessageBar('#setinterviewer-message', data.err, 'error');
                        },
                        success: function (model){

                            for (var i = 0; i < newinterviewers.length; i++)
                                if (newinterviewers[i] == model.name){
                                    app.showMessageBar('#setinterviewer-message', 'name exists', 'error');
                                    return;
                                }
                            for (var i = 0; i < newinterviewees.length; i++)
                                if (newinterviewees[i] == model.name){
                                    app.showMessageBar('#setinterviewer-message', 'isInterviewee', 'error');
                                    return;
                                }
                            $('#setinterviewer-message').hide();
                            $('#setinterviewer-inputName').val('');
                            newinterviewers.push(model.name);
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
                            app.showMessageBar('#setinterviewer-message', data.err, 'error');
                        },
                        success: function () {
                            modal.modal('hide');
                            app.showMessageBox('newinterviewer', 'addinterviewersuccess');
                        }
                    })) {
                    app.socket.emit('update-interviewer-in-interview', {
                        name: interviewName,
                        interviewer: newinterviewers,
                    });
                }
            });
        },

        //添加题目
        add_problem: function(){
            var interviewName = $('#interviewer-item-name').text().trim();
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

            for (var i = 0; i < app.collections['allproblems-' + interviewName].length; i++){
                var l = $('<li></li>');
                l.html('<a href="#">'+ app.collections['allproblems-' + interviewName].models[i].id +'</a>');
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
                if (app.Lock.attach({
                        error: function (data) {
                            //app.showMessageBar('#interview-message', 'isInterviewer', 'error');
                        },
                        success: function () {
                            $('#interviewer-problem-list').html('');
                            app.socket.emit('read-problem', {
                                all: true,
                                name: interviewName,
                                virtual: true,
                                mode: 'problem-in-interview'
                            });
                            modal.modal('hide');
                        }
                    })) {
                    app.socket.emit('update-problem-in-interview', {
                        name: interviewName,
                        problemlist: problemArr()
                    });
                }
            })
        },

        //设置每轮面试者
        set_round_interviewee: function(){
            var that = this;
            var modal = Backbone.$('#set-round');
            var ap = modal.find('#setround-add'),
                dp = modal.find('#setround-remove'),
                il = $('#rounduser-list'),
                al = $('#alluser-list'),
                sl = $('#interviewer-interviewee-control'),
                cnfm = $('#setrounduser-cnfm'),
                interviewName = $('#interviewer-item-name').text().trim();

            that.viewers = [];
            that.viewees = [];
            var d = app.collections['interviewerList-'+interviewName];
            for (var i = 0; i < d.length; i++){
                var model = d.models[i].attributes;
                that.viewers.push(model.name);
            }
            //获取所有面试者，添加在左侧
            al.html('');
            il.html('');
            var c = app.collections['intervieweeList-'+interviewName];
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
            modal.find('.sharer-delete').remove();

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
                il.children().each(function(){
                    for (var i = 0; i < c.length; i++){
                        var model = c.models[i].attributes;
                        if (model.name == $(this).text().trim()){
                            that.viewees.push(model.name);
                        }
                    }
                });
                modal.modal('hide');
                app.showMessageBox('setroundintervieweesuccess', 'roundinterviewstart');
                if (app.Lock.attach({
                        success: function(){
                            app.socket.emit('change-interviewee-status',{
                                interviewName: interviewName,
                                intervieweeList: that.viewees,
                                status: 'onRound'
                            });
                            that.renew_running_interview();
                        }
                    })) {
                    app.socket.emit('change-interview-status', {
                        name: interviewName,
                        status: 'running',
                    });
                }
            })
        },


        //推送/终止题目事件监听
        pushstopProblem: function(){
            $('.push-problem-btn').on('click', function(){
                var that = this;
                var interviewName = $('#interviewer-item-name').text();
                if ($(this).children().hasClass('glyphicon-play')){
                    var modal = $('#checkproblem');
                    app.showInputModal(modal);
                    modal.on('hide', function () {
                        modal.find('.modal-confirm').off('click');
                        modal.off('hide');
                    });
                    var problemName = $(this).parent().text().trim();
                    app.socket.emit('get-problem', {
                        problemName : problemName,
                    });
                    var btn = $(this);
                    app.models || (app.models = {});
                    app.models['problem'] || (app.models['problem'] = new app.Problem());
                    app.models['problem'].on('change', function(){
                        $('#checkproblem-name').text(app.models['problem'].attributes.name);
                        $('#checkproblem-description').text(app.models['problem'].attributes.description);
                    })
                    modal.find('.modal-confirm').on('click', function(){
                        that.viewers = [];
                        that.viewees = [];
                        var cc = app.collections['interviewerList-'+interviewName];
                        for (var i = 0; i < cc.length; i++){
                            var model = cc.models[i].attributes;
                            that.viewers.push(model.name);
                        }
                        var c = app.collections['round-intervieweeList-'+interviewName];
                        for (var i = 0; i < c.length; i++){
                            var model = c.models[i].attributes;
                            that.viewees.push(model.name);
                        }
                        app.socket.emit('round-start-problem', {
                            intervieweeList: that.viewees,
                        });
                        $('.push-problem-btn').attr('disabled', 'disabled');
                        btn.children().removeClass('glyphicon-play');
                        btn.children().addClass('glyphicon-stop');
                        btn.removeAttr('disabled');
                        if (app.Lock.attach({
                                error: function(){
                                    app.showMessageBox('info', 'inner error');
                                },
                                success:function() {
                                }
                            })) {
                            app.socket.emit('push-problem', {
                                interviewName: interviewName,
                                intervieweeList: that.viewees,
                                interviewerList: that.viewers,
                                problemName: problemName,
                            });
                        }
                        modal.modal('hide');
                    })
                } else
                if ($(this).children().hasClass('glyphicon-stop')){
                    var problemName = $(this).parent().text().trim();
                    if (app.Lock.attach({
                            error: function () {
                                app.showMessageBox('info', 'inner error');
                            },
                            success: function () {
                            }
                        })) {
                        app.socket.emit('change-problem-status-interview', {
                            interviewName: interviewName,
                            problemName: problemName,
                            status: 'waiting',
                        });
                    }
                    $('.glyphicon-stop').removeClass('glyphicon-stop').addClass('glyphicon-play');
                    $('.push-problem-btn').removeAttr('disabled');
                    var roundcol = app.collections['round-intervieweeList-' + interviewName];
                    var sendList = [];
                    for (var i = 0 ; i < roundcol.length; i++){
                        sendList.push(roundcol.models[i].attributes.name);
                    }
                    app.socket.emit('round-stop-problem', {
                        intervieweeList : sendList,
                    });
                }
            });
        },

        //结束本轮
        end_round: function(){
            app.showMessageBox('info', 'roundend');
            var interviewName = $('#interviewer-item-name').text().trim();
            var that = this;
            that.viewees = [];
            $('.interviewer-interviewee').find('p').each(function(){
                that.viewees.push($(this).text().trim());
            });
            if (that.viewees.length > 0){
                app.socket.emit('send-end-round-info', {
                    intervieweeList: that.viewees,
                })
            }
            if (app.Lock.attach({
                    error: function(){
                        app.showMessageBox('info', 'inner error')
                    },
                    success: function(){
                        that.renew_ready_interview();
                    },
                })) {
                app.socket.emit('change-interview-status', {
                    name: interviewName,
                    status: 'ready',
                });
            }
            $('#interviewer-interviewee-control').html('');
        },

        //开始整场面试
        start_interview: function(){
            var modal = Backbone.$('#startinterview-cfm'),
                cnfm = $('#startinterview-cnfm'),
                that = this;
            app.showInputModal(modal);
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });
            cnfm.on('click', function(){
                modal.modal('hide');
                var name = $('#interviewer-item-name').text();
                if (app.Lock.attach({
                    })) {
                    app.socket.emit('change-interview-status', {
                        name: name,
                        status: 'ready',
                    });
                }
                that.renew_ready_interview();
                app.showMessageBox('info', 'interviewstart');
            })
        },

        //结束整场面试
        end_interview: function(){
            var modal = Backbone.$('#endinterview-cfm'),
                cnfm =  $('#endinterview-cnfm'),
                that = this;
            app.showInputModal(modal);
            modal.on('hide', function () {
                cnfm.off('click');
                modal.off('hide');
            });
            var name = $('#interviewer-item-name').text();
            cnfm.on('click', function(){
                modal.modal('hide');
                if (app.Lock.attach({
                    })) {
                    app.socket.emit('change-interview-status', {
                        name: name,
                        status: 'completed',
                    });
                }
                that.viewees = [];
                $('.interviewer-interviewee').find('p').each(function(){
                    that.viewees.push($(this).text().trim());
                });
                if (that.viewees.length > 0){
                    app.socket.emit('send-end-interview-info', {
                        intervieweeList: that.viewees,
                    })
                }
                that.renew_completed_interview();
            });
        },

        //评论
        show_remark: function(){
            var modal = Backbone.$('#remark');
            app.showInputModal(modal);
        },

    });
})();
