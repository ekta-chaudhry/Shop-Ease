const Sequelize = require('sequelize');
const sequelize = new Sequelize('node-complete', 'root', 'passworderror', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;