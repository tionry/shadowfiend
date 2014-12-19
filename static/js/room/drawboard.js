var app = app || {};

/* 房间绘图板控制器 */
app.Room && _.extend(app.Room.prototype, {

    initBoard: function(){
        this.clearBoard();
        var path = this.docModel.attributes.path;
        app.socket.emit('get-image',{
            fileName: path,
        })
    },

    clearBoard: function(){
        var canvas = $('canvas')[0];
        canvas.width = canvas.width;
    },

    onSavingDraw: function(data){
        var path = this.docModel.attributes.path;
        app.socket.emit('save-image', {
            fileName: path,
            image: data,
            members: app.room.allMembers,
        });
    },

    afterRevision: function(data){
        this.view.renewDraw(data);
    }

});





