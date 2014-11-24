/* Interview Model */
/* Interview Model has 'name', 'interviewer','interviewee','problemlist' attributes.
 * name: 面试名
 * interviewer: 面试官
 * interviewee：参与面试者
 * problemlist：题目列表
 */
var app = app || {};

(function () {
    'use strict';


    app.Interview = Backbone.Model.extend({
        idAttribute: 'name',
        //default attributes for problem item
        defaults: function(){
            return {
                name:'',
                interviewer:[],
                interviewee:[],
                problemlist:[],
                status:"waiting",
            }
        },

        initialize: function() {
            this.on('change', app.Interview.prototype.setShow);
        },

        setShow: function() {
            var a = this.attributes;
            var check = function(){
                for (var i = 0 ; i < a.interviewer.length; i++)
                    if (a.interviewer[i] == app.currentUser.name)
                        return true;
                return false;
            }
            var o = {
                //ord: a.ord,
                name: a.name,
                interviewer: a.interviewer,
                interviewee: a.interviewee,
                problemlist: a.problemlist,
                status: a.status,
                time: new Date(a.createTime).toLocaleJSON(),
                isInterviewer: check(),
            }
            this.json = o;
            return this;
        },

    });

})();
