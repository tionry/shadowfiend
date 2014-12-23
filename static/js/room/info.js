var app = app || {};

/* 提示信息管理 */
app.Room && _.extend(app.Room.prototype, {

    //停止某道题目作答
    stopOneProblem: function(){
        if (window.location.hash == '#edit/'){
            var modal = $('#stopprobleminfo');
            app.showInputModal(modal, null, 'noclose');
            modal.find('.modal-confirm').attr('disabled', 'disabled');
        }
    },

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
                app.models || (app.models = {});
                app.models['doc-' + interviewName] || (app.models['doc-' + interviewName] = new app.File());
                app.models['doc-' + interviewName].on('change', function() {
                    app.room.tryEnter(app.models['doc-' + interviewName], null, '#interviewees', 'interviewee', app.models['pro-' + interviewName], interviewName);
                    modal.modal('hide');
                });
            });
        }
    },

    endRound: function(){
        if (window.location.hash == '#edit/'){
            var modal = $('#endroundinfo');
            app.showInputModal(modal, null, 'noclose');
            modal.find('.modal-confirm').on('click', function(){
                modal.modal('hide');
                window.location.href = '/#interviewees';
            })
        }
    },

    endInterview: function(){
        if (window.location.hash == '#edit/'){
            var modal = $('#endroundinfo');
            app.showInputModal(modal, null, 'noclose');
            modal.find('.modal-confirm').on('click', function(){
                modal.modal('hide');
                window.location.href = '/#interviewees';
            })
        }
    },
});
