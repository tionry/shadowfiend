var app = app || {};

/* 房间绘图板控制器 */
app.Room && _.extend(app.Room.prototype, {

    initBoard: function(){
        var path = this.docModel.attributes.path;
    },

    onSavingDraw: function(data){
        var path = this.docModel.attributes.path;
        app.socket.emit('save-image', {
            fileName: path,
            image: data,
        });
    },

    afterRevision: function(data){
        this.view.renewDraw(data);
    }

});





