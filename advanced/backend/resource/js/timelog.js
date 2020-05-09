module.exports = (...args) => {
  console.log(
      [ new Date(Date.now()).toLocaleTimeString() ],
      ...args);
};
