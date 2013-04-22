$().ready(function() {
	vista = new VistaPrincipal({el:"#mainchart"});
});

// VistaPrincipal
// ===================
// Vista principal con datos de ...
//
var VistaPrincipal = Backbone.View.extend({	
	initialize: function() {
		_.bindAll(this,"render")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 40},
    	this.width = 800 - this.margin.left - this.margin.right,
    	this.height = 500 - this.margin.top - this.margin.bottom;

    	this.bubbleMinSize = 2;
    	this.bubbleMaxSize = 15

    	this.title = "Plantilla de prueba"

    	this.attrX = "pregrado2012";
    	this.attrID = "ID";
    	this.attrY = "titulados2011";
    	this.attrSize = "pregrado2012";
    	this.attrColor = "acreditacion"

    	this.labels = {
    		pregrado2012: "Matrícula Pregrado 2012",
    		pregrado2010: "Matrícula Pregrado 2010",
    		pregrado2009: "Matrícula Pregrado 2009",
    		titulados2011: "Titulados 2011"
    	}


		// Vista con tooltip para mostrar ficha de establecimiento
		this.tooltip = new VistaToolTip();
		this.tooltip.message = function (data) {
			return data.nombre;
		}
 
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/matriculaEdSup.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
		});
	},

	drawChart: function() {
		var self = this;

		// Calcula el dominio de las escalas en base al valor de los datos que van en ejes 
		// x (psu Lenguaje) e y (financiamiento)
		this.xScale.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrX])})).nice();
		this.yScale.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrY])})).nice();

		// Escala para calcular el radio de cada circulo
		this.radious = d3.scale.sqrt()
			.range([2, 15])
			.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrSize])}));

		// Crea Ejes para X e Y
		this.ejes.labelX = this.labels[this.attrX];
		this.ejes.labelY = this.labels[this.attrY];

		this.ejes.redraw();

		// Generar una nueva asociación entre datos y "circles"
		this.nodes = this.svg.selectAll("circle")
			.data(this.data, function(d) {return d[self.attrID]});

		// Nodos que ya no deben existir (hay menos datos que nodos)
		this.nodes.exit()
			.remove();

		// Nuevos nodos a crear (hay más datos que nodos)
		this.nodes.enter()
			.append("circle")
			.attr("opacity", 0.8)
			.on("mouseover", function(d) {
				pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY};
				self.tooltip.show(d, pos);
				})
			.on("mouseout", function(d) {self.tooltip.hide()})

		// Actualización de los nodos existentes
		this.nodes
			.transition()
			.duration(1000)
			.attr("cx", function(d) {return self.xScale(d[self.attrX])})
			.attr("cy", function(d) {return self.yScale(d[self.attrY])})
			.attr("r", function(d) {return self.radious(d[self.attrSize])})
			.attr("fill", function(d) {return self.color(d[self.attrColor])})
	},


	render: function() {
		var self = this; // Para hacer referencia a "this" en callback functions

		// Cambia título en página HTML
		d3.select("h3.title").text(this.title);

		// Genera elemento SVG contenedor principal de gráficos
		this.svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		// Selector JQuery del contenedor SVG
		this.$svg = $(this.svg[0]);  

		// Genera escalas utilizadas en gráfico X/Y
		this.xScale = d3.scale.sqrt()
    		.range([0, this.width]);

		this.yScale = d3.scale.sqrt()
    		.range([this.height, 0]);

		// Calcula el dominio de las escalas en base al valor de los datos que van en ejes 
		// x (psu Lenguaje) e y (financiamiento)
		this.xScale.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrX])})).nice();
		this.yScale.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrY]) })).nice();

		// Escala para calcular el radio de cada circulo
		this.radious = d3.scale.sqrt()
			.range([this.bubbleMinSize, this.bubbleMaxSize])
			.domain(d3.extent(this.data, function(d) { return parseInt(d[self.attrColor])}));

		this.color = d3.scale.category10();

		// Crea Ejes para X e Y
		this.ejes = new VistaEjesXY({
			svg: this.svg,
			x:this.xScale, y:this.yScale, 
			height: this.height, width: this.width, 
			labelX: this.labels[this.attrX],labelY: this.labels[this.attrY]
		});


		// Dibuja los elementos del gráfico
		this.drawChart();

		// Construye la leyenda
		this.legend = new VistaLeyendaSVG({
			svg : this.svg, 	// Elemento SVG en el cual se ubica la leyenda
			scale : this.color, // Escala ordinal con colores (range) para un dominio (domain)
			left: this.width, 	// Ubicacción horizontal del extremo DERECHO de la leyenda
			top:30});			// Ubicación vertical del extremo superior d ela leyenda

		this.$svg.append(this.legend.render().el);


		// Botón de prueba para ver cambios
		var $button = $("<button>Test</button>")
			.on("click", function() {
				//self.data = _.filter(self.data, function(d,i) {return d[self.attrY]>1000});
				self.attrX = self.attrX == "pregrado2012" ? "pregrado2009" : "pregrado2012"
				self.drawChart();
			});
		$("body").prepend($button)

	}

});


