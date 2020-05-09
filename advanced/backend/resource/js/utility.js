
/** 
 * @memberof String#
 * @returns {string}
 */
String.prototype.replaceAll =
  function(org, dst) { return this.split(org).join(dst); };

module.exports.nullOr = (obj, val) => (obj ? obj : val);