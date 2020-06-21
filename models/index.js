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
// ************* social *************

db.chat.hasOne(db.user_chat, {
  foreignKey: 'idChat',
  // sourceKey: 'idChat',
  constraints: false
});

db.user.hasOne(db.user_chat, {
  foreignKey: 'idUser',
  // sourceKey: 'idUser',
  // constraints: false
});


db.user.hasMany(db.image_user, {
  foreignKey: 'idUser',
  // constraints: false
});

db.user.hasOne(db.like, {
  foreignKey: 'idUserLiked',
  // sourceKey: 'idUser',
  // constraints: false
});

// *************** RECIPES ****************

db.recipe.hasMany(db.recipe_step, {
  foreignKey: 'idRecipe'
});

db.categorie.hasMany(db.recipe,{
  foreignKey: 'idCategorie'
});

db.recipe.hasMany(db.recipe_ingredient, {
  foreignKey: 'idRecipe'
});

db.recipe.hasMany(db.recipe_image, {
  foreignKey: 'idRecipe'
});

db.recipe_ingredient.hasOne(db.ingredient,{
  foreignKey:'idIngredient',
  sourceKey:'idIngredient',
  constraints:false
});

db.user.hasMany(db.recipe_liked,{
  foreignKey:'idUser'
});

db.recipe.hasMany(db.recipe_liked,{
  foreignKey:'idRecipe'
});

db.recipe_liked.belongsTo(db.recipe,{
  foreignKey:"idRecipe"
});

db.recipe_comment.hasMany(db.user,{
  foreignKey: 'idUser',
  sourceKey: 'idUser',
  constraints:false
});

db.recipe.hasMany(db.recipe_comment,{
  foreignKey: 'idRecipe',
  // sourceKey: 'idRecipe',
  // constraints:false
});

db.recipe_comment.belongsTo(db.recipe,{
  foreignKey: 'idRecipe'
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.op = Op;
module.exports = db;