var app = app || {};

/* 房间批注控制器 */
app.Room && _.extend(app.Room.prototype, {

    //初始化批注
    initComment: function(){
        var view = app.room.view;
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < view.editor.lineCount(); i++){
            var msg = view.setLineWidget();
            view.editor.addLineWidget(i, msg[0], {coverGutter: false, noHScroll: true});
        }
    },

    //刷新批注
    reloadComment: function(){
        var view = app.room.view;
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < view.editor.lineCount(); i++){
            var msg = view.setLineWidget();
            view.editor.addLineWidget(i, msg[0], {coverGutter: false, noHScroll: true});
        }
    },

    //增加批注
    addComment: function(){
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
