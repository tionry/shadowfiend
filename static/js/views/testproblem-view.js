/**
 * 专门在面试中呈现的题目列表项
 */
var app = app || {};
(function(){
    'use strict'
    app.TestProblemView = Backbone.View.extend({
        tagName: 'li',
        template : _.template($('#interviewer-problem-template').html(), null, {
            variable: 'model'
        }),
        events: {
            'click a' : 'showProblem',
        },

        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        showProblem: function(){
            var problemName = this.model.attribute.name;
            app.socket.emit('get-problem', {
                problemName : problemName,
            });
            var modal = $('#checkproblem');
            app.showInputModal(modal);
            modal.on('hide', function () {
                modal.find('.modal-confirm').off('click');
                modal.off('hide');
            });
            app.models || (app.models = {});
            app.models['problem'] || (app.models['problem'] = new app.Problem());
            app.models['problem'].on('change', function(){
                $('#checkproblem-name').text(app.models['problem'].attributes.name);
                $('#checkproblem-description').text(app.models['problem'].attributes.description);
            });
            modal.find('.modal-confirm').text('ok');
            modal.find('.modal-confirm').on('click', function(){
                modal.modal('hide');
            })
        },

        render: function () {
            this.$el.html(this.template(this.model.json));
            return this;
        },

    });
})();