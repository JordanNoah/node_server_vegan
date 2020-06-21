module.exports = (db,DataTypes) =>{
    const recipe_liked = db.define('recipe_liked',{
        idLiked: { type: DataTypes.INTEGER, primaryKey:true,allowNull:false,autoIncrement:true },
    });
    return recipe_liked;
}