import tpl from '../html/AggrMatrixColormap.html'
import * as d3 from 'd3'
import 'd3-selection-multi'
import Color from './color'
import { timeHours } from 'd3-time'

export default {
    template: tpl,
    name: 'AggrMatrixColormap',
    components: {
    },

    props: [
    ],

    data: () => ({
        width: 200,
        height: 20,
        colorScaleHeight: 30,
        colorMin: 0,
        colorMax: 0,
        padding: {
            bottom: 30,
            right: 5,
            left: 25,
        },
        color: null,
        colorMap: null,
        colorMin: 0,
        colorMax: 0,
        id: ''
    }),

    watch: {

    },

    mounted() { },

    methods: {
        init() {
            this.color = new Color('AggrMatrix')
            this.colorMap = this.color.getAllColors()
            this.id = 'AggrMatrixColormap'
            let dashboardHeight = document.getElementById('dashboard').clientHeight
            let toolbarHeight = document.getElementById('toolbar').clientHeight
            this.chipContainerHeight = document.getElementById('chip-container').clientHeight
            this.containerHeight = (dashboardHeight - toolbarHeight - this.chipContainerHeight) / 3
            this.containerWidth = this.containerHeight
            this.paddingLeft = (this.containerWidth - this.width)/4
            
            this.scaleG = d3.select('#' + this.id)
                .attrs({
                    'id': this.id, 
                    "width": this.containerWidth,
                    "height": this.height*2
                })
        },

        render(colorMin, colorMax) {
            this.colorMin = colorMin
            this.colorMax = colorMax
            this.innerHTMLText = [colorMin, colorMax];
            this.colorMap = this.$store.colorMap
            this.selectedColorMap = 'Reds'
            this.colorPoint = 5
            this.color.setColorScale(this.colorMin, this.colorMax, this.selectedColorMap, this.colorPoint)
            
            let splits = 5
            let color = this.color.getScale()

            for (let i = 0; i <= splits; i += 1) {
                let splitColor = this.colorMin + ((i * this.colorMax) / (splits))
                this.scaleG.append('rect')
                    .attrs({
                        'width': this.width / (splits + 1),
                        'height': this.height,
                        'x': i * (this.width / (splits + 1)),
                        'y': this.padding.bottom,
                        'class': 'aggr-colormap-rect',
                        'transform': `translate(${this.paddingLeft}, ${0})`,
                        'fill': d3.interpolateReds(splitColor/this.colorMax)
                    })
            }
            
            // Text
            this.scaleG.append("text")
                .style("fill", "black")
                .style("font-size", "14px")
                .attrs({
                    "dy": ".35em",
                    "text-anchor": "middle",
                    'class': 'aggr-colormap-text',
                    'transform': `translate(${this.padding.right + this.paddingLeft}, ${this.padding.bottom})`,
                })
                .text(this.colorMin);

            this.scaleG.append("text")

            .style("fill", "black")
                .style("font-size", "14px")
                .attrs({
                    "dy": ".35em",
                    "text-anchor": "middle",
                    "class": "aggr-colormap-text",
                    'transform': `translate(${this.width - this.padding.left + this.paddingLeft}, ${this.padding.bottom})`,
                })
                .text(this.colorMax);
        },

        clear() {
            d3.selectAll('.aggr-colormap-text').remove()
            d3.selectAll('.aggr-colormap-rect').remove()
        },
    }
}