var app = app || {};

/* 房间批注控制器 */
app.Room && _.extend(app.Room.prototype, {

    //初始化批注
    initComment: function(){
        var view = app.room.view,
            editor = view.editor;
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < view.editor.lineCount(); i++){
            var text = 'initial value for Line' + (i+1);
            var LineHandle = editor.getLineHandle(i);
            LineHandle.comment = text;
            var msg = view.setLineWidget(i, text);
            view.editor.addLineWidget(i, msg[0], {coverGutter: false, noHScroll: true});
        }
    },

    //刷新批注
    reloadComment: function(){
        var view = app.room.view,
            editor = view.editor;
        view.inpopover = false;
        for (var i = 0; i < view.editor.lineCount(); i++){
            var LineHandle = editor.getLineHandle(i);
            if (!LineHandle.comment) {
                var text = 'initial value for Line' + (i+1);
                LineHandle.comment = text;
                var msg = view.setLineWidget(i, text);
                view.editor.addLineWidget(i, msg[0], {coverGutter: false, noHScroll: true});
            }
        }
    },

    //增加批注
    addComment: function(line, text){
        var view = app.room.view,
            editor = view.editor;
        var LineHandle = editor.getLineHandle(line);
        LineHandle.comment = text;
        view.renewLineComment(line);
        //app.socket.emit('add-line-comment', {
        //    line: line,
        //    comment: text,
        //});
    },

    afterRevision: function(line,text){
        var view = app.room.view,
            editor = view.editor;
        var LineHandle = editor.getLineHandle(line);
        LineHandle.comment = text;
        view.renewLineComment(line);
    }

});
