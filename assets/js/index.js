const usuario = document.getElementById("usuario")
const contras = document.getElementById("contra")
const form = document.getElementById("form")
const parrafo = document.getElementById("warnings")

form.addEventListener("submit", e=>{
    e.preventDefault()
    let warnings = ""
    if(usuario.value.lenght < 8){
        warnings += 'El usuario no es valido'
    }
})