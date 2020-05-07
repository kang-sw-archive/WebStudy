console.log("loading utils module");
module.exports.toRawText = toRawText;

String.prototype.replaceAll = function(org, dest) { return this.split(org).join(dest); };

function toRawText(str) {
  try {
    str = str.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&apos;").replaceAll('"', "&quot;").replaceAll("\n", "<br>");
  }
  catch (err) {
    console.log("Burnt: " + str);
    return "invalid";
  }
  return new String(str);
}

module.exports.hideIpStr = function(str) {
  var ip = new String(str);
  ip     = ip.substring(0, ip.lastIndexOf('.'));
  ip     = ip.substring(0, ip.lastIndexOf('.'));
  ip     = ip + ".xxx.xxx";
  ip     = ip.substr(ip.lastIndexOf(':') + 1);
  return ip;
};