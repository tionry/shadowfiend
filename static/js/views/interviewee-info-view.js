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
            'click .interviewee-img-div' : 'enterIntervieweeRoom',
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

        enterIntervieweeRoom: function(){
            var intervieweeName = this.$el.find('p').text().trim();
            var interviewName = $('#interviewer-item-name').text().trim();
            var problemName = $('#interviewer-problem-list').find('.glyphicon-stop').parent().parent().find('ii').text().trim();
            if (problemName == "") {
                app.showMessageBox('info', 'stillNotPushProblem');
                return;
            }
            app.socket.emit('get-doc-in-interview', {
                interviewName: interviewName,
                intervieweeName: intervieweeName,
                problemName: problemName,
            });
            app.models || (app.models = {});
            app.models['doc-' + interviewName] || (app.models['doc-' + interviewName] = new app.File());
            app.models['doc-' + interviewName].on('change', function(){
                app.room.tryEnter(app.models['doc-' + interviewName], null, '#interviewer/'+interviewName, 'interviewer', app.models['pro-' + interviewName]);
            })
        },
    });
})();