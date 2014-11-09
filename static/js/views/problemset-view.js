/*problemset*/
var app = app || {};
(function(){
    'use strict' ;
    app.ProblemsetView = Backbone.View.extend({
        el:"#newproblem",
        events: {
            'click #btn_newproblemconfirm':'createproblem'
        },

        createproblem: function(){
            alert('don!');
            var name = $('#newproblem-name').val();
            var description = $('#newproblem-description').val();
            if (app.Lock.attach({
                    loading: '#newproblem-buttons',
                    error: function (data) {
                        //app.showMessageInDialog('#changepassword', data.err, 0);
                    },
                    success: function () {
                        $('#newproblem').modal('hide');
                        //app.showMessageBox('changepassword', 'changepassworddone');
                    },
                })) {
                alert('done2!');
                app.socket.emit('add-problem', {
                    name: name,
                    description: description,
                });
            }
        }
    });


    app.init || (app.init = {});
    app.init.problemsetView = function () {
        if (app.views['problemset']) {
            return;
        }
        app.views['problemset'] = new app.ProblemsetView();
    };
})();