<template>
  <div class="map">
    <svg
      ref="svgwrapper"
      :viewBox="`0 0 ${mapData.meta.width} ${mapData.meta.height}`"
      @click="mapClickHandler"
      @mousemove="drag"
    >
      <defs>
        <g id="marker">
          <slot name="marker">
            <path
              d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"
              id="Shape"
              fill="#FF6E6E"
            ></path>
            <circle
              id="elips"
              fill="#FFFFFF"
              fill-rule="nonzero"
              cx="14"
              cy="14"
              r="7"
            ></circle>
          </slot>
        </g>
      </defs>
      <g
        class="map__viewport"
				ref="veiwport"
				transform="matrix(1 0 0 1 0 0)"
				@mousedown="beginDrag"
				@mousewheel="zoom"
      >
        <g>
          <path
            v-for="country in mapData.countries"
            :key="country.id + country.title"
            :class="{ 'map__part--selected': selected == country.id }"
            class="map__part"
            :id="country.id"
            :title="country.title"
            :d="country.d"
          />
        </g>

        <g
          class="map_ui"
          ref="notscale"
          transform="matrix(1 0 0 1 0 0)"
        >
          <g v-for="marker in markerOrder" :key="marker.id + '_1'">
            <use
              :href="`#${marker.svgId || 'marker'}`"
              class="map__marker"
              :data-id="marker.id"
              x="0"
              y="0"
              :transform="`matrix(${1 / scale} 0 0 ${1 / scale} ${marker.x} ${marker.y})`"
              transform-origin="14 36"
              @mouseenter="(e) => mouseEnterHandler(marker.id, e)"
              @mouseleave="(e) => mouseLeaveHandler(marker.id, e)"
            />
          </g>
          <g
            v-for="marker in markerOrder"
            :key="marker.id + '_2'"
            class="map__popup"
            :class="{
              'map__popup--active': selected == marker.id,
              'map__popup--hovered': hovered == marker.id,
            }"
          >
            <!-- popup -->
            <rect
              x="0"
              y="0"
              :transform="`matrix(${1 / scale} 0 0 ${1 / scale} ${Math.max(marker.x + 14 - popupWidth / 2, 1)} ${(marker.y - 45)})`"
              :transform-origin="`${popupWidth/2} 80`"
              :width="popupWidth"
              height="40"
              fill="#fff"
              stroke-width="1"
              stroke="#000"
              rx="8"
              @mouseenter="(e) => mouseEnterHandler(marker.id, e)"
              @mouseleave="(e) => mouseLeaveHandler(marker.id, e)"
            ></rect>
            <!-- <text
            v-if="marker.title"
            text-anchor="middle"
            x="50%"
            :y="marker.y - 25"
          >
            {{marker.title}}
          </text> -->

            <!-- text -->
            <foreignObject
              v-if="marker.title"
              x="0"
              y="0"
              :transform="`matrix(${1 / scale} 0 0 ${1 / scale} ${Math.max(marker.x + 14 - popupWidth / 2, 1)} ${(marker.y - 45)})`"
              :transform-origin="`${popupWidth/2} 80`"
              :width="popupWidth"
              height="40"
              @mouseenter="(e) => mouseEnterHandler(marker.id, e)"
              @mouseleave="(e) => mouseLeaveHandler(marker.id, e)"
            >
              <div class="map__popup-content">
                <slot name="popup" :marker="marker">
                  <div class="map__popup-content--default">
                    {{ marker.title }}
                  </div>
                </slot>
              </div>
            </foreignObject>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import mapData from "../../map.json";
export default {
  name: "support-map",
  props: ["value", "markers"],
  data: () => ({
    selected: "",
    hovered: "",
    popupWidth: 120,
    leaveDelay: 300,
    leaveDelayInterval: -1,
    scale: 1,
    maxScale: 4,
		minScale: 1,
		selectedDrag: null,
    svg: null,
    mapData,
  }),
  methods: {
    mapClickHandler(e) {
      const item = e.target;
      if (item.dataset.id) {
        this.selected = item.getAttribute("data-id");
        this.$emit("input", this.selected);
      }
    },
    mouseEnterHandler(id) {
      this.hovered = id;
      clearInterval(this.leaveDelayInterval);
    },
    mouseLeaveHandler() {
      this.leaveDelayInterval = setInterval(() => {
        this.hovered = "";
      }, this.leaveDelay);
    },
    beginDrag(e){
			e.stopPropagation();
			if(e.target.closest('.map_ui')) return
			let target = e.target;
			if (target.classList.contains('draggable')) {
				this.selectedDrag = target;
			} else {
				this.selectedDrag = this.$refs.veiwport;
			}
			this.selectedDrag.dataset.startMouseX = e.clientX;
			this.selectedDrag.dataset.startMouseY = e.clientY;
		},
		drag(e){
			if (!this.selectedDrag) return;
			e.stopPropagation();
			let startX = parseFloat(this.selectedDrag.dataset.startMouseX),
					startY = parseFloat(this.selectedDrag.dataset.startMouseY),
					dx = (e.clientX - startX),
					dy = (e.clientY - startY);
			if (this.selectedDrag.classList.contains('draggable')) {
					let selectedBox = this.selectedDrag.getBoundingClientRect(),
						boundaryBox = this.selectedDrag.parentElement.getBoundingClientRect();
					if (selectedBox.right + dx > boundaryBox.right) {
						dx = (boundaryBox.right - selectedBox.right);
					} else if (selectedBox.left + dx < boundaryBox.left) {
						dx = (boundaryBox.left - selectedBox.left);
					}
					if (selectedBox.bottom + dy > boundaryBox.bottom) {
						dy = (boundaryBox.bottom - selectedBox.bottom);
					} else if (selectedBox.top + dy < boundaryBox.top) {
						dy = (boundaryBox.top - selectedBox.top);
					}
			}
			let currentMatrix = this.selectedDrag.transform.baseVal.consolidate().matrix,
				newMatrix = currentMatrix.translate(dx / this.scale, dy / this.scale),
				transform = this.svg.createSVGTransformFromMatrix(newMatrix);
			this.selectedDrag.transform.baseVal.initialize(transform);
			this.selectedDrag.dataset.startMouseX = dx + startX;
			this.selectedDrag.dataset.startMouseY = dy + startY;
		},
		endDrag(e){
			e.stopPropagation();
			if (this.selectedDrag) {
				this.selectedDrag = undefined;
			}
		},
		zoom(e) {
			e.stopPropagation();
			e.preventDefault();
			let delta = e.wheelDelta,
					container = this.$refs.veiwport,
					scaleStep = delta > 0 ? 1.25 : 0.8;
			if (this.scale * scaleStep > this.maxScale) {
					scaleStep = this.maxScale / this.scale;
			}
			if (this.scale * scaleStep < this.minScale) {
					scaleStep = this.minScale / this.scale;
			}
			this.scale *= scaleStep;
			let box = this.svg.getBoundingClientRect();
			let point = this.svg.createSVGPoint();
			point.x = e.clientX - box.left;
			point.y = e.clientY - box.top;
			let currentZoomMatrix = container.transform.baseVal[0].matrix;
			point = point.matrixTransform(currentZoomMatrix.inverse());
			let matrix = this.svg.createSVGMatrix()
					.translate(point.x, point.y)
					.scale(scaleStep)
					.translate(-point.x, -point.y);
			let newZoomMatrix = currentZoomMatrix.multiply(matrix);
			container.transform.baseVal.initialize(this.svg.createSVGTransformFromMatrix(newZoomMatrix));
		}
  },
  computed: {
    markerOrder() {
      const tempMarkers = [...this.markers];
      return tempMarkers.sort((a, b) => {
        if (a.id == this.hovered) {
          return 1;
        }
        if (b.id == this.hovered) {
          return -1;
        }
        return 0;
      });
    },
  },
  created() {
    this.selected = this.value ?? this.selected;
  },
  mounted(){
		this.svg = this.$refs.svgwrapper;
		this.$refs.veiwport.setAttribute('transform', `matrix(${this.scale} 0 0 ${this.scale} 0 0)`)
		window.addEventListener('mouseup', this.endDrag);
	},
	beforeUnmount(){
		window.removeEventListener('mouseup', this.endDrag);
	},
  watch: {
    value(newVal) {
      this.selected = newVal;
    },
  },
};
</script>
<style>
.map {
  /* width: 800px;
  height: 600px; */
  /* display: flex; */
  align-items: center;
  justify-content: center;
}
/* .map .vue-pan-zoom-item {
  width: 720px;
} */
/* .map .vue-pan-zoom-scene {
  width: 100%;
} */
.map__marker {
  cursor: pointer;
}
.map__popup {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s linear 300ms, opacity 300ms;
}
.map__popup--hovered,
.map__popup--active {
  visibility: visible;
  opacity: 1;
  transition: visibility 0s linear 0s, opacity 300ms;
}
.map__popup-content {
  height: 100%;
  width: 100%;
}
.map__popup-content--default {
  font-size: 16px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.map svg {
  width: 100%;
  height: 100%;
}
.map__part {
  fill: #c9c9c9;
  transition: fill 0.2s ease;
  stroke: white;
  stroke-opacity: 1;
  stroke-width: 1;
}
.map__part--selected {
  fill: #6755b1;
  stroke: gray;
  stroke-width: 1.5;
}
</style>

