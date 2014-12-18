var app = app || {};

/* 房间绘图板控制器 */
app.Room && _.extend(app.Room.prototype, {

    onSavingDraw: function(data){
        var path = this.docModel.attributes.path;

    },

    afterRevision: function(data){
        this.view.renewDraw(data);
    }

});





