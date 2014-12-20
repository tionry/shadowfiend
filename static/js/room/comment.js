var app = app || {};

/* 房间批注控制器 */
app.Room && _.extend(app.Room.prototype, {

    //初始化批注
    initComment: function(){
        var view = app.room.view;
        view.lineCommments = [];
        view.clearAllLineWidget();
        view.inpopover = false;
        for (var i = 0; i < view.editor.lineCount(); i++){
            var text = 'initial value for Line' + i;
            view.lineCommments.push(text);
            var msg = view.setLineWidget(i, text);
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
    addComment: function(line, text){
        var view = app.room.view,
            editor = view.editor;
        view.lineCommments[line] = text;
        view.renewLineComment(line);
    },

    afterRevision: function(data){
        this.view.renewDraw(data);
    }

});
