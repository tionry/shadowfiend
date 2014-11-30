/**
 * 供面试官查看的单个面试者信息视图
 */
var app = app || {};
(function () {
    app.IntervieweeInfoView = Backbone.View.extend({
        tagName: 'div',
        className: 'interviewer-interviewee',
        template: _.template($('#interviewer-interviewee-template').html(), null, {
            variable: 'model'
        }),
        events: {
            'click a': 'select'
        },
        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        select: function () {

        },
    });
})();