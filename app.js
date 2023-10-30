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

//Creación de rutas
app.get ('/', (req, res)=>{
    res.render('login');
})


//Registro
app.post('/register', async (req, res)=>{
    const nombre = req.body.nombre;
    const contra = req.body.contra;
    const cedula = req.body.cedula;
    const tipoUsuario = req.body.tipoUsuario;    
    const apto = req.body.apto;     
    let passwordHaash = await bcryptjs.hash(contra,8);
    connection.query('INSERT INTO USUARIOS SET ?',{ id:cedula, nombre:nombre, contra:passwordHaash, tipo:tipoUsuario, numeroApto:apto}, async(error, results)=>{
        if(error){
            console.log(error);           
        }else{
            res.render('register',{
                alert: true,
                alertTitle: "Registro",
                alertMessage: "¡Registro exitoso!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'home'
            })
        }   
    })   
})

//Autentificación inicio de sesión
app.post('/auth', async (req, res)=>{
    const usuario = req.body.usuario;
    const contras = req.body.contras;
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
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexión Exitosa",
                    alertMessage: "Bienvenid@",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta:'home'
                });
            }
        })
    }
})

//Autentificación en las páginas
app.get('/home', (req, res)=>{
    if(req.session.loggedin){
        res.render('home',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('home',{
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