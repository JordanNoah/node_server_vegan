module.exports = (db,DataTypes) => {
    const recipe_image = db.define('recipe_image',{
        idImage: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        principal:{ type:DataTypes.INTEGER, allowNull:false},
        route:{ type:DataTypes.TEXT('long'), allowNull:false}
    });
    return recipe_image;
}