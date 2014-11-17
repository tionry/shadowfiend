/*problemset*/
var app = app || {};
(function(){
    'use strict' ;
    //app.NewProblemView = Backbone.View.extend({
    //    el:"#newproblem",
    //    events: {
    //        'click #btn_newproblemconfirm':'newproblem'
    //    },
    //
    //    //createproblem: function(){
    //    //    var name = $('#newproblem-name').val();
    //    //    var description = $('#newproblem-description').val();
    //    //    if (app.Lock.attach({
    //    //            loading: '#newproblem-buttons',
    //    //            error: function (data) {
    //    //                //app.showMessageInDialog('#changepassword', data.err, 0);
    //    //            },
    //    //            success: function () {
    //    //                $('#newproblem').modal('hide');
    //    //                //app.showMessageBox('changepassword', 'changepassworddone');
    //    //            },
    //    //        })) {
    //    //        app.socket.emit('add-problem', {
    //    //            name: name,
    //    //            description: description,
    //    //        });
    //    //    }
    //    //},
    //
    //    newproblem: function(){
    //        var modal = Backbone.$('#newproblem');
    //        app.showInputModal(modal);
    //        var input = modal.find('.modal-input');
    //        var cnfm = modal.find('.modal-confirm');
    //        modal.on('hide', function () {
    //            input.off('input');
    //            cnfm.off('click');
    //            modal.off('hide');
    //        });
    //        input.on('input', function(){
    //            var name = Backbone.$.trim(input.val()),
    //                err = false;
    //            if (!name) {
    //                err = 'inputproblemname';
    //            }
    //            if (err) {
    //                cnfm.attr('disabled', 'disabled');
    //            } else {
    //                modal.find('.help-inline').text('');
    //                modal.find('.form-group').removeClass('error');
    //                cnfm.removeAttr('disabled');
    //            }
    //        });
    //        cnfm.attr('disabled', 'disabled').on('click', function () {
    //            var name = Backbone.$.trim(modal.find('#newproblem-name').val());
    //            var description = Backbone.$.trim(modal.find('#newproblem-description').val());
    //            app.collections['problems'].create({
    //                name:name,
    //                description:description
    //            }, {
    //                loading: modal.find('.modal-buttons'),
    //                error: function (m, data) {
    //                    app.showMessageInDialog(modal, data.err);
    //                },
    //                success: function () {
    //                    modal.modal('hide');
    //                }
    //            });
    //        });
    //    }
    //});

    app.ProblemsetView = Backbone.View.extend({
        el:"#problemset-control",

        initialize: function(){
            //this.table = this.el.find('#problemset-table');
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
            //this.collection.fetch();
            //try here
        },

        addOne: function(model) {
            var v = model.view;
            var that = this;

            model.set({"eid": model.get("eid") || that.collection.length});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#problemset-table').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.ProblemView({
                    model: model
                });
                $('#problemset-table').append(model.view.render().el);
            }
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne);
        }
    })



    app.init || (app.init = {});
    app.init.problemsetView = function () {
        //if (app.views['newproblem']) {
        //    return;
        //}
        //var np = new app.NewProblemView();
        app.collections['problems'] || app.init.problems();
        app.views['problemset'] = new app.ProblemsetView({
            collection: app.collections['problems'],
        });
    };
})();