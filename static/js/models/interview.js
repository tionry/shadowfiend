/**
 * Created by qiaocy on 14-11-21.
 */
/* Problem Model */
/* Problem Model has 'name', 'description' attributes.
 * name: 题目名
 * description: 题目描述
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
            var o = {
                //ord: a.ord,
                name: a.name,
                interviewerlist: a.interviewer,
                intervieweelist: a.interviewee,
                problemlist: a.problemlist,
                status: a.status,
                time: new Date(a.createTime).toLocaleJSON(),
            }
            this.json = o;
            return this;
        },

    });

})();
