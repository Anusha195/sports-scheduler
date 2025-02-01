'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development'; // Default to 'development'
const config = require(path.join(__dirname, '/../config/config.json'))[env]; // Load the correct config based on NODE_ENV
const db = {};

let sequelize;
if (config.use_env_variable) {
  // If a connection string (like DATABASE_URL) is defined in environment variables, use it
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Otherwise, use the database credentials from the config file
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Dynamically load all models in this directory, except for this file and test files
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' && // Include only .js files
      file.indexOf('.test.js') === -1 // Exclude test files (e.g., *.test.js)
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Add the model to the db object
  });

// If models have associations, set them up
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add the Sequelize instance and library to the db object for use elsewhere
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;