/**
 * 绘图板逻辑控制
 */
var app = app || {};

app.Room && _.extend(app.Room.prototype, {

    initBoard: function(){
        var path = this.docModel.attributes.path;
        app.socket.emit('get-image',{
            fileName: path
        });
    },

    //清空绘图板
    clearBoard: function(){
        var canvas = $('canvas')[0];
        canvas.width = canvas.width;
    },

    //准备保存绘图
    onSavingDraw: function(data){
        var path = this.docModel.attributes.path;
        app.socket.emit('save-image', {
            fileName: path,
            image: data,
            members: app.room.allMembers
        });
    },

    //绘图重渲染
    afterDrawRevision: function(data){
        this.view.renewDraw(data);
    }

});





