'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { DataTypes, Op } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


//ASSOCIATIONS

db.user_chat.hasOne(db.chat, {
  foreignKey: 'idChat',
  sourceKey: 'idChat',
  constraints: false
});
db.user_chat.hasOne(db.user, {
  foreignKey: 'idUser',
  sourceKey: 'idUser',
  constraints: false
});


db.recipe.hasMany(db.step_recipe, {
  foreignKey: 'idRecipe'
});

db.recipe.hasMany(db.recipe_ingredient, {
  foreignKey: 'idRecipe'
});

db.recipe.hasMany(db.image_recipe, {
  foreignKey: 'idRecipe'
});

db.user.hasMany(db.image_user, {
  foreignKey: 'idUser'
});

db.like.hasOne(db.user, {
  foreignKey: 'idUser',
  sourceKey: 'idUserLiked'
});

db.recipe_ingredient.hasOne(db.ingredient, {
  foreignKey: 'idIngredient',
  sourceKey: 'idIngredient',
  constraints: false
});



// db.ingredient.hasOne(db.recipe_ingredient,{
//   foreignKey:"idIngredient"
// });


db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.op = Op;
module.exports = db;