
(function() {
  var browser = navigator.appName;
  var ver = navigator.appVersion;
  var thestart = parseFloat(ver.indexOf("MSIE"))+1;
  var brow_ver = parseFloat(ver.substring(thestart+4,thestart+7));

  if ((browser=="Microsoft Internet Explorer") && (brow_ver < 9)){
    window.location="./requirements.html";
  }
})();
