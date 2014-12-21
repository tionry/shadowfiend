var app = app || {};

/* 房间批注控制器 */
app.Room && _.extend(app.Room.prototype, {

    //初始化批注
    initComment: function(){
        var view = app.room.view,
            editor = view.editor;
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < editor.lineCount(); i++){
            var text = '';
            this.setLineComment(i, text);
        }
    },

    //设置一行批注
    setLineComment: function(line, text){
        var view = app.room.view,
            editor = view.editor;
        view.inpopover = false;
        var LineHandle = editor.getLineHandle(line);
        LineHandle.comment = text;
        var msg = view.setLineWidget(line, text);
        view.editor.addLineWidget(line, msg[0], {coverGutter: false, noHScroll: true});
    },

    //刷新批注
    reloadComment: function(LineList){
        var view = app.room.view;
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < LineList.length; i++){
            var text = LineList[i];
            this.setLineComment(i, text);
        }
    },

    initComments: function(){
        var path = this.docModel.attributes.path;
        app.socket.emit('get-comment', {
            path : path,
        });
    },

    //增加批注
    addComment: function(line, text){
        var view = app.room.view,
            editor = view.editor;
        var LineHandle = editor.getLineHandle(line);
        LineHandle.comment = text;
        var sendList = [];
        for (var i = 0; i < editor.lineCount(); i++){
            sendList.push(editor.getLineHandle(i).comment);
        }
        var path = this.docModel.attributes.path;
        app.socket.emit('update-comment', {
            path : path,
            LineList : sendList,
        });
        app.room.reloadComment(sendList);
    },

    //代码被修改后更新批注
    commentChangeWithDoc: function(){
        var view = app.room.view,
            editor = view.editor;
        var sendList = [];
        for (var i = 0; i < editor.lineCount(); i++){
            var LineHandle = editor.getLineHandle(i);
            if (!LineHandle.widgets){
                var text = '';
                this.setLineComment(i, text);
            }
            sendList.push(editor.getLineHandle(i).comment);
        }
        var path = this.docModel.attributes.path;
        app.socket.emit('update-comment', {
            path : path,
            LineList : sendList,
        });
        app.room.reloadComment(sendList);
    },
});
