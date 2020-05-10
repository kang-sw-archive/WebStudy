
/** 
 * @memberof String#
 * @returns {string}
 */
String.prototype.replaceAll =
  function(org, dst) { return this.split(org).join(dst); };

module.exports.nullOr = (obj, val) => (obj ? obj : val);
module.exports.replaceAll = (str, org, dst) => { return str.split(org).join(dst); }