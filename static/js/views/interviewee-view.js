/**
 * 面试者主页面
 */
var app = app || {};
(function(){
    app.IntervieweeView = Backbone.View.extend({
        el:"#interviewee-control",

        initialize: function(){
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
        },

        addOne: function(model) {
            var v = model.view;
            model.set({"eid": model.get("eid") || app.collections['interviewee-interviews'].length});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewees-control-table').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.interviewView({
                    model: model
                });
                $('#interviewees-control-table').append(model.view.render().el);
            }
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne);
        },

    });

    app.init || (app.init = {});
    app.init.intervieweeView = function () {
        if (app.views['interviewees']) {
            return;
        }
        app.collections['interviewee-interviews'] || app.init.interviews();
        app.views['interviewees'] = new app.IntervieweeView({
            collection: app.collections['interviewee-interviews'],
        });
    };
})()