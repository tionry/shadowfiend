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
            var interviewers = a.interviewer;

            var checkUser = function(){
                for (var i = 0; i < interviewers.length; i++)
                    if (interviewers[i] == app.currentUser){
                        return true;
                    }
                return false;
            }
            var flag = checkUser();
            var o = {
                //ord: a.ord,
                name: a.name,
                interviewer: a.interviewer,
                interviewee: a.interviewee,
                problemlist: a.problemlist,
                status: a.status,
                time: new Date(a.createTime).toLocaleJSON(),
                isInterviewer: flag,
                },
            }
            this.json = o;
            return this;
        },

    });

})();
