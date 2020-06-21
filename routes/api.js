const express = require("express");
const config = require('../config/app_config.js');
const app = express();
const router = express.Router();
const db = require('../models');
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const util = require("util");
const multer = require("multer");
const { Sequelize, Op } = require('sequelize');
const jwtAuth = require('../auth/verifyJwtToken');
const path = require('path');
const axios = require('axios');
const sequelize = require("sequelize");
const { raw } = require("body-parser");

// const mkdirSync = util.promisify(fs.mkdirSync);


app.model = (model) => db[model];


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var directory;

        if (req.body.type == "user") {
            directory = "./api/resource/images/users/" + req.body.idOfType;
        }
        if (req.body.type == "ingredient") {
            directory = "./api/resource/images/ingredient/";
        }
        if (req.body.type == "recipe") {
            directory = "./api/resource/images/recipe/" + req.body.title.replace(/\s/g, '');
        }
        if (req.body.type == "categories") {
            directory = "./api/resource/images/categories/"
        }
        if (fs.existsSync(directory)) {
            console.log("Directory exists.");
        } else {
            fs.mkdirSync(directory, { recursive: true });
        }
        cb(null, directory);
    },
    filename: function (req, file, cb) {
        var extension = file.originalname.split(".");
        cb(null, CryptoJS.SHA1(extension[0]) + "-" + Math.round((new Date()).getTime() / 1000) + '.' + extension[1]);
    }
});

const fileFilter = async (req, file, cb) => {
    const body = req.body;
    typeSelct = body.type;
    console.log("typeSelct");

    try {
        finder = await app.model(typeSelct).findByPk(body.idOfType);
        console.log(file.mimetype);
        if (finder) {
            if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {
                cb(null, true);
            } else {
                req.fileValidationError = 'Suba solo imagenes/gifs';
                return cb('Suba solo imagenes/gifs');
            }
        } else {
            return cb(typeSelct + ' don´t exist');
        }
    } catch (error) {
        return cb(error.message);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('imageSend');

router.post("/signup", async (req, res) => {
    const response = new Object();
    var body = req.body;

    const [user, created] = await db.user.findOrCreate({
        where: { email: body.email },
        defaults: {
            names: body.names,
            surnames: body.surnames,
            bornDate: body.bornDate,
            gender: body.gender,
            interestedIn: body.interestedIn,
            email: body.email,
            lookingFor: body.lookingFor,
            lifeStyle: body.lifeStyle,
            password: CryptoJS.SHA1(body.password).toString(),
            f_active: 1,
            nickName: body.email.split("@")[0]
        }
    });

    if (created) {
        response.status = 'success';
        response.message = "user created";
        response.api_token = jwt.sign({ idUser: user.idUser }, config.secret, { expiresIn: 86400 });
    } else {
        response.status = "fail";
        response.message = "existing user";
    }
    res.send(response);
});

router.post("/login", (req, res) => {
    const response = new Object();
    var passwordEncripted = CryptoJS.SHA1(req.body.password).toString();
    console.log(passwordEncripted);
    response.status = 'fail';

    db.user.findOne({
        where: {
            email: req.body.email,
        }
    }).then((user) => {
        if (user != null) {
            if (user.password == passwordEncripted) {
                response.status = 'success';
                response.api_token = jwt.sign({ idUser: user.idUser }, config.secret, { expiresIn: 86400 });

                // response.user = user;
            } else {
                response.status = 'fail';
                response.error = 'contraseña incorrecta';
            }
        } else {
            response.status = 'fail';
            response.error = 'usuario inexistente';
        }
        res.send(response);
    });
});

router.post("/loginWithFacebook", async (req, res) => {
    const response = new Object();
    // https://graph.facebook.com/v2.12/me?fields=name,picture,email&access_token=${token}
    var fbToken = req.headers['fb-token'];
    response.status = 'fail';
    try {
        const responseFb = await axios.get('https://graph.facebook.com/v2.12/me?fields=name,picture,email&access_token=' + fbToken);
        if (responseFb.status == 200) {
            db.user.findOne({
                where: {
                    email: responseFb.data.email,
                }
            }).then((user) => {
                if (user != null) {
                    response.status = 'success';
                    response.api_token = jwt.sign({ idUser: user.idUser }, config.secret, { expiresIn: 86400 });
                } else {
                    response.status = 'fail';
                    response.error = 'usuario inexistente';
                }
                res.send(response);
            });
        }
    } catch (error) {
        console.log(error);
        response.status = 'fail';
        response.error = 'Error fb';
        res.send(response);

    }

});
router.post("/loginWithGoogle", async (req, res) => {
    const response = new Object();
    // https://graph.facebook.com/v2.12/me?fields=name,picture,email&access_token=${token}
    var googleToken = req.headers['google-token'];
    response.status = 'fail';
    try {
        const responseGoogle = await axios.get('https://oauth2.googleapis.com/tokeninfo?access_token=' + googleToken);
        if (responseGoogle.status == 200) {
            db.user.findOne({
                where: {
                    email: responseGoogle.data.email,
                }
            }).then((user) => {
                if (user != null) {
                    response.status = 'success';
                    response.api_token = jwt.sign({ idUser: user.idUser }, config.secret, { expiresIn: 86400 });
                } else {
                    response.status = 'fail';
                    response.error = 'usuario inexistente';
                }
                res.send(response);
            });
        }
    } catch (error) {
        console.log(error);
        response.status = 'fail';
        response.error = 'Error google';
        res.send(response);

    }

});


router.post('/checkUser', (req, res) => {
    const response = new Object();
    db.user.findOne({ where: { email: req.body.email } })
        .then((user) => {
            if (user != null) {
                response.status = "success";
                response.user = user;
                res.send(response);
            } else {
                response.status = "fail";
                // response.user = user;
                res.send(response);
            }
        });
});


// <-------------------------------------- Users routes ----------------------------->

router.get('/users', async (req, res) => {
    const response = new Object();
    var users = await db.user.findAll({ include: [{ model: db.image_user, attributes: ['idImage', 'principal', 'idUser'] }] });
    if (users != null) {
        response.status = "success";
        response.users = users;
        res.send(response);
    } else {
        response.status = "fail";
        // response.user = user;
        res.send(response);
    }
});

router.get('/users/:idUser', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();

    if (req.params.idUser != undefined && req.params.idUser != '' && req.params.idUser > 0) {
        var user = await db.user.findOne({ where: { idUser: req.params.idUser }, include: [{ model: db.image_user, attributes: ['idImage', 'principal', 'idUser'] }] });
        if (user != null) {
            response.status = "success";
            response.user = user;
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("No user associated to this id");
            response.errors = errors;

        }
    } else {
        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Incorrect idUser");
        response.errors = errors;
    }
    res.send(response);

});

router.put('/users', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    const body = req.body;

    if (req.idUser != undefined && req.idUser != '' && req.idUser > 0) {
        var user = await db.user.findByPk(req.idUser);
        if (user != null) {
            response.status = "success";
            if (body.names != undefined) {
                user.names = body.names;
            }
            if (body.surnames != undefined) {
                user.surnames = body.surnames;
            }
            if (body.bornDate != undefined) {
                user.bornDate = body.bornDate;
            }
            if (body.country != undefined) {
                user.country = body.country;
            }
            if (body.city != undefined) {
                user.city = body.city;
            }
            if (body.location != undefined) {
                user.location = body.location;
            }
            if (body.description != undefined) {
                user.description = body.description;
            }
            if (body.interests != undefined) {
                user.interests = body.interests;
            }
            if (body.lifeStyle != undefined) {
                user.lifeStyle = body.lifeStyle;
            }
            if (body.lookingFor != undefined) {
                user.lookingFor = body.lookingFor;
            }
            if (body.interestedIn != undefined) {
                user.interestedIn = body.interestedIn;
            }
            if (body.gender != undefined) {
                user.gender = body.gender;
            }
            if (body.job != undefined) {
                user.job = body.job;
            }
            user.save();
            response.user = user;
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("No user associated to this id");
            response.errors = errors;

        }
    } else {
        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Incorrect idUser");
        response.errors = errors;
    }
    res.send(response);

});
// <-------------------------------------- END Users routes ----------------------------->

router.get('/chats', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario
    var base_chats = await db.user_chat.findAll({ include: [db.chat], attributes: ['idChat'], where: { idUser: req.idUser }, });
    if (base_chats != null) {
        var chats = [];
        // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
        // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
        for (const chat of base_chats) {
            var new_chat = Object();
            new_chat.id = chat.idChat;
            new_chat.name = chat.chat.nameChat;
            new_chat.users = [];
            var usersByChat = await db.user_chat.findAll({
                include: [{
                    model: db.user,
                    include: [{
                        model: db.image_user,
                        attributes: ['idImage', 'principal']
                    }]
                }],
                attributes: ['idUser'],
                where: { idChat: chat.idChat }
            });
            for (const user of usersByChat) {
                var user_in_chat = Object();
                user_in_chat.idUser = user.idUser;
                user_in_chat.names = user.user.names;
                user_in_chat.surnames = user.user.surnames;
                user_in_chat.email = user.user.email;
                user_in_chat.images = user.user.image_users;

                new_chat.users.push(user_in_chat);
            }

            // console.log(new_chat);
            chats.push(new_chat);
        }

        // console.log(chats);
        response.status = "success";
        response.chats = chats;
    } else {
        response.status = "fail";
    }
    res.send(response);
    // res.send(base_chats);
});

router.get('/chats/:idChat', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario
    var chat = await db.user_chat.findOne({ include: [db.chat], attributes: ['idChat'], where: { idChat: req.params.idChat }, });
    if (chat != null) {
        var new_chat = Object();
        new_chat.id = chat.idChat;
        new_chat.name = chat.chat.nameChat;
        new_chat.users = [];
        var usersByChat = await db.user_chat.findAll({
            include: [{
                model: db.user,
                include: [{
                    model: db.image_user,
                    attributes: ['idImage', 'principal']
                }]
            }],
            attributes: ['idUser'],
            where: { idChat: chat.idChat }
        });
        for (const user of usersByChat) {
            var user_in_chat = Object();
            user_in_chat.idUser = user.idUser;
            user_in_chat.names = user.user.names;
            user_in_chat.surnames = user.user.surnames;
            user_in_chat.email = user.user.email;
            user_in_chat.images = user.user.image_users;

            new_chat.users.push(user_in_chat);
        }

        // console.log(new_chat);
        // console.log(chats);
        response.status = "success";
        response.chat = new_chat;
    } else {
        response.status = "fail";
    }
    res.send(response);
    // res.send(base_chats);
});

router.get('/messages', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario

    var whereCondition = {}

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idChat != undefined && req.query.idChat != '' && req.query.idChat > 0) {
        whereCondition.idChat = req.query.idChat;
    }
    else {
        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Incorrect idChat");
        response.errors = errors;
    }

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idMessage != undefined && req.query.idMessage != '') {
        if (req.query.idMessage > 0) {
            try {
                whereCondition.idMessage = {
                    [db.op.lt]: parseInt(req.query.idMessage)
                };
            } catch (error) {
                console.log(error);

            }
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("Incorrect idMessage");
            response.errors = errors;
        }
    }

    if (response.errors == undefined) {

        var user_chat = await db.user_chat.findAll({ where: { idChat: req.query.idChat, idUser: req.idUser } });
        if (user_chat != null) {
            var last10Messages = await db.message.findAll({
                where: whereCondition,
                order: [['idMessage', 'DESC']],
                limit: req.query.limit != undefined ? parseInt(req.query.limit) : 10
            });
            if (last10Messages != null) {
                var messages = [];
                // // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
                // // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
                for (const message of last10Messages) {
                    var new_message = Object();
                    new_message.idMessage = message.idMessage;
                    new_message.idChat = message.idChat;
                    new_message.idSender = message.idSender;
                    new_message.message = message.message;
                    new_message.createdAt = message.createdAt;
                    messages.push(new_message);
                }

                response.status = "success";
                response.messages = messages;
            }
        }
    }

    res.send(response);
});

router.post("/checkMail", (req, res) => {
    const response = new Object();
    var body = req.body;
    console.log(body.email);

    db.user.findAll({
        where: { email: body.email }
    }).then((err) => {
        if (err.length != 0) {
            response.status = "fail";
            response.description = "Usuario existente";
            res.send(response);
        }
        if (err.length == 0) {
            response.status = "success";
            response.description = "Usuario inexistente";
            res.send(response);
        }
    });
});



router.post('/uploadImage', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    await upload(req, res, async (err) => {
        if (err) {
            console.log("Error: " + JSON.stringify(err));

            response.status = 'fail';
            response.message = err;
            res.status(500).send(response)
        } else {
            try {
                var obj = {
                    type: req.body.type,
                    principal: req.body.principal,
                    route: req.file.path
                    // route: req.body.idOfType + "/" + req.file.filename
                };
                switch (req.body.type) {
                    case 'user':
                        obj.idUser = req.body.idOfType;
                        break;
                    case 'recipe':
                        obj.idRecipe = req.body.idOfType;
                        break;
                    default:
                        break;
                }
                const image = await app.model("image_" + req.body.type).create(obj);
                if (image) {
                    response.status = 'success';
                    response.message = "Image Uploaded";
                    response.image = image;
                } else {
                    response.status = 'fail';
                    response.message = "Something happend";
                }
            } catch (error) {

                response.status = 'fail';
                response.message = error.message;
            }
            res.status(200).send(response);
        }
    });
});

router.get('/userImages/:idImage', async (req, res) => {
    // console.log(path.dirname());
    console.log(req.params.idImage);

    var user_image = await db.image_user.findByPk(req.params.idImage);

    if (user_image) {
        // express.static(path.resolve(__dirname, '../', user_image.route));
        res.sendFile(path.resolve(__dirname, '../', user_image.route));
    } else {
        res.status(500).send("not found");
    }

    // res.sendFile(__dirname+'/api/resource/images/users/1/64d2e7225321f6cce1cd4b3b6d4ef5f0878743e7-1587519446.jpg');
});

router.get('/userImages', [jwtAuth.verifyToken], async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario
    console.log(req.idUser);

    var user_images = await db.image_user.findAll({ where: { idUser: req.idUser }, attributes: ['idImage', 'principal', 'idUser'] });
    if (user_images != null) {
        response.status = "success";
        response.images = user_images;
    } else {
        response.status = "fail";
    }
    res.send(response);

});


const ingredientFilter = async (req, file, cb) => {
    // console.log(file);
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
        cb(null, true);
    } else {
        req.fileValidationError = 'Suba solo imagenes/gifs';
        return cb('Suba solo imagenes/gifs');
    }
}

const uploadIngredient = multer({ storage: storage, fileFilter: ingredientFilter }).single('imageSend');

router.post('/saveIngredient', async (req, res) => {
    const response = new Object();
    var dirImg;
    await uploadIngredient(req, res, async (err) => {
        if (typeof req.file !== "undefined") {
            response.message = "immage send";
            dirImg = req.file.path;
        } else {
            response.status = 'fail';
            response.message = err;
            dirImg = "api/resource/images/ingredient/default.jpg";
        }
        const [ingredient, created] = await db.ingredient.findOrCreate({
            where: { name: req.body.name },
            defaults: {
                name: req.body.name,
                routeImage: dirImg
            }
        });
        if (created) {
            response.status = 'success';
            response.message = "ingredient created";
            response.ingredient = ingredient;
        } else {
            response.status = "fail";
            response.message = "existing ingredient";
        }
        res.send(response);
    });
});


const recipeFilter = async (req, file, cb) => {
    const dataIngredients = JSON.parse(req.body.recipeIngredient);
    
    if (req.body.title.length!=0 && req.body.description.length!=0 && req.body.stepRecipe.length!=0 && dataIngredients.length!=0 && req.body.approximateTime.length!=0 && req.body.difficulty.length!=0 && req.body.isVegan.length!=0 && req.body.idCategorie.length!=0) {
        var existCategorie = await db.categorie.findByPk(req.body.idCategorie);
        var existRecipe = await db.recipe.findOne({ where: { title: req.body.title } });
        if(existRecipe==null){
            if(existCategorie==null){
                req.fileValidationError = "Categoria inexistente";
                return cb('Categoria inexistente');
            }else{
                var existIngredient = true;
                var missingIngredients = [];
    
                for (const key in dataIngredients) {
                    if (dataIngredients.hasOwnProperty(key)) {
                        const element = dataIngredients[key];
                        var ingredient = await db.ingredient.findByPk(element.idIngredient);
                        if (ingredient==null) {
                            existIngredient = false;
                            missingIngredients.push(element.idIngredient);
                        }
                    }
                }
                
                if(!existIngredient){
                    req.fileValidationError = 'Faltan ingredientes para crear esta receta' + missingIngredients;
                    return cb('Faltan ingredientes para crear esta receta ' + JSON.stringify(missingIngredients));
                }else{
                    if(existCategorie!=null){
                        if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {
                            cb(null, true);
                        } else {
                            req.fileValidationError = 'Suba solo imagenes/gifs';
                            return cb('Suba solo imagenes/gifs');
                        }
                    }else{
                        req.fileValidationError = 'No existe esta categoria, creela o busque otra';
                        return cb('No existe esta categoria, creela o busque otra');
                    }
                }
            }
        }else{
            req.fileValidationError = "Ya existe esta receta";
            return cb('Ya existe esta receta');
        }
    } else {
        req.fileValidationError = 'Llene todos los campos';
        return cb('Llene todos los campos');
    }
}

const uploadRecipie = multer({ storage: storage, fileFilter: recipeFilter }).any();

router.post("/generateRecipe", async (req, res) => {
    const response = new Object();
    var dirImg;
    await uploadRecipie(req, res, async (err) => {
        if (err) {
            response.status = "fail";
            response.message = err;
        } else {
            if (req.files.length != 0) {
                dirImg = req.files.map(file => {
                    var obj = {};
                    obj["principal"] = file.fieldname=="main"?1:0;
                    obj["route"] = file.path;
                    return obj
                });
                console.log(dirImg);
                
            } else {
                dirImg = [{ "principal": 1, "route": "api/resource/images/recipe/default.jpg" }];
            }
            try {
                var existRecipe = await db.recipe.findOne({ where: { title: req.body.title } });
                if (existRecipe) {
                    response.status = "fail";
                    response.message = "existing recipe";
                } else {
                    const dataStep = JSON.parse(req.body.stepRecipe);
                    const dataIngredients = JSON.parse(req.body.recipeIngredient);
                    const recipe = await db.recipe.create({
                        title : req.body.title,
                        description:req.body.description,
                        likes:req.body.likes,
                        approximateTime:req.body.approximateTime,
                        difficulty:req.body.difficulty,
                        isVegan:req.body.isVegan,
                        idCategorie:req.body.idCategorie,
                        recipe_steps:dataStep,
                        recipe_ingredients:dataIngredients,
                        recipe_images:dirImg,
                    },{
                        include:[db.recipe_step,db.recipe_ingredient,db.recipe_image]
                    });
                    response.status = "success";
                    response.message = "Receta agragada";
                    
                }
            } catch (error) {
                response.status = "fail";
                response.status = error.message;
            }
        }
        res.send(response);
    });
});

router.get("/getIdsLikedRecipe",async(req,res)=>{
    const response = new Object();
    try {
        var getFavorites = await db.recipe_liked.findAll({
            attributes:['idRecipe'],
            where:[{
                idUser:req.query.idUser
            }]
        });
        response.status="success";
        response.message=getFavorites;
    } catch (error) {
        response.status="fail";
        response.message=error.message;
    }
    res.send(response);
});

router.get("/getLikedRecipe",async(req,res)=>{
    var idExisting;
    if(req.query.idsRecipes){
        idExisting=JSON.parse(req.query.idsRecipes);
    }else{
        idExisting=[];
    }
    
    const response = new Object();
    try {
        var getMostVoted = await db.recipe_comment.findAll({
            limit:5,
            attributes:[
                'idRecipe',
                [sequelize.literal('SUM(assessment)/COUNT(idRecipeComment)'), 'total_assessment']
            ],
            group: ['idRecipe'],
            order:sequelize.literal('total_assessment DESC'),
            include:[{
                model:db.recipe,
                include:[{
                    model:db.recipe_image,
                    where:{
                        principal:1
                    }
                }]
            }]
        });
        response.status="success";
        response.message=getMostVoted;
    } catch (error) {
        response.status="fail";
        response.message=error.message;
    }
    res.send(response);
});
// include:[
//     {model:db.recipe,include:[{model:db.recipe_image,where:{principal:1},required:false,limit:1}]},
// ],
// where:{
//     idRecipe:{
//         [Op.notIn]:idExisting
//     }
// }
router.get("/getLastsRecipe", async (req, res) => {    
    const response = new Object();    
    try {
        var recipes = await db.recipe.findAll({
            // limit:6,
            attributes:{
                include:[
                    [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                    [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
                ]
            },
            order:[['idRecipe', 'DESC']],
            include:[{
                model:db.recipe_image,
                where:[{
                    principal:1
                }]
            }],
        });       
        if (recipes) {
            response.status = "success";
            response.message = recipes;
        } else {
            response.status = "fail";
            response.message = "not recipes";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

router.get("/getRandomRecipe", async (req, res) => {
    var idExisting;
    if (req.body.idExisting) {
        idExisting = JSON.parse(req.body.idExisting);
    } else {
        idExisting = []
    }

    var moreRandom = await db.recipe.findAll({
        limit: 10,
        order: Sequelize.literal('rand()'),
        attributes:{
            include:[
                [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
            ]
        },
        where: {
            idRecipe: {
                [Op.notIn]: idExisting,
            }
        },
        include: [{
            model: db.recipe_image,
            where: { principal: 1 }
        }]
    });
    res.send(moreRandom);
});

router.get("/getRecipe", async (req, res) => {
    const response = new Object();
    var recipe = await db.recipe.findByPk(
        req.query.idRecipe,
        {
            order:[[db.recipe_step,'stepNumber','ASC']],
            include:[
                {model:db.recipe_step},
                {model:db.recipe_ingredient,include:[{model:db.ingredient}]},
                {model:db.recipe_image,where:[{principal:1}]},
                {model:db.recipe_comment,include:[{model:db.user,attributes:["names","idUser"]}]}
            ]
        }
    );
    var likedUserRecipe = await db.recipe_liked.findOne({
        where:[{idUser:req.query.idUser,
            idRecipe:req.query.idRecipe
        }]
    });
    if (recipe!=null) {
        response.status = "success";
        response.message = recipe;
        if(likedUserRecipe!=null){
            response.liked=true;
        }else{
            response.liked=false;
        }
    } else {
        response.status = "fail";
        response.message = "404 recipe not found";
    }
    res.send(response);
});

router.post("/likes", [jwtAuth.verifyToken], async (req, res) => {
    const response = Object();
    try {
        var idUser = req.idUser;
        if (req.body.idUserLiked != undefined && req.body.idUserLiked != "" && req.body.idUserLiked > 0) {
            var idUserLiked = parseInt(req.body.idUserLiked);
            var userLiked = await db.user.findByPk(idUserLiked);
            if (userLiked) {
                const [like, created] = await db.like.findOrCreate({
                    where: { idUser: idUser, idUserLiked: idUserLiked },
                    defaults: { f_liked: req.body.f_liked }
                });
                console.log(created);
                if (!created) {
                    like.f_liked = req.body.f_liked;
                    like.save();
                }
                if (like) {
                    response.status = "success";
                }
            } else {
                response.status = "fail";
                errors = response.errors != undefined ? response.errors : [];
                errors.push("idUserLiked does not exist");
                response.errors = errors;
            }
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("Incorrect idUserLiked");
            response.errors = errors;

        }
    } catch (error) {
        console.log(error);

        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Server error");
        response.errors = errors;
    }
    res.send(response);

});

router.get("/likes", [jwtAuth.verifyToken], async (req, res) => {
    const response = Object();
    try {
        var likes = await db.like.findAll({
            where: { idUser: req.idUser, [Op.not]: { 'f_liked': false } },
            arguments: ['idLike', 'idUser', 'idUserLiked', 'f_liked'],
            include: [
                {
                    model: db.user, attributes: [
                        'names', 'surnames', 'bornDate', 'email', 'country', 'city', 'location', 'description'
                    ],
                    include: [{ model: db.image_user, attributes: ['idImage', 'principal'] }]
                },
            ]
        });
        response.status = 'success';
        response.likes = likes;
    } catch (error) {
        console.log(error);

        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Server error");
        response.errors = errors;
    }
    res.send(response);

});

router.post('/updateFavoriteRecipe',async(req,res)=>{
    const response = new Object();
    console.log(req.body);
    
    if(req.body.actualState){
        try {
            var destroyState = await db.recipe_liked.destroy({
                where:{
                    idRecipe:req.body.idRecipe,
                    idUser:req.body.idUser
                }
            });
            if(destroyState){
                response.status="success";
                response.message='{"case":"destroy","idRecipe":'+req.body.idRecipe+'}';
            }else{
                response.status="success";
                response.message='{"case":"destroyed","idRecipe":'+req.body.idRecipe+'}';
            }
        } catch (error) {
            response.status="fail";
            response.message=error.message;
        }
    }else{
        try {
            var [liked,created]= await db.recipe_liked.findOrCreate({
                where:{
                    idUser:req.body.idUser,
                    idRecipe:req.body.idRecipe
                },
                defaults:{
                    idUser:req.body.idUser,
                    idRecipe:req.body.idRecipe
                }
            });
            if(created){
                response.status="success";
                response.message='{"case":"created","idRecipe":'+req.body.idRecipe+'}';
            }else{
                response.status="success";
                response.message='{"case":"existed","idRecipe":'+req.body.idRecipe+'}';
            }
        } catch (error) {
            response.status="fail";
            response.message=error.message;
        }
    }
    console.log(response);
    
    res.send(response);
});

router.get('/getMyfavorites',async(req,res)=>{
    const response = new Object();
    try {
        var getFavorites = await db.recipe_liked.findAll({
            where:{
                idUser:req.query.idUser
            },
            include:[
                {
                    model:db.recipe,
                    attributes:{
                        include:[
                            [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                            [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
                        ]
                    },
                    include:[
                        {
                            model:db.recipe_image,
                            where:{principal:1},
                        }
                    ]
                },
            ]
        });
        response.status="success";
        response.message=getFavorites;
    } catch (error) {
        response.status="fail";
        response.message=error.message;
    }
    res.send(response);
});

router.get('/searchRecipe',async(req,res)=>{
    const response = new Object();
    try {
        var findRecipe = await db.recipe.findAll({
            where:{
                title:{
                    [Op.like]:'%'+req.query.querySearch+'%'
                }
            },
            include:[{
                model:db.recipe_image,
                where:{ principal : 1 }
            }]
        });
        response.status="success";
        response.message=findRecipe;
    } catch (error) {
        response.status="fail";
        response.message=error.message;
    }
    res.send(response);
});

router.post('/addCommentRecipe',async(req,res)=>{
    const response = new Object();
    try {
        var [coment,created] = await db.recipe_comment.findOrCreate({
            where:{
                idUser:req.body.idUser,
                idRecipe:req.body.idRecipe
            },
            defaults:{
                idUser:req.body.idUser,
                idRecipe:req.body.idRecipe,
                assessment:req.body.assessment,
                commentary:req.body.commentary
            }
        });
        if (created) {
            response.status = "success";
            response.message = "Comentario añadido"
        } else {
            response.status = "fail";
            response.message = "Solo puedes dar una valoracion por receta";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    console.log(response);
    res.send(response);
    
});

router.get('/getCommentRecipe',async(req,res)=>{
    var comentaries = await db.recipe_comment.findAll({
        include:[{
            model:db.user
        }]
    });
    res.send(comentaries)
});


const categorieFilter = async (req, file, cb) => {
    // console.log(file);
    var categorieExist = await db.categorie.findAll({where:{name:req.body.name}});
    
    if(categorieExist.length!=0){
        req.fileValidationError = 'Ya existe esta categoria';
        return cb('Ya existe esta categoria');
    }else{
        if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
            cb(null, true);
        } else {
            req.fileValidationError = 'Suba solo imagenes/gifs';
            return cb('Suba solo imagenes/gifs');
        }
    }
}

const createdCategorie = multer({ storage: storage, fileFilter: categorieFilter }).any();

router.post('/createCategorie',async(req,res)=>{
    const response = new Object();
    var dirImg="api/resource/images/categories/";
    await createdCategorie(req, res, async (err) => {
        var routeImage;
        var icon;        
        if (err) {
            response.status = "fail";
            response.message = err;
        } else {
            if(req.files.length!=0){
                req.files.map(file => {
                    if(file.fieldname=="image"){
                        routeImage=file.path;
                    }
                    if(file.fieldname=="icon"){
                        icon=file.path;
                    }
                });
            }else{
                routeImage=dirImg+"defaultImage.jpg";
                icon=dirImg+"defaultIcon.png";
            }
            try {
                var [categorie,created] = await db.categorie.findOrCreate({
                    where:{
                        name:req.body.name
                    },
                    defaults:{
                        name:req.body.name,
                        routeImage:routeImage==undefined?dirImg+"defaultImage.jpg":routeImage,
                        icon:icon==undefined?dirImg+"defaultImage.png":icon
                    }
                });
                if (created) {
                    response.status = "success";
                    response.message = "Categoria añadida"
                } else {
                    response.status = "fail";
                    response.message = "ya existe esta categoria";
                }
            } catch (error) {
                response.status = "fail";
                response.message = error.message;
            }
        }
        res.send(response);
    });
});

router.get('/getCategories',async(req,res)=>{
    const response = new Object();
    
    try {
        var categories = await db.categorie.findAll({order:[['name','ASC']]});
        response.status="success";
        response.message=categories;
    } catch (error) {
        response.status="error";
        response.message=error.message;
    }
    res.send(response);
});

router.get('/getRecipePerFilter',async(req,res)=>{
    const response = new Object();
    var recipes;

    var idExisting;
    if (req.query.idRecipes) {
        idExisting = JSON.parse(req.query.idRecipes);
    } else {
        idExisting = []
    }
    
    if(req.query.filter=="New recipes"){
        try {
            recipes = await db.recipe.findAll({
                limit:1,
                order:[['idRecipe', 'DESC']],
                attributes:{
                    include:[
                        [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                        [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
                    ]
                },
                where: {
                    idRecipe: {
                        [Op.notIn]: idExisting,
                    }
                },
                include:[{
                    model:db.recipe_image,
                    where:{ principal: 1 }
                }]
            });
            if (recipes) {
                response.status = "success";
                response.message = recipes;
            } else {
                response.status = "fail";
                response.message = "not recipes";
            }
        } catch (error) {
            response.status = "fail";
            response.message = error.message;
        }
    }
    if(req.query.filter=="Random"){
        try {
            recipes = await db.recipe.findAll({
                limit:15,
                order: Sequelize.literal('rand()'),
                attributes:{
                    include:[
                        [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                        [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
                    ]
                },
                where: {
                    idRecipe: {
                        [Op.notIn]: idExisting,
                    }
                },
                include: [{
                    model: db.recipe_image,
                    where: { principal: 1 }
                }]
            });
            if (recipes) {
                response.status = "success";
                response.message = recipes;
            } else {
                response.status = "fail";
                response.message = "not recipes";
            }
        } catch (error) {
            response.status = "fail";
            response.message = error.message;
        }
    }
    if (req.query.filter=="Most voted"){
        try {
            recipes = await db.recipe.findAll({
                limit:15,
                attributes:{
                    include:[
                        [sequelize.literal('(SELECT sum(assessment)/COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'totalAssessment'],
                        [sequelize.literal('(SELECT COUNT(idRecipeComment) from `recipe_comments` where recipe_comments.idRecipe = recipe.idRecipe)'),'countOfReview']
                    ]
                },
                include: [{
                    model: db.recipe_image,
                    where: { principal: 1 }
                },{
                    model:db.recipe_comment,
                    attributes:{
                        exclude:['idRecipeComment','assessment','commentary','idUser','idRecipe','createdAt','updatedAt']
                    },
                    where:{
                        idRecipe:{
                            [Op.ne]:null
                        }
                    }
                }],
                where: {
                    idRecipe: {
                        [Op.notIn]: idExisting,
                    }
                }
            });
            if (recipes) {
                response.status = "success";
                response.message = recipes;
            } else {
                response.status = "fail";
                response.message = "not recipes";
            }
        } catch (error) {
            response.status = "fail";
            response.message = error.message;
        }
    }
    if (req.query.filter!="Random" && req.query.filter!="New recipes" && req.query.filter!="Most voted") {
        try {
            recipes = await db.categorie.findAll({
                limit:1,
                include:[{
                    model:db.recipe,
                    where: {
                        idRecipe: {
                            [Op.notIn]: idExisting,
                        }
                    },
                    include:[{
                        model:db.recipe_image,
                        where: { principal : 1 }
                    }]
                }],
                where:{ name: req.query.filter }
            });
            if(recipes){
                response.status="success";
                response.message=recipes;
            }else{

            }
        } catch (error) {
            response.status = "fail";
            response.message = error.message;
        }
    }    
    res.send(response);
});
module.exports = router;
//////new recipes
////most voted
/////random
