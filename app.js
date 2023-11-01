//Invocar express
const express = require ('express');
const app = express();

//Establecer urlencoded para capturar datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Invocar dotenv para las vistas
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//Directorio publico
app.use('/resources', express.static('assets'));
app.use('/resources', express.static(__dirname + '/assets'))

//Motor de plantillas 
app.set('view engine', 'ejs');
const bcryptjs = require('bcryptjs');

//Variables de sesion
const session = require ('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

//Modulo de conexión con la BD
const connection = require('./database/db');

//Creación de ruta 
app.get ('/', (req, res)=>{
    res.render('login');
})

//Registro Usuarios
app.post('/register', async (req, res)=>{
    const nombre = req.body.nombre;
    const contra = req.body.contra;
    const cedula = req.body.cedula;
    const tipoUsuario = req.body.tipoUsuario;    
    const apto = req.body.apto;     
    let passwordHaash = await bcryptjs.hash(contra,8);
    connection.query('INSERT INTO USUARIOS SET ?',{ id:cedula, nombre:nombre, contra:passwordHaash, tipo:tipoUsuario, numeroApto:apto}, async(error, results)=>{
        if(error){
            res.render('register',{
                login: true,
                alert: true,
                alertTitle: "ERROR",
                alertMessage: "Los datos ingresados son invalidos",
                alertIcon: 'error',
                showConfirmButton: false,
                timer: false,
                ruta: 'register'
            })          
        }else{
            res.render('register',{
                login: true,
                alert: true,
                alertTitle: "Registro",
                alertMessage: "¡Registro exitoso!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'homeAdmin'
            })
        }   
    })   
})

//Registro Vehiculos
app.post('/registerVehi', async (req, res)=>{
    const placa = req.body.placa;
    const tipoVehiculo = req.body.tipoVehiculo;
    const bahia = req.body.bahia;    
    const idUsuario = req.body.idUsuario;     
    connection.query('INSERT INTO VEHICULOS SET ?',{ placa:placa, tipoVehiculo:tipoVehiculo, bahia:bahia, id_usuario:idUsuario}, async(error, results)=>{
        if(error){
            res.render('registerVehi',{
                login: true,
                alert: true,
                alertTitle: "ERROR",
                alertMessage: "Los datos ingresados son invalidos",
                alertIcon: 'error',
                showConfirmButton: false,
                timer: false,
                ruta: 'registerVehi'
            })       
        }else{
            res.render('registerVehi',{
                login: true,
                alert: true,
                alertTitle: "Registro",
                alertMessage: "¡Registro exitoso!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'homeAdmin'
            })
        }   
    })   
})

//Autentificación inicio de sesión
app.post('/auth', async (req, res)=>{
    const usuario = req.body.usuario;
    const contras = req.body.contras;
    const rutaUsua = "";   
    let passwordHaash = await bcryptjs.hash(contras, 8);
    if (usuario && contras){
        connection.query('SELECT * FROM usuarios WHERE id=?', [usuario], async (error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(contras, results[0].contra))){
                res.render('login',{
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña incorrectos",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta: ''
                });
            }else{
                req.session.loggedin = true;
                req.session.nombre = results[0].nombre
                tipoUsuario = results[0].tipo
                switch(tipoUsuario){
                    case "admin":
                        this.rutaUsua="homeAdmin";
                    break;
                    case "vigilante":
                        this.rutaUsua="homeVig";
                    break;
                    case "residente":
                        this.rutaUsua="homeResidente";
                    break;
                }         
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexión Exitosa",
                    alertMessage: "Bienvenid@",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: this.rutaUsua,
                    login: true,
                    nombre: req.session.nombre                   
                });
            }
        })
    }
})

//Verificación id/vehiculo
app.post('/verifyId', async (req, res)=>{
    const identification = req.body.identification;
    if (identification){
        connection.query('SELECT * FROM vehiculos WHERE id_usuario=?', [identification], async (error, results)=>{
            if(results.length == 0 || !(identification == results[0].id_usuario)){
                res.render('homeVig',{
                    alert:true,
                    alertTitle: "Acceso Denegado",
                    alertMessage: "El usuario no se encuentra en la base de datos o no tiene un vehiculo registrado",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    login: true,                    
                    ruta: 'homeVig',
                    nombre: req.session.nombre                                                      
                });
            }else{
                res.render('homeVig', {
                alert:true,
                alertTitle: "Acceso Permitido",
                alertMessage: "USUARIO: " + results[0].id_usuario +" PLACA: " + results[0].placa + " TIPO: " + results[0].tipoVehiculo + " BAHIA: "+ results[0].bahia,
                alertIcon: "success",
                showConfirmButton: true,
                timer: false,
                ruta:'homeVig',
                login: true,
                nombre: req.session.nombre      
                });
            }           
        })
    }
})

//Consulta de datos residente
app.get('/consult', async (req, res)=>{
    const nombre = req.session.nombre;
        connection.query('SELECT * FROM usuarios WHERE nombre=?', [nombre], async (error, results)=>{
                id=results[0].id
                connection.query('SELECT * FROM vehiculos WHERE id_usuario=?', [id], async (error, results)=>{    
                    if(results.length==0){
                        connection.query('SELECT * FROM usuarios WHERE id=?', [id], async (error, results)=>{
                            res.render('homeResidente',{
                                alert:true,
                                alertTitle: "SUS DATOS SON",
                                alertMessage: "USUARIO: " + results[0].id + "NOMBRE: " + results[0].nombre + " APARTAMENTO: " + results[0].numeroApto + " NO CUENTA CON UN VEHICULO ASOCIADO",
                                alertIcon: "info",
                                showConfirmButton: true,
                                timer: false,
                                ruta: 'homeResidente',
                                login: true,
                                nombre: req.session.nombre                               
                            }); 
                        })
                    }else{
                        connection.query('SELECT id,nombre,numeroApto,vehiculos.placa,vehiculos.bahia FROM usuarios FULL JOIN vehiculos WHERE id=?', [id], async (error, results)=>{   
                            res.render('homeResidente', {
                            alert:true,
                            alertTitle: "SUS DATOS SON:",
                            alertMessage: "USUARIO: " + results[0].id + " NOMBRE: " + results[0].nombre + " APARTAMENTO: " + results[0].numeroApto + " PLACA: " + results[0].placa + " BAHIA: " + results[0].bahia,
                            alertIcon: "info",
                            showConfirmButton: true,
                            timer: false,
                            ruta:'homeResidente',
                            login: true,
                            nombre: req.session.nombre      
                            });
                        })                      
                    }          
            })       
        })
})

//Autentificación y creación de las páginas
app.get('/homeAdmin', (req, res)=>{
    if(req.session.loggedin){
        res.render('homeAdmin',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('homeAdmin',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

app.get('/homeVig', (req, res)=>{
    if(req.session.loggedin){
        res.render('homeVig',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('homeVig',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

app.get('/homeResidente', (req, res)=>{
    if(req.session.loggedin){
        res.render('homeResidente',{
            login: true,
            nombre: req.session.nombre,
        });
    }else{{
        res.render('homeResidente',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})


app.get('/register', (req, res)=>{
    if(req.session.loggedin){
        res.render('register',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('register',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

app.get('/registerVehi', (req, res)=>{
    if(req.session.loggedin){
        res.render('registerVehi',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('registerVehi',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

app.get('/report', (req, res)=>{
    if(req.session.loggedin){
        res.render('report',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('report',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

//Logout
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

//Ejecutar aplicación en localhost
app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})