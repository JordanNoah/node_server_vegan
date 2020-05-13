module.exports = (db,DataTypes) =>{
    const liked_recipe = db.define('liked_recipe',{
        idLiked: { type: DataTypes.INTEGER, primaryKey:true,allowNull:false,autoIncrement:true },
    });
    return liked_recipe;
}