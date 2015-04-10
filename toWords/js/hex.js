(function($){
  $('#close').on('click', function(){
    hex.close();
  });
  $('#minimize').on('click', function(){
    hex.minimize();
  });
  $('#title').on('mousemove', function(){
    hex.setAsTitleBarAreas(0, 0);
  });
  $('#title').on('mouseout', function(){
    hex.setAsTitleBarAreas(-1, -1);
  });
  $('#title').on('dblclick', function(){
    hex.setAsTitleBarAreas(-1, -1);
  });
  $('#title').on('mouseup', function(e){
    if (e.button != 2) return;
    hex.showSystemMenu(e.clientX, e.clientY);
  });

  // disable window maximum
  hex.deleteSystemCommand(hex.MAXIMIZE);

  // disable the default context menu
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, false);

})(jQuery);