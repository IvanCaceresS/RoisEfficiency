var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
const { redirect, render } = require('express/lib/response');
const multer  = require('multer');
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { Console } = require('console');
global.gmail = "ivan.caceres_s@mail.udp.cl"
global.gmailPassword = "IAMVAL2021";

mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"RoisEfficiency"
});

var app = express();

app.use( express.static( "public" ) );
app.use( '/uploads' , express.static( 'uploads' ) );

app.set('view engine', 'ejs');

app.listen(8080);
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false
}));


function isProductInCart(cart, id){
    for(let i=0; i<cart.length; i++){
        if(cart[i].id == id){
            return true;
        }
    }
    return false;
}

function calculateTotal(cart,req){
    total = 0;
    for(let i=0; i<cart.length; i++){
        if(cart[i].sale_price && cart[i].sale_price>0){
            total = total + (cart[i].sale_price * cart[i].quantity);
        }else{
            total = total + (cart[i].price * cart[i].quantity);
        }
    }
    req.session.total = total;
    return total;
}


//////////////////////////////// UPLOAD /////////////////////////////////////
app.use(fileUpload())

//////////////////////////////A D M I N///////////////////////////////////////

app.get('/adminProducto', function(req,res){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    if (req.session.adminIsLoggedIn === true){
            con.query("SELECT max(id) FROM products",(err,result)=>{
            res.render('pages/adminProducto',{result:result});
        });
    }
    else{
        res.redirect('/admin'); 
    }
});

app.post('/addProduct', function(req, res) {
    var id = req.body.id;
    var productName = req.body.productName;
    var description = req.body.description;
    var price = req.body.price;
    var salePrice = req.body.salePrice;
    var quantity = req.body.quantity;
    var imagen = "";
    if (req.body.salePrice == null || req.body.salePrice==0){
        salePrice = null;
    } 

    let EDFile = req.files.file;
    const path = './public/images';

    imagen = "Lente_" + id + EDFile.name.substring(EDFile.name.lastIndexOf('.')).toUpperCase();
    EDFile.mv(path+"/"+imagen);

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "RoisEfficiency"
    });
    
    // Verifica si el ID o el productName ya existen en la base de datos
    var checkQuery = "SELECT `id`, `name` FROM `products` WHERE `id` = ? OR `name` = ?";
    con.query(checkQuery, [id, productName], function(err, result) {
        if (err) {
            console.log(err);
            res.redirect('/adminMain');
        } else {
            // Si el ID o el productName ya existen, redirige al administrador con un mensaje de error
            if (result.length > 0) {
                let errMsg = "El ";
                if (result[0].id == id) {
                    errMsg += "ID '" + id + "'";
                }
                if (result[0].name == productName) {
                    errMsg += (errMsg == "El " ? "" : " y el ") + "nombre de producto '" + productName + "'";
                }
                errMsg += " ya existe en la base de datos. Por favor, elige otro.";
                req.session.msgact = errMsg;
                res.redirect('/adminMain');
            } else {
                // Si no existen, procede con la inserción
                var insertQuery = "INSERT INTO `products` (`id`, `name`, `description`, `price`, `sale_price`, `quantity`, `image`) VALUES (?, ?, ?, ?, ?, ?, ?)";
                con.query(insertQuery, [id, productName, description, price, salePrice, quantity, imagen], function(err, result) {
                    if (err) {
                        console.log(err);
                        res.redirect('/adminMain');
                    } else {
                        req.session.msgact = "Haz añadido correctamente el producto '" + productName + "', el codigo QR asociado es:";
                        res.redirect('/adminMain');
                    }    
                });
            }
        }
    });
});



app.get('/admin', function(req,res){
    req.session.adminIsLoggedIn=undefined;
    req.session.admin_name=undefined;
    req.session.admin_rut = undefined;
    req.session.admin_password = undefined;
    res.render('pages/adminLogin', {errorMsg: undefined,successMsg:undefined});
});

app.get('/adminMain', function(req, res) {
    if (req.session.adminIsLoggedIn === true) {
        var msgact = req.session.msgact;
        req.session.msgact = undefined;
        res.render('pages/adminMain', { admin_name: req.session.admin_name, msg: msgact });
    } else {
        res.redirect('/admin');
    }
});

app.get('/orders', function(req, res) {
    if (req.session.isLoggedIn === true) {
        let email = req.session.user_email;
        var con = mysql.createConnection({
            host:"localhost",
            user:"root",
            password:"",
            database:"RoisEfficiency"
        });
        con.query("SELECT * FROM orders WHERE email = ?", [email], (err, orders) => {
            if (err) {
                res.render('pages/orders', {errorMsg:"Error en la consulta de la base de datos", result:null, email:email, isLoggedIn:req.session.isLoggedIn});
            } else {
                if (orders.length === 0) {
                    res.render('pages/orders', {errorMsg:"No hay ordenes asociadas a ti", result:null, email:email, isLoggedIn:req.session.isLoggedIn});
                } else {
                    let orderPromises = orders.map((order) => {
                        return new Promise((resolve, reject) => {
                            let productIds = order.product_ids.split(",");
                            let productCounts = {}; // object to store counts of each product
                            let productPromises = productIds.map((productId) => {
                                return new Promise((resolve, reject) => {
                                    con.query("SELECT name FROM products WHERE id = ?", [productId], (err, result) => {
                                        if(err) {
                                            reject("Error en la consulta de la base de datos");
                                        } else {
                                            let productName = result[0] ? result[0].name : "Producto descontinuado";
                                            if (productCounts[productName]) {
                                                productCounts[productName]++;
                                            } else {
                                                productCounts[productName] = 1;
                                            }
                                            resolve();
                                        }
                                    });
                                });
                            });
                            Promise.all(productPromises)
                            .then(() => {
                                let productNames = [];
                                for (let [name, count] of Object.entries(productCounts)) {
                                    productNames.push(`${count}x${name}`);
                                }
                                order.product_names = productNames.join(", ");
                                resolve();
                            })
                            .catch((err) => {
                                reject(err);
                            });
                        });
                    });
                    Promise.all(orderPromises)
                    .then(() => {
                        res.render('pages/orders', {errorMsg:undefined, result:orders, email:email, isLoggedIn:req.session.isLoggedIn});
                    })
                    .catch((err) => {
                        res.render('pages/orders', {errorMsg:err, result:null, email:email, isLoggedIn:req.session.isLoggedIn});
                    });
                }
            }
        });
    } else {
        res.redirect('/');
    }
});


app.get('/adminCerrarSesion', function(req, res) {
    if (req.session.adminIsLoggedIn === true) {
        req.session.adminIsLoggedIn=false;
                req.session.admin_name=undefined;
                req.session.admin_rut = undefined;
                req.session.admin_password = undefined;
                res.redirect('/admin');
    } else {
        res.redirect('/admin');
    }
});


app.post('/adminAuthLogin',function(req,res){
    var admin_rut = req.body.rut;
    var admin_password = req.body.password;

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    if (admin_rut !== undefined && admin_password !== undefined) {
        con.query("SELECT * FROM admins WHERE rut=? and password=?", [admin_rut, admin_password],(err,result)=>{
            if(result && result.length > 0){
                req.session.adminIsLoggedIn=true;
                req.session.admin_name=result[0].primer_nombre;
                req.session.admin_rut = admin_rut;
                req.session.admin_password = admin_password;
                res.redirect('/adminMain');
            }
            else{
                const errorMsg = "El rut o la contraseña son incorrectos. Por favor, intenta de nuevo.";
                const successMsg = undefined;
                res.render('pages/adminLogin', {errorMsg: errorMsg,successMsg:successMsg});
            }
        });
    }
});

app.get('/adminInventario', function(req,res){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    if (req.session.adminIsLoggedIn === true){
        con.query("SELECT * FROM products",(err,result)=>{
                res.render('pages/adminInventario',{result:result});
        });
    }
    else{
        res.redirect('/admin'); 
    }
    
});

app.get('/adminOrdenes', function(req,res){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    if (req.session.adminIsLoggedIn === true){
        con.query("SELECT * FROM orders",(err,result)=>{
                res.render('pages/adminOrdenes',{result:result});
        });
    }
    else{
        res.redirect('/admin'); 
    }
});

app.post('/actStatusOrder', async function(req, res) {
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    con.connect(function(err) {
        if (err) throw err;

        var orderId = req.body.id;

        con.beginTransaction(async function(err) {
            if (err) {
                res.status(500).send("Error al iniciar la transacción");
                throw err;
            }

            var query = "SELECT product_ids, email, name FROM orders WHERE id = ?";

            con.query(query, [orderId], async function(err, result) {
                if (err) {
                    return con.rollback(function() {
                        res.status(500).send("Error al obtener los IDs de los productos");
                        throw err;
                    });
                }

                var productIds = result[0].product_ids.split(',');
                var customerEmail = result[0].email;
                var customerName = result[0].name;
                var zeroQuantityFlag = false;

                for (var i = 0; i < productIds.length; i++) {
                    var query = "SELECT quantity FROM products WHERE id = ?";

                    await new Promise((resolve, reject) => {
                        con.query(query, [productIds[i]], function(err, result) {
                            if (err) {
                                reject(err);
                            }

                            if (result[0].quantity == 0) {
                                zeroQuantityFlag = true;
                            }

                            resolve();
                        });
                    }).catch((err) => {
                        return con.rollback(function() {
                            res.status(500).send("Error al obtener la cantidad de producto");
                            throw err;
                        });
                    });

                    if(zeroQuantityFlag) break;
                }

                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: global.gmail,
                        pass: global.gmailPassword
                    }
                });

                let mailOptions = {
                    from: global.gmail,
                    to: customerEmail,
                    subject: 'Actualización de estado de su pedido',
                };

                if (zeroQuantityFlag) {
                    con.rollback(function(err) {
                        if (err) {
                            res.status(500).send("Error al realizar el rollback");
                            throw err;
                        }
                        con.end(function(err) {
                            if (err) {
                                res.status(500).send("Error al cerrar la conexión");
                                throw err;
                            }

                            var refundCon = mysql.createConnection({
                                host:"localhost",
                                user:"root",
                                password:"",
                                database:"RoisEfficiency"
                            });

                            refundCon.connect(function(err) {
                                if (err) throw err;
                                var refundQuery = "UPDATE orders SET status = 'REEMBOLSO POR FALTA DE STOCK' WHERE id = ?";

                                refundCon.query(refundQuery, [orderId], function(err, result) {
                                    if (err) {
                                        res.status(500).send("Error al actualizar el estado de la orden a REEMBOLSO POR FALTA DE STOCK");
                                        throw err;
                                    }
                                    mailOptions.html = `
                                    <h1>Estimado(a) ${customerName},</h1>
                                    <p>Recibimos su transferencia.</p>
                                    <p>Sin embargo, se acabó el stock de los productos que solicitó. Reembolsaremos el total de la compra y el estado del pedido será "REEMBOLSO POR FALTA DE STOCK"</p>
                                    <p>Atentamente,</p>
                                    <p>OpticaRois</p>`;
                                    transporter.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                          console.log(error);
                                        }
                                    });
                                    res.send("No se puede actualizar la orden porque la cantidad de producto es 0");
                                    refundCon.end();
                                });
                            });
                        });
                    });
                } else {
                    var query = "UPDATE orders SET status = 'PAGADO Y ENVIADO' WHERE id = ? AND status = 'NO PAGADO'";

                    con.query(query, [orderId], function(err, result) {
                        if (err) {
                            return con.rollback(function() {
                                res.status(500).send("Error al actualizar el estado de la orden");
                                throw err;
                            });
                        }

                        var completedUpdates = 0;

                        for (var i = 0; i < productIds.length; i++) {
                            var query = "UPDATE products SET quantity = quantity - 1 WHERE id = ? AND quantity > 0";

                            con.query(query, [productIds[i]], function(err, result) {
                                if (err) {
                                    return con.rollback(function() {
                                        res.status(500).send("Error al actualizar la cantidad del producto");
                                        throw err;
                                    });
                                }

                                // Si la cantidad no se actualizó (es decir, habría sido 0), revertimos la transacción
                                if (result.affectedRows == 0) {
                                    return con.rollback(function() {
                                        res.send("No se puede actualizar la orden porque resultaría en una cantidad de producto negativa");
                                    });
                                } else {
                                    completedUpdates++;

                                    if (completedUpdates == productIds.length) {
                                        // Si todas las actualizaciones fueron exitosas, realizamos los cambios
                                        con.commit(function(err) {
                                            if (err) {
                                                return con.rollback(function() {
                                                    res.status(500).send("Error al realizar los cambios");
                                                    throw err;
                                                });
                                            }

                                            mailOptions.html = `
                                            <h1>Estimado(a) ${customerName},</h1>
                                            <p>Hemos recibido su pago y hemos enviado su pedido.</p>
                                            <p>Atentamente,</p>
                                            <p>OpticaRois</p>`;
                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                  console.log(error);
                                                }
                                            });
                                            res.send("Estado de la orden y cantidades de productos actualizados con éxito");
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
    });
});



app.get('/adminEscaneo', function(req,res){
    if (req.session.adminIsLoggedIn === true){
            res.render('pages/adminEscaneo',{msgerror:undefined});
    }
    else{
        res.redirect('/admin'); 
    }
});

app.get('/adminModificacion', function(req, res) {
    if (req.session.adminIsLoggedIn === true) {
        const scannedText = req.query.text; // Obtener el valor escaneado del query string
        if(scannedText.length==0){
            res.render('pages/adminEscaneo', { msgerror: "Escanea o escribe el nombre del producto" });
        }
        else{

        var con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "RoisEfficiency"
        });
        con.query("SELECT * FROM products WHERE name=?", [scannedText], function(err, product) {
            if (err) {
                console.log(err);
                res.redirect('/admin');
            } else {
                if (product.length === 0) {
                    res.render('pages/adminEscaneo', { msgerror: "No hay ningún producto con este código" });
                } else {
                    res.render('pages/adminModificacion', { product: product });
                }
            }
        });
    }
    } 
    else {
        res.redirect('/admin');
    }
    
});

app.post('/modificarProducto', function(req, res) {
    var productName = req.body.productName;
    var price = req.body.price;
    var salePrice = req.body.salePrice;
    var quantity = req.body.quantity;
    
    if (salePrice === "0") {
        salePrice = null;
    }
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "RoisEfficiency"
    });

    var query = "UPDATE products SET price = ?, sale_price = ?, quantity = ? WHERE name = ?";

    con.query(query, [price, salePrice, quantity, productName], function(err, result) {
        if (err) {
            console.log(err);
            res.redirect('/adminEscaneo');
        } else {
            req.session.msgact = productName + " actualizado correctamente";
            res.redirect('/adminMain');
        }
    });
});


app.post('/eliminarProducto', function(req, res) {
    var productName = req.body.productName;

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "RoisEfficiency"
    });

    var query = "DELETE FROM products WHERE name = ?";

    con.query(query, productName, function(err, result) {
        if (err) {
            console.log(err);
            res.redirect('/adminEscaneo');
        } else {
            req.session.msgact = productName + " eliminado correctamente";
            res.redirect('/adminMain');
        }
    });
});



app.get('/', function(req,res){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    con.query("SELECT * FROM products",(err,result)=>{
        res.render('pages/index',{isLoggedIn:req.session.isLoggedIn,user_rut:req.session.rut,user_name:req.session.user_name,result:result});
    });

});

app.post('/register',function(req,res){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    
    var primer_nombre = req.body.primer_nombre;
    var segundo_nombre = req.body.segundo_nombre;
    var primer_apellido = req.body.primer_apellido;
    var segundo_apellido = req.body.segundo_apellido;
    var rut = req.body.rut;
    var email = req.body.email;
    var direccion = req.body.direccion;    
    var password = req.body.password;
    var receta = "";

    let EDFile = req.files.file;
    const path = './uploads/' + rut;
    const newFileName = "receta" + require('path').extname(EDFile.name);  // Renamed file

    fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
    });

    EDFile.mv(path+"/"+newFileName, function(err) {  // Use new file name here
        if (err) {
          console.error("File could not be moved: ", err);
          throw err;
        }
    });
    receta = path+"/"+newFileName;  // Use new file name here

    try {
        con.connect(function(err) {
            if (err) throw err;
            var sql = "INSERT INTO users (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rut, email, direccion, receta, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            var values = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rut, email, direccion, receta, password];
            con.query(sql, values, function (err, result) {
                if (err) {
                  if (err.code === 'ER_DUP_ENTRY') {
                    const errorMsg = 'El rut o email ya está registrado en el sistema.';
                    res.render('pages/register', {errorMsg: errorMsg});
                  } else {
                    throw err;
                  }
                } else {
                  const errorMsg = 'Te has registrado correctamente, ahora inicia sesión.';
                  const successMsg = undefined;
                  res.render('pages/login', {errorMsg: errorMsg,successMsg:successMsg});
                }
            });
        });
    } catch (err) {
        console.error(err);
        const errorMsg=undefined;
        res.render('pages/register', {errorMsg: errorMsg})
    }
});



app.post('/authLogin',function(req,res){
    var user_rut = req.body.rut;
    var user_password = req.body.password;

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    if (user_rut !== undefined && user_password !== undefined) {
        con.query("SELECT * FROM users WHERE rut=? and password=?", [user_rut, user_password],(err,result1)=>{
            if(result1 && result1.length > 0){
                req.session.isLoggedIn=true;
                req.session.user_name = result1[0].primer_nombre;
                req.session.second_user_name = result1[0].segundo_nombre;
                req.session.user_lastname = result1[0].primer_apellido;
                req.session.user_second_lastname = result1[0].segundo_apellido;
                req.session.user_complete_name = `${req.session.user_name} ${req.session.second_user_name} ${req.session.user_lastname} ${req.session.user_second_lastname}`;
                req.session.user_email=result1[0].email;
                req.session.user_address=result1[0].direccion;
                req.session.rut = user_rut;
                req.session.password = user_password;
                res.redirect('/');
            }
            else{
                const errorMsg = "El usuario o la contraseña son incorrectos. Por favor, intenta de nuevo.";
                const successMsg = undefined;
                res.render('pages/login', {errorMsg: errorMsg,successMsg:successMsg});
            }
        });
    }
});

app.post('/logout',function(req,res){
    req.session.isLoggedIn=false;
    req.session.rut = undefined;
    req.session.password = undefined;
    res.redirect('/');
});

app.get('/login', function(req,res){
    
    const errorMsg=undefined;
    const successMsg=undefined;
    res.render('pages/login', {errorMsg: errorMsg,successMsg:successMsg});
});

app.get('/olvidePassword', function(req,res){
    const errorMsg=undefined;
    const successMsg=undefined;
    res.render('pages/olvidePassword', {errorMsg: errorMsg,successMsg:successMsg});
});

app.post('/reestablecerPassword', async function(req,res){
    var rut = req.body.rut;
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    con.query('SELECT * FROM users WHERE rut = ?', [rut], async function (error, results, fields) {
        if (error) {
            res.render('pages/olvidePassword', {errorMsg: "Error de base de datos.", successMsg: undefined});
        } else {
            if (results.length > 0) {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: global.gmail,
                        pass: global.gmailPassword
                    }
                });

                let email = results[0].email;
                let pass = results[0].password;
                let mailOptions = {
                    from: global.gmail,
                    to: email,
                    subject: 'Restablecimiento de contraseña',
                    html: `
                        <h1>Restablecimiento de contraseña</h1>
                        <p>Se ha solicitado un restablecimiento de contraseña para su cuenta.</p>
                        <p>A continuación, le proporcionamos su contraseña actual:</p>
                        <h2>${pass}</h2>
                        <p>Le recomendamos cambiar esta contraseña por una nueva tan pronto como inicie sesión en su cuenta.</p>
                        <p>Si usted no solicitó este restablecimiento de contraseña, por favor ignore este correo electrónico.</p>
                        <p>Si necesita ayuda o tiene alguna pregunta, no dude en ponerse en contacto con nuestro equipo de soporte.</p>
                        <p>Atentamente,</p>
                        <p>OpticaRois</p>
                    `
                };
                
                try {
                    let info = await transporter.sendMail(mailOptions);
                    res.render('pages/olvidePassword', {errorMsg: "Se envió la contraseña al correo asociado a la cuenta: " + email, successMsg: undefined});
                } catch (error) {
                    res.render('pages/olvidePassword', {errorMsg: "No fue posible reestablecer la contraseña porque el email es inválido.", successMsg: undefined});
                }
            } else {
                res.render('pages/olvidePassword', {errorMsg: "Este RUT no está registrado en la base de datos.", successMsg: undefined});
            }
        }
    });
});

app.get('/register', function(req,res){
    
    const errorMsg=undefined;
    res.render('pages/register', {errorMsg: errorMsg})
});

app.post('/add_to_cart', function(req,res){
    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var product =  {id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image};

    if(req.session.cart){
        var cart = req.session.cart;

        if(!isProductInCart(cart, id)){
            cart.push(product);
        }
    }
    else{
        req.session.cart = [product];
        var cart = req.session.cart;
    }

    calculateTotal(cart,req);
    res.redirect('/cart');

});

app.get('/cart', function(req,res){
    if(req.session.cart != undefined){
        var cart = req.session.cart;
    var total = req.session.total;
    var isLoggedIn = req.session.isLoggedIn

    res.render('pages/carrito',{cart:cart,total:total,isLoggedIn:isLoggedIn});
    }
    else{
        res.redirect('/');
    }
    
});

app.post('/remove_product', function(req,res){
    var id = req.body.id;
    var cart = req.session.cart;
    
    var index = cart.findIndex(function(item) {
        return item.id == id;
    });
    
    if(index !== -1) {
        cart.splice(index, 1);
    }

    calculateTotal(cart,req);
    res.redirect('/cart');
});

app.post('/edit_product_quantity', function(req,res){

    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_quantity;
    var decrease_btn = req.body.decrease_quantity;
    var cantidad_lente;
    var cart = req.session.cart;

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    con.query("SELECT quantity FROM products WHERE id = ?", [id], (err, result) => {
        if (err) throw err;
        cantidad_lente=result[0].quantity;
        
        if(increase_btn){
            for(let i =0; i < cart.length; i++){
                if(cart[i].id == id){  
                        if(cantidad_lente>cart[i].quantity){
                            cart[i].quantity++;
                        } 
                }
            }
        }
    
        if(decrease_btn){
            for(let i =0; i < cart.length; i++){
                if(cart[i].id == id){
                    if(quantity > 1){
                        cart[i].quantity--;
                    }
                }
            }
        }
    
        calculateTotal(cart,req);
        res.redirect('/cart');

    });

    
});

app.get('/ver_producto', function(req, res){
    var id = req.query.id; // Obtener el ID de los parámetros de la URL
    // Redireccionar al método POST utilizando un formulario oculto
    res.send(`
        <form id="postForm" method="post" action="/view_product">
            <input type="hidden" name="id" value="${id}">
        </form>
        <script>
            document.getElementById("postForm").submit();
        </script>
    `);
});



app.post('/view_product', function(req,res){
    var id = req.body.id;

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    con.query("SELECT * FROM products", (err, result) => {
        if (err) throw err;
        res.render('pages/producto', { id_producto: id, result: result,isLoggedIn:req.session.isLoggedIn,user_rut:req.session.rut,user_name:req.session.user_name});
      });
    
});

app.get('/checkout', function(req,res){
    if(req.session.isLoggedIn == true){
    var total = req.session.total;
    res.render('pages/checkout',{total:total,user_name:req.session.user_name,user_lastname:req.session.user_lastname,second_user_name:req.session.second_user_name,user_second_lastname:req.session.user_second_lastname,user_email:req.session.user_email,user_address:req.session.user_address});
    }else{
        res.redirect('/');
    }
});

app.post('/place_order', function(req,res){

    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;
    var cost = req.session.total;
    var status = "NO PAGADO";
    var date = new Date();
    var product_ids = [];

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    var cart = req.session.cart;

    for(let i = 0; i < cart.length; i++){
        for(let j = 0; j < cart[i].quantity; j++) {
            product_ids.push(cart[i].id);
        }
    }
    let product_ids_string = product_ids.join(",");

    try {
        con.connect(function(err) {
            if (err) throw err;
            var query = "INSERT INTO orders (cost,name,email,status,address,phone,date,product_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            var values = [cost,name,email,status,address,phone,date,product_ids_string];
    
            con.query(query, values, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var newId = result.insertId;
                    res.redirect('/payment?id=' + newId);
                }
            });
        });
    } catch (err) {
        console.error(err);
    }
});


// Manejador de la ruta GET /payment para renderizar la página de pago
app.get('/payment', function(req, res){
    if(req.session.isLoggedIn == true){
        var total = req.session.total;
        var email = req.session.user_email;
        var ordenCompra = req.query.id;
        var msg = "";

        if (!ordenCompra) {
            msg = "No se proporcionó ningún ID de pedido.";
        }

        res.render('pages/payment', { total: total, email: email, msg: msg, ordenCompra: ordenCompra });
    }else{
        res.redirect('/');
    }
});

app.post('/cancelarOrden', function(req, res) {
    var ordenCompra = req.body.ordenCompra;
    
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });

    con.connect(function(err) {
        if (err) throw err;

        var query = "DELETE FROM orders WHERE id = ?";

        con.query(query, [ordenCompra], function (err, result) {
            if (err) {
                throw err;
            } else {
                // Modificar la sesión y establecer los valores a sus valores predeterminados
                req.session.isLoggedIn = false;
                req.session.rut = undefined;
                req.session.password = undefined;

                // Mensaje de error
                var errorMsg = "La orden de compra ha sido cancelada exitosamente. Ha sido desconectado de su cuenta por seguridad.";

                // Renderizar la página de login nuevamente con los mensajes
                res.render('pages/login', { errorMsg: errorMsg, successMsg: undefined });
            }
        });
    });
});



app.post('/send-email', async function(req, res) {
    var total = req.session.total;
    var email = req.session.user_email;
    var nombreCompleto = req.session.user_complete_name;
    var ordenCompra = req.body.ordenCompra;
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: global.gmail,
            pass: global.gmailPassword
        }
    });
    let mailOptions = {
        from: global.gmail,
        to: email,
        subject: 'Confirmación de orden',
        html: `
            <h1>Estimado(a) ${nombreCompleto},</h1>
            <p>Gracias por su compra en OpticaRois. Adjuntamos los detalles de su orden y los datos de transferencia:</p>
            <h2>Detalles de la orden:</h2>
            <p>Orden de compra: #${ordenCompra}</p>
            <p>El total de su compra es: $${total.toLocaleString("es-CL")}</p>
            <h2>Datos de transferencia:</h2>
            <ul>
                <li>RUT: XX.XXX.XXX-X</li>
                <li>Tipo de cuenta: CUENTA CORRIENTE</li>
                <li>Número de cuenta: 0000123456789</li>
                <li>Banco: BANCO ROIS</li>
                <li>Correo de contacto: opticaroistransferencias@gmail.com</li>
            </ul>
            <p>Una vez recibamos la transferencia, procederemos con el envío de los productos.</p>
            <p>Responda este correo correo con el comprobante y la orden de compra #${ordenCompra}</p>
            <p>Si tiene alguna consulta o necesita ayuda adicional, no dude en ponerse en contacto con nosotros. Estaremos encantados de ayudarle.</p>
            <p>Atentamente,</p>
            <p>OpticaRois</p>
        `
    };
    
    try {
        let info = await transporter.sendMail(mailOptions);
        res.send("Correo enviado exitosamente");
    } catch (error) {
        res.status(500).send("Hubo un error enviando el correo. Verifique su email");
    }
});


app.get('/profile', function(req,res){
    if(req.session.isLoggedIn==true){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"RoisEfficiency"
    });
    query_session = 'SELECT * FROM users WHERE rut="'+req.session.rut+'"';
    con.query(query_session, (err, result) => {
        if (err) throw err;
        res.render('pages/profile', {result: result,isLoggedIn:req.session.isLoggedIn,user_rut:req.session.rut,user_name:req.session.user_name});
      });
    }
    else{
        res.redirect('/');
    }
});

app.post('/edit_profile', function(req, res) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "RoisEfficiency"
    });

    var primer_nombre = req.body.primer_nombre;
    var segundo_nombre = req.body.segundo_nombre;
    var primer_apellido = req.body.primer_apellido;
    var segundo_apellido = req.body.segundo_apellido;
    var rut = req.session.rut;
    var email = req.body.email;
    var direccion = req.body.direccion;
    var current_password = req.body.current_password;
    var repeat_current_password = req.body.repeat_current_password;
    var new_password = req.body.new_password || current_password;

    try {
        con.connect(function(err) {
            if (err) throw err;

            // fetch the existing password and receta from DB
            con.query('SELECT password, receta FROM users WHERE rut="'+rut+'"', function (err, result) {
                if (err) throw err;
                var stored_password = result[0].password;
                var stored_receta = result[0].receta;

                // compare the existing password with the provided current password
                if(stored_password != current_password){
                    const errorMsg = 'La contraseña actual no coincide.';
                    res.render('pages/login', { errorMsg: errorMsg });
                } else if(current_password != repeat_current_password){
                    const errorMsg = 'Las contraseñas proporcionadas no coinciden.';
                    res.render('pages/login', { errorMsg: errorMsg });
                } else {
                    var receta = "";

                    if (req.files){
                        let EDFile = req.files.file;
                        const path = './uploads/' + rut;
                        const newFileName = "receta" + path.extname(EDFile.name);

                        fs.rmSync(path, {recursive: true});

                        fs.mkdir(path, { recursive: true }, (err) => {
                            if (err) throw err;
                        });

                        EDFile.mv(path+"/"+newFileName);
                        receta = path+"/"+newFileName;
                    } else {
                        receta = stored_receta; // keep the existing receta if no new one is provided
                    }

                    var sql = 'UPDATE users SET primer_nombre="'+primer_nombre+'", segundo_nombre="'+segundo_nombre+'", primer_apellido="'+primer_apellido+'", segundo_apellido="'+segundo_apellido+'", email="'+email+'", direccion="'+direccion+'", receta="'+receta+'", password="'+new_password+'" WHERE rut="'+rut+'"';
                    con.query(sql, function (err, result) {
                        if (err) {
                          if (err.code === 'ER_DUP_ENTRY') {
                            const errorMsg = 'ERROR';
                            res.render('pages/login', {errorMsg: errorMsg});
                          } else {
                            throw err;
                          }
                        } else {
                          const successMsg = 'Se han actualizado correctamente los datos.';
                          const errorMsg = undefined;
                          res.render('pages/login', {errorMsg: errorMsg, successMsg:successMsg});
                        }
                    });
                }
            });
        });
    } catch (err) {
        console.error(err);
        const errorMsg=undefined;
        res.render('pages/register', {errorMsg: errorMsg})
    }
});


app.use( express.static( "views" ) );