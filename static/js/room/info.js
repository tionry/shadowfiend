var app = app || {};

/* 提示信息管理 */
app.Room && _.extend(app.Room.prototype, {

    //停止某道题目作答
    stopOneProblem: function(){
        if (window.location.hash == '#edit'){
            var modal = $('#stopprobleminfo');
            app.showInputModal(modal);
        }
    },

    startOneProblem: function(){
        if (window.location.hash == '#edit'){
            var modal = $('#stopprobleminfo');
            modal.modal('hide');
        }
    },
});
