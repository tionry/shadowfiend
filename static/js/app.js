var app = app || {};
var strings = strings || {};

/* global variables */
_.defaults(app, {
  socket: io.connect(app.Package.SOCKET_IO),
  currentUser: null,
  isLogined: false,
  isShare: false,
  views: {},
  collections: {},
  fileNameReg: /[\*\\\|:\"\'\/\<\>\?\@]/,
  fileExtReg: /(.*[\/\.])?\s*(\S+$)/,
  router: null,
  sharemodel: null,
  /* for Room */
  editor: {},
  noVoice: false,
  inRoom: false,
  resize: null, // function pointer
});

app.showMessageBar = function(id, stringid, type){
  var o = $(id);
  o.removeClass('alert-error alert-success alert-info');
  if(type && type != 'warning')
    o.addClass('alert-' + type);
  else
    o.addClass('alert-warning');
  (stringid == null) && (stringid = 'inner error');
  $(id + ' span').html(strings[stringid] || stringid);
  o.slideDown();
};

app.showInputModal = function(modal, val) {
  modal.find('.control-group').removeClass('error').find('input').val('');
  modal.find('.help-inline').text('');
  var i = modal.find('.modal-input').val(val || '');
  modal.modal('show').on('shown', function() {
    var ok = modal.find('.modal-confirm');
    i.focus().on('keydown', function(e) {
      var k = e.keyCode || e.which;
      if(k == 13) { ok && ok.click(); }
      else if(k == 27) { modal.modal('hide'); }
    });
  });
};

(function() {
  var modal = $('#messagedialog'), $title = modal.find('#messagedialogLabel'),
    $content = modal.find('#messagedialogContent');
  
  app.showMessageBox = function(title, content, timeout) {
    (title == null) && (title = 'error');
    (content == null) && (content = 'inner error');
    $title.html(strings[title] || title);
    $content.html(strings[content] || content);
    timeout || (timeout = 1000);
    modal.modal('show');
    window.setTimeout(function() { modal.modal('hide'); }, timeout);
  };
})();

app.showMessageInDialog = function (selector, stringid, index) {
  var modal = $(selector),
    eq = (index === undefined) ? '' : (':eq(' + index + ')');
  modal.find('.control-group' + eq).addClass('error');
  (stringid == null) && (stringid = 'inner error');
  modal.find('.help-inline' + eq).text(strings[stringid] || stringid);
}

app.resize = function() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
	var cbh = h-$('#member-list-doc').height()-158;
/*	var cbh = h-$('#member-list-doc').height()-138;
	var cbhexp = cbh > 100 ? 0 : 100 - cbh;
	if(cbh < 100)
		cbh = 100;
	$('#chat-show').css('height', cbh + 'px');
	$('#chatbox').css('height', (h-103+cbhexp) + 'px');
	w = $('#editormain').parent().width();
	$('#editormain').css('width', w);
	var underh = h > 636 ? 212 : h/3;
	if(!consoleopen)
		underh = 0;
	$('#under-editor').css('height', underh + 'px');
	$('#console').css('width', (w-w/3-2) + 'px');
	$('#varlist').css('width', (w/3-1) + 'px');
	$('#console').css('height', (underh-12) + 'px');
	$('#varlist').css('height', (underh-12) + 'px');
	$('#varlistreal').css('height', (underh-42) + 'px');
	$('#console-inner').css('height', (underh-81) + 'px');
	$('#console-input').css('width', (w-w/3-14) + 'px');
	if(!app.isFullScreen(app.editor))
		$('.CodeMirror').css('height', (h-underh-$('#over-editor').height()-90) + 'px');

	w = $('#chat-show').width();
	if(w != 0)
		$('#chat-input').css('width', (w-70) + 'px');
*/	
	$('#file-list .span10').css('min-height', (h-235) + 'px');
	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
  var bottomHeight = document.getElementById("footer").clientHeight;
  $("#login").css("margin-bottom", bottomHeight + 20);
  $("#register").css("margin-bottom", bottomHeight + 20);
  $("#filecontrol").css("margin-bottom", bottomHeight + 10);
 // $('#register').css('margin-top', ((h-$('#big-one').height()-$('#footer').height()-$('#register').height()) / 2 - 40) + 'px');
 // $('#popush-info').css('margin-top', ((h-$('#big-one').height()-$('#footer').height()-$('#popush-info').height()) / 2 - 40) + 'px');
	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');

/*	
  $('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');
	$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

	app.editor.refresh();
*/
};


$(document).ready(function() {
  app.Lock.attach({
    loading: '#login-control',
    tbegin: 2000,
    tend: -1,
    data: 'pageIsLoading',
    fail: function() {
      app.failed = true;
      app.showMessageBar('login-message', 'loadfailed');
    },
  });

  var funcs = app.init;
  for(var i in funcs) {
    if(funcs.hasOwnProperty(i) && typeof funcs[i] === 'function') {
      funcs[i].call(app);
    }
  }
  delete funcs;
  delete app.init; /* now it's no use to run it again*/

  $('body').show();
 
  // if(isOK) {
    // app.socket.emit('connect', { });
  // }
  
  // app.resize();
  // $(window).resize(function() {
    // /* app.resize is only a pointer */
    // (typeof app.resize === 'function') && app.resize();
  // });
  
  // app.Lock.detach();
});
