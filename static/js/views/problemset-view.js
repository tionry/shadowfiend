/*problemset*/
var app = app || {};
(function(){
    'use strict' ;

    app.ProblemsetView = Backbone.View.extend({
        el:"#problemset-control",
        events:{
            "click #toggle-all": "toggleAllComplete"
        },
        initialize: function(){
            //this.table = this.el.find('#problemset-table');
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
            //try here
            app.socket.emit('read-problem', {
                all: true,
                name: '',
                virtual: true,
            });
        },

        addOne: function(model) {
            var v = model.view;

            model.set({"eid": model.get("eid") || app.collections['problems'].length});
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
        },

        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            problems.each(function (problem) { problem.save({'done': done}); });
        },
    })

    var newproblem = function(){
        var modal = Backbone.$('#newproblem');
        app.showInputModal(modal);
        var input = modal.find('.modal-input');
        var cnfm = modal.find('.modal-confirm');
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
                cnfm.attr('disabled', 'disabled');
            } else {
                modal.find('.help-inline').text('');
                modal.find('.form-group').removeClass('error');
                cnfm.removeAttr('disabled');
            }
        });


        cnfm.attr('disabled', 'disabled').on('click', function () {
            var name = Backbone.$.trim(modal.find('#newproblem-name').val());
            var description = Backbone.$.trim(modal.find('#newproblem-description').val());
            //app.collections['problems'].create({
            //    name:name,
            //    description:description
            //}, {
            //    loading: modal.find('.modal-buttons'),
            //    error: function (m, data) {
            //        app.showMessageInDialog(modal, data.err);
            //    },
            //    success: function () {
            //        modal.modal('hide');
            //    }
            //});
            if (app.Lock.attach({
                    loading: '#newproblem-buttons',
                    error: function (data) {
                       // app.showMessageBar(id, data.err, 'error');
                    },
                    success: function () {
                        //app.showMessageBar(id, 'registerok');
                    },
                })) {
                app.socket.emit('add-problem', {
                    name: name,
                    description: description,
                });
            }
        });
    }

    app.init || (app.init = {});
    app.init.problemsetView = function () {
        if (app.views['problemset']) {
            return;
        }
        app.collections['problems'] || app.init.problems();
        app.views['problemset'] = new app.ProblemsetView({
            collection: app.collections['problems'],
        });
    };

    var npb = $("#new-pro-btn");
    npb.bind('click', newproblem);
})();