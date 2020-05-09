
/** 
 * @memberof String#
 * @returns {string}
 */
String.prototype.replaceAll =
  function(org, dst) { return this.split(org).join(dst); };
