let presupuesto = 0;
let gastos = [];
let idGasto = 0;

function actualizarPresupuesto(cantidad) {
    let retorno = -1;

    if (cantidad >= 0) {
        presupuesto = cantidad;
        retorno = presupuesto;
    } else {
        console.log('Error: valor negativo');
    }

    return retorno;
}

function mostrarPresupuesto() {
    return `Tu presupuesto actual es de ${presupuesto} €`;
}

function CrearGasto(descripcion, valor, fecha, ...etiquetas) {

    // Métodos
    this.mostrarGasto = function() {
        return `Gasto correspondiente a ${this.descripcion} con valor ${this.valor} €`;
    }

    this.actualizarDescripcion = function(descripcion) {
        this.descripcion = descripcion;
    }

    this.actualizarValor = function(valor) {
        if (valor >= 0) {
            this.valor = valor;
        }
    }

    this.mostrarGastoCompleto = function() {
        let mensaje = "Gasto correspondiente a " + this.descripcion + " con valor " + this.valor + " €.\n"
                    + "Fecha: " + new Date(this.fecha).toLocaleString() + "\n"
                    + "Etiquetas:\n";
        
        for (let etiqueta of this.etiquetas) {
            mensaje += "- " + etiqueta + "\n";
        }

        return mensaje;
    }

    this.actualizarFecha = function(fecha) {
        if (Date.parse(fecha)) {
            this.fecha = Date.parse(fecha);
        }
    }

    this.anyadirEtiquetas = function(...etiquetas) {
        for (let etiqueta of etiquetas) {
            if (!this.etiquetas.includes(etiqueta)) {
                this.etiquetas.push(etiqueta);
            }
        }
    }

    this.borrarEtiquetas = function(...etiquetas) {
        for (let etiqueta of etiquetas) {
            if (this.etiquetas.includes(etiqueta)) {
                this.etiquetas.splice(this.etiquetas.indexOf(etiqueta), 1);
            }
        }
    }

    this.obtenerPeriodoAgrupacion = function(periodo) {
        let periodoAgrupacion = '';

        switch (periodo) {
            case 'anyo':
                periodoAgrupacion = new Date(this.fecha).toISOString().slice(0,4);
                break;

            case 'mes':
                periodoAgrupacion = new Date(this.fecha).toISOString().slice(0, 7);
                break;

            case 'dia':
                periodoAgrupacion = new Date(this.fecha).toISOString().slice(0, 10);
                break;
        }

        return periodoAgrupacion;
    }

    // Propiedades
    this.descripcion = descripcion;
    this.valor = valor >= 0 ? valor : 0;
    this.fecha = Date.parse(fecha) ? Date.parse(fecha) : new Date().getTime();
    this.etiquetas = [];
    this.anyadirEtiquetas(...etiquetas);    // Como se llama a un método del propio constructor dicho método debe encontrarse ANTES de la llamada

}

function listarGastos() {
    return gastos;
}

function anyadirGasto(gasto) {
    gasto.id = idGasto;
    idGasto++;
    gastos.push(gasto);
}

function borrarGasto(idGasto) {
    for (let gasto of gastos) {
        if (gasto.id == idGasto) {
            gastos.splice(gastos.indexOf(gasto), 1);
        }
    }
}

function calcularTotalGastos() {
    let totalGastos = 0;

    for (let gasto of gastos) {
        totalGastos += gasto.valor;
    }

    return totalGastos;
}

function calcularBalance() {
    return presupuesto - calcularTotalGastos();
}

function filtrarGastos(filtro) {

    return gastos.filter(function(gasto) {
        let hayGastos = true;

        if (filtro.fechaDesde) {
            hayGastos = hayGastos && (gasto.fecha >= Date.parse(filtro.fechaDesde));
        }

        if (filtro.fechaHasta) {
            hayGastos = hayGastos && (gasto.fecha <= Date.parse(filtro.fechaHasta));
        }

        if (filtro.valorMinimo) {
            hayGastos = hayGastos && (gasto.valor >= filtro.valorMinimo);
        }

        if (filtro.valorMaximo) {
            hayGastos = hayGastos && (gasto.valor <= filtro.valorMaximo);
        }

        if (filtro.descripcionContiene) {
            hayGastos = hayGastos && (gasto.descripcion.toLowerCase().includes(filtro.descripcionContiene.toLowerCase()));
        }

        if (filtro.etiquetasTiene) {
            let existeEtiqueta = false;

            for (let etiquetaFiltro of filtro.etiquetasTiene) {
                for (let etiquetaGasto of gasto.etiquetas) {
                    if (etiquetaFiltro.toLowerCase() == etiquetaGasto.toLowerCase()) {
                        existeEtiqueta = true;
                    }
                }
            }

            hayGastos = hayGastos && existeEtiqueta;
        }

        return hayGastos;

    });

}

function agruparGastos(periodo = 'mes', etiquetas, fechaDesde, fechaHasta) {

    let gastosFiltrados = filtrarGastos({fechaDesde: fechaDesde, fechaHasta: fechaHasta, etiquetasTiene: etiquetas});

    return gastosFiltrados.reduce(function(gastoTotal, gasto) {

        let periodoAgrupacion = gasto.obtenerPeriodoAgrupacion(periodo);

        gastoTotal[periodoAgrupacion] = gastoTotal[periodoAgrupacion] + gasto.valor || gasto.valor;

        return gastoTotal;
        
    }, {});

}

function transformarListadoEtiquetas(etiquetas) {

    let listadoEtiquetas = new Array();

    if (etiquetas != null) {
        listadoEtiquetas = etiquetas.match(/[^,~\.:;\s]+/g);
    }

    return listadoEtiquetas;
}

function cargarGastos(gastosAlmacenamiento) {
    // gastosAlmacenamiento es un array de objetos "planos"
    // No tienen acceso a los métodos creados con "CrearGasto": "anyadirEtiquetas", "actualizarValor",...
    // Solo tienen guardadas sus propiedades: descripcion, valor, fecha y etiquetas
  
    // Reseteamos la variable global "gastos"
    gastos = [];

    // Procesamos cada gasto del listado pasado a la función
    for (let g of gastosAlmacenamiento) {
        // Creamos un nuevo objeto mediante el constructor
        // Este objeto tiene acceso a los métodos "anyadirEtiquetas", "actualizarValor",...
        // Pero sus propiedades (descripcion, valor, fecha y etiquetas) están sin asignar
        let gastoRehidratado = new CrearGasto();

        // Copiamos los datos del objeto guardado en el almacenamiento
        // al gasto rehidratado
        // https://es.javascript.info/object-copy#cloning-and-merging-object-assign
        Object.assign(gastoRehidratado, g);
        // Ahora "gastoRehidratado" tiene las propiedades del gasto
        // almacenado y además tiene acceso a los métodos de "CrearGasto"
          
        // Añadimos el gasto rehidratado a "gastos"
        gastos.push(gastoRehidratado)
    }
}

// NO MODIFICAR A PARTIR DE AQUÍ: exportación de funciones y objetos creados para poder ejecutar los tests.
// Las funciones y objetos deben tener los nombres que se indican en el enunciado
// Si al obtener el código de una práctica se genera un conflicto, por favor incluye todo el código que aparece aquí debajo
export   {
    mostrarPresupuesto,
    actualizarPresupuesto,
    CrearGasto,
    listarGastos,
    anyadirGasto,
    borrarGasto,
    calcularTotalGastos,
    calcularBalance,
    filtrarGastos,
    agruparGastos,
    transformarListadoEtiquetas,
    cargarGastos
}
