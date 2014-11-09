/*problemset*/
var app = app || {};
(function(){
    'use strict' ;
    app.ProblemsetView = Backbone.View.extend({
        el:"#problemset",
        events: {
            'click #btn_newprogramconfirm':'createproblem'
        },

        createproblem: function(){
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
                alert('done!');
                app.socket.emit('add-problem', {
                    name: name,
                    description: description,
                });
            }
        }
    });


    app.init || (app.init = {});
    app.init.ProblemsetView = function () {
        if (app.views['problemset']) {
            return;
        }
        app.views['problemset'] = new app.ProblemView();
    };
})();