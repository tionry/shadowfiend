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
            //var intervieweeList = model.interviewee;
            //var user = app.currentUser;
            //var flag;
            //for (var i = 0; i < intervieweeList.length; i++){
            //    if (intervieweeList[i] == user) {
            //        flag = 'true';
            //        break;
            //    }
            //}
            //if (flag != 'true') return;
            var v = model.view;
            model.set({"eid": model.get("eid") || app.collections['problems'].length});
            if (v) {
                v.render();
                if (v.el.is(':hidden')) {
                    $('#interviewer-table').append(v.el);
                    v.delegateEvents();
                }
            } else {
                model.view = new app.interviewView({
                    model: model
                });
                $('#interviewee-table').append(model.view.render().el);
            }
            return this;
        },

        addAll: function(){
            this.collection.each(this.addOne);
        },
    });

    app.init || (app.init = {});
    app.init.interviewerView = function () {
        if (app.views['interviewees']) {
            return;
        }
        app.collections['interviews'] || app.init.interviews();
        app.views['interviewees'] = new app.IntervieweeView({
            collection: app.collections['interviews'],
        });
    };
})()