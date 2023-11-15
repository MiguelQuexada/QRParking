//Invocar express
const express = require ('express');
const app = express();

//Establecer constantes de tiempo
var diffMs = 0;
var totalMinutes = 0;
var days = 0;
var hours = 0;
var minutes = 0;
var price = 0;
var horaFinal = new Date();
var horaInicio = new Date();
let pagoPend = 0;

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
    var tipoUsuario;
    var rutaUsua = "";  
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
                        connection.query('SELECT * FROM pago WHERE id_usuario=?', [usuario], async (error, results)=>{  
                            if(results[0].pagoPendiente>0 ){
                                this.pagoPend = parseInt(results[0].pagoPendiente); 
                                this.rutaUsua=" ";                                     
                            }                                                       
                            else{
                                this.rutaUsua="homeResidente";                        
                            }
                        })
                    break;
                }
                if(this.pagoPend>0 ){
                    res.render('login',{
                        alert:true,
                        alertTitle: "Acceso denegado",
                        alertMessage: "El usuario tiene pagos pendientes",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: false,
                        ruta: this.rutaUsua                                
                    });                 
                }
                else{
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

            }
        })
    }
})

//Verificación id/vehiculo 
app.post('/verifyIdVig', async (req, res)=>{
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

app.post('/verifyId', async (req, res)=>{
    const identification = req.body.identification;
    if (identification){
        connection.query('SELECT * FROM vehiculos WHERE id_usuario=?', [identification], async (error, results)=>{
            if(results.length == 0 || !(identification == results[0].id_usuario)){
                connection.query('SELECT * FROM usuarios  WHERE id=?', [identification], async (error, results)=>{ 
                    if(results.length == 0 || !(identification == results[0].id)){                                 
                        res.render('verify',{                 
                            alert:true,
                            alertTitle: "Usuario no encontrado",
                            alertMessage: "El usuario no se encuentra en la base de datos",
                            alertIcon: "error",
                            showConfirmButton: true,
                            timer: false,
                            login: true,                    
                            ruta: 'verify',
                            nombre: req.session.nombre     
                        });
                    }else{
                        res.render('verify', {
                            alert:true,
                            alertTitle: "Usuario Registrado",
                            alertMessage: "USUARIO: " + results[0].id +" El usuario no tiene vehiculo asociado",
                            alertIcon: "success",
                            showConfirmButton: true,
                            timer: false,
                            ruta:'verify',
                            login: true,
                            nombre: req.session.nombre      
                            });                        
                    };               
                })
            }else{
                res.render('verify', {
                alert:true,
                alertTitle: "Usuario Registrado",
                alertMessage: "USUARIO: " + results[0].id_usuario +" PLACA: " + results[0].placa + " TIPO: " + results[0].tipoVehiculo + " BAHIA: "+ results[0].bahia,
                alertIcon: "success",
                showConfirmButton: true,
                timer: false,
                ruta:'verify',
                login: true,
                nombre: req.session.nombre      
                });
            }           
        })
    }
})

//Ingreso/Salida de Visitantes
app.post('/visitors', async (req, res)=>{
    const accion = req.body.accion;
    const idVisit = req.body.idVisit;    
    const nombre = req.body.nombre;
    const idResidente = req.body.idResidente; 

    if(accion=="ingresar"){
        horaInicio = new Date(); 
        horaInicio = horaInicio.getTime();      
        connection.query('INSERT INTO visitantes SET ?',{ idVisit:idVisit, nombreVis:nombre, horaIni:horaInicio,id_usuario:idResidente}, async(error, results)=>{
            if(error){
                res.render('verifyVisit',{
                    login: true,
                    alert: true,
                    alertTitle: "ERROR",
                    alertMessage: "Los datos ingresados son invalidos",
                    alertIcon: 'error',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'verifyVisit'
                })          
            }else{
                res.render('verifyVisit',{
                    login: true,
                    alert: true,
                    alertTitle: "¡Registro exitoso!",
                    alertMessage: "Bienvenido",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'verifyVisit'
                })
            }   
        }) 
    }
    if(accion=="salir"){      
        connection.query('SELECT * FROM visitantes WHERE idVisit='+ [idVisit], async (error, results)=>{            
            if(error){
                res.render('verifyVisit',{
                    login: true,
                    alert: true,
                    alertTitle: "ERROR",
                    alertMessage: "Los datos ingresados son invalidos",
                    alertIcon: 'error',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'verifyVisit'
                })        
            }else{
                connection.query('SELECT * FROM visitantes WHERE idVisit='+ [idVisit], async (error, results)=>{   
                    horaFinal = new Date();
                    horaFinal = horaFinal.getTime();
                    horaInicio = results[0].horaIni;
                connection.query('UPDATE visitantes SET ? WHERE idVisit='+[idVisit], {horaFin:horaFinal}, async(error, results)=>{ 
                    diffMs=Math.abs(horaFinal-horaInicio);
                    totalMinutes = Math.floor(diffMs / (1000 * 60));
                    days = Math.floor(totalMinutes / (24 *  60));
                    hours = Math.floor((totalMinutes - (days * 24 * 60)) / 60);
                    minutes = totalMinutes - (days * 24 * 60) - (hours * 60);  
                    price = (minutes * 10) + (hours * 300);  
                    res.render('verifyVisit',{
                        login: true,
                        alert: true,
                        alertTitle: "¡Validación Exitosa!",
                        alertMessage: "El monto a pagar es: $"+ price,
                        alertIcon: 'success',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'verifyVisit'
                    })
                })
                })
            }  
        })
    }
    
    
})

//Envio de reportes
app.post('/report', async(req,res)=>{
    const nombre = req.session.nombre;
    const descrip = req.body.descrip;
    var qs = require("querystring");
    var http = require("https");
  
    connection.query('SELECT usuarios.nombre, usuarios.id, vehiculos.bahia FROM usuarios LEFT JOIN vehiculos ON vehiculos.id_usuario = usuarios.id  WHERE usuarios.nombre=?', [nombre], async (error, results)=>{   
        const bahiaReport = results[0].bahia;
    var options = {
      "method": "POST",
      "hostname": "api.ultramsg.com",
      "port": null,
      "path": "/instance68319/messages/chat",
      "headers": {
        "content-type": "application/x-www-form-urlencoded"
      }
    };
    
    var req = http.request(options, function (res) {
      var chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
    
      res.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
      });
    });


    var postData = qs.stringify({
        "token": "u9l24us7wc7ascvz",
        "to": "+573165514014",
        "body": "R E P O R T E  H O R U S \n El usuario " + nombre + " presenta un inconveniente \nBahia del usuario: " + bahiaReport + " \n Mensaje:  " + descrip 
    });

    req.write(postData);
    req.end();    
    })
    res.render('report', {
        alert:true,
        alertTitle: "Reporte enviado",
        alertMessage: "Su reporte ha sido enviado correctamente",
        alertIcon: "info",
        showConfirmButton: true,
        timer: false,
        ruta:'report',
        login: true,
        nombre: req.session.nombre      
        });   
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

app.get('/verify', (req, res)=>{
    if(req.session.loggedin){
        res.render('verify',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('verify',{
            login: false,
            nombre: 'ACCESO DENEGADO'
        })
    }}
})

app.get('/verifyVisit', (req, res)=>{
    if(req.session.loggedin){
        res.render('verifyVisit',{
            login: true,
            nombre: req.session.nombre
        });
    }else{{
        res.render('verifyVisit',{
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