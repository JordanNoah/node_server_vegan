module.exports = (db, DataTypes) => {
    const user = db.define('user', {
        idUser: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
        names: { type: DataTypes.STRING(1000), allowNull: false },
        surnames: { type: DataTypes.STRING(1000), allowNull: true },
        bornDate: { type: DataTypes.STRING(50), allowNull: false },
        email: { type: DataTypes.STRING(200), allowNull: false },
        nickName: { type: DataTypes.STRING(200), allowNull: false },
        password: { type: DataTypes.STRING(200), allowNull: false },
        f_active: { type: DataTypes.BOOLEAN, allowNull: false },
        country: { type: DataTypes.INTEGER(20), allowNull: true },
        city: { type: DataTypes.INTEGER(20), allowNull: true },
        location: { type: DataTypes.STRING(1000), allowNull: true },
        description: { type: DataTypes.STRING(1000), allowNull: true },
        interests: { type: DataTypes.STRING(500), allowNull: true },
        lifeStyle:{type:DataTypes.STRING(100),allowNull:false},
        lookingFor:{type:DataTypes.STRING(100),allowNull:false},
        interestedIn:{type:DataTypes.STRING(100),allowNull:false},
        gender:{type:DataTypes.STRING(100),allowNull:false},
        job:{type:DataTypes.STRING(100),allowNull:true}
    });
    
    return user;
};