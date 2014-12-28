/**
 * 提示信息逻辑控制
 */
var app = app || {};

app.Room && _.extend(app.Room.prototype, {

    //停止某道题目作答 信息提示
    stopOneProblem: function(){
        if (window.location.hash == '#edit/'){
            var modal = $('#stopprobleminfo');
            modal.modal({
                keyboard: false
            });
            app.showInputModal(modal, null, 'noclose');
            modal.find('.modal-confirm').attr('disabled', 'disabled');
        }
    },

    //开始某道题目作答 信息提示
    startOneProblem: function(){
        if (window.location.hash == '#edit/'){
            var modal = $('#stopprobleminfo');
            modal.find('.modal-confirm').removeAttr('disabled');
            modal.find('.modal-confirm').on('click', function(){
                var interviewName = app.room.interviewName
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
                app.room.view.closeeditor();
                app.models || (app.models = {});
                app.models['doc-' + interviewName] || (app.models['doc-' + interviewName] = new app.File());
                app.models['doc-' + interviewName].on('change', function() {
                    app.room.tryEnter(app.models['doc-' + interviewName], null, '#interviewees', 'interviewee', app.models['pro-' + interviewName], interviewName);
                    modal.modal('hide');
                });
            });
        }
    },

    //结束一轮面试 信息提示
    endRound: function(){
        $('#stopprobleminfo').hide();
        if (window.location.hash == '#edit/'){
            var modal = $('#endroundinfo');
            modal.modal({
                keyboard: false
            });
            app.showInputModal(modal, null);
            modal.find('.modal-confirm').on('click', function(){
                modal.modal('hide');
                window.location.href = '/#interviewees';
            })
        }
    },

    //结束一场面试 信息提示
    endInterview: function(){
        $('#stopprobleminfo').hide();
        if (window.location.hash == '#edit/'){
            var modal = $('#endroundinfo');
            modal.modal({
                keyboard: false
            });
            app.showInputModal(modal, null);
            modal.find('.modal-confirm').on('click', function(){
                modal.modal('hide');
                window.location.href = '/#interviewees';
            })
        }
    },
});
