<template>
  <div class="map">
    <div style="position: absolute; right: 25px; top: 13px">
      <button class="map__button" @click="(e) => zoom(e, 1)">
        +
      </button>
      <button class="map__button" @click="(e) => zoom(e, -1)">
        -
      </button>
    </div>

    <svg
      ref="svgwrapper"
      :viewBox="`0 0 ${mapData.meta.width} ${mapData.meta.height}`"
      @click="mapClickHandler"
      @mousemove="drag"
      @mousedown="beginDrag"
      @mousewheel="zoom"
    >
      <defs>
        <g id="marker">
          <slot name="marker">
            <path
              d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"
              id="Shape"
              fill="#FF6E6E"
              style="fill: inherit"
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
				ref="viewport"
				transform="matrix(1 0 0 1 0 0)"
      >
        <g>
          <path
            v-for="country in mapData.countries"
            :key="country.id + country.title"
            :style="{ fill: (selected.split(' ').at(-1).split('-').includes(country.id)) ? (mapActiveColor ?? 'var(--main)') : null }"
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
              x="0"
              y="0"
              class="map__marker"
              :style="{ fill: (selected == marker.id) ? (markerActiveColor ?? 'var(--success)') : (markerColor ?? 'var(--err)') }"
              :href="`#${marker.svgId || 'marker'}`"
              :data-id="marker.id"
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
            :class="{ 'map__popup--hovered': hovered == marker.id }"
          >
            <!-- popup -->
            <rect
              x="0"
              y="0"
              :transform="`matrix(${1 / scale} 0 0 ${1 / scale} ${Math.max(marker.x + 14 - popupWidth[marker.id] / 2, 1)} ${(marker.y - 45)})`"
              :transform-origin="`${popupWidth[marker.id]/2} 80`"
              :width="popupWidth[marker.id]"
              height="40"
              fill="#fff"
              stroke-width="1"
              stroke="#000"
              rx="8"
              @mouseenter="(e) => mouseEnterHandler(marker.id, e)"
              @mouseleave="(e) => mouseLeaveHandler(marker.id, e)"
            ></rect>

            <!-- text -->
            <foreignObject
              v-if="marker.title"
              x="0"
              y="0"
              :transform="`matrix(${1 / scale} 0 0 ${1 / scale} ${Math.max(marker.x + 14 - popupWidth[marker.id] / 2, 1)} ${(marker.y - 45)})`"
              :transform-origin="`${popupWidth[marker.id]/2} 80`"
              :width="popupWidth[marker.id]"
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
import mapData from "@/map.json";

export default {
  name: "support-map",
  props: ["value", "markers", "map-active-color", "marker-active-color", "marker-color"],
  data: () => ({
    selected: "",
    hovered: "",
    popupWidth: {},
    leaveDelay: 300,
    leaveDelayInterval: -1,
    scale: 1,
    maxScale: 6,
		minScale: 1,
		selectedDrag: null,
    svg: null,
    mapData,
  }),
  methods: {
    mapClickHandler({ target }) {
      if (target.dataset.id) {
        this.selected = target.getAttribute("data-id");
        this.$emit("input", this.selected);
      }
    },
    mouseEnterHandler(id) {
      this.hovered = id;
      this.$emit("pinHover", id.substring(0, id.indexOf("_")));
      clearInterval(this.leaveDelayInterval);
    },
    mouseLeaveHandler() {
      this.leaveDelayInterval = setInterval(() => {
        this.hovered = "";
      }, this.leaveDelay);
    },
    beginDrag(e) {
			e.stopPropagation();
			if(e.target.closest('.map_ui')) return
			let target = e.target;
			if (target.classList.contains('draggable')) {
				this.selectedDrag = target;
			} else {
				this.selectedDrag = this.$refs.viewport;
			}
			this.selectedDrag.dataset.startMouseX = e.clientX;
			this.selectedDrag.dataset.startMouseY = e.clientY;
		},
		drag(e) {
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
		endDrag(e) {
			e.stopPropagation();
			if (this.selectedDrag) {
				this.selectedDrag = undefined;
			}
		},
		zoom(e, delta) {
			e.stopPropagation();
			e.preventDefault();

			const container = this.$refs.viewport;
			let scaleStep = (delta || e.wheelDelta) > 0 ? 1.25 : 0.8;

			if (this.scale * scaleStep > this.maxScale) {
        scaleStep = this.maxScale / this.scale;
			}
			if (this.scale * scaleStep < this.minScale) {
        scaleStep = this.minScale / this.scale;
			}

			const box = this.svg.getBoundingClientRect();
			let point = this.svg.createSVGPoint();

			this.scale *= scaleStep;
			point.x = (delta) ? box.x / 2 + box.left : e.clientX - box.left;
			point.y = (delta) ? box.y / 2 + box.top : e.clientY - box.top;

			const currentZoomMatrix = container.transform.baseVal[0].matrix;
			point = point.matrixTransform(currentZoomMatrix.inverse());
			const matrix = this.svg.createSVGMatrix()
					.translate(point.x, point.y)
					.scale(scaleStep)
					.translate(-point.x, -point.y);
			const newZoomMatrix = currentZoomMatrix.multiply(matrix);

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

    if (this.markers.length === 1) {
      this.$emit('input', this.markers[0].id);
    }

    this.markers.forEach(({ id, title }) => {
      this.popupWidth[id] = title.length * 10 + 15;
    });
  },
  mounted() {
    const container = this.$refs.viewport;
    const min = { x: Infinity, y: Infinity };
    const max = { x: -Infinity, y: -Infinity };
    let x, y, right = 0, down = 0

    this.markers.forEach(({ x, y }) => {
      if (min.x > x) min.x = x;
      if (min.y > y) min.y = y;
      if (max.x < x) max.x = x;
      if (max.y < y) max.y = y;
    });

    const xScale = mapData.meta.width / (max.x - min.x + 70);
    const yScale = mapData.meta.height / (max.y - min.y + 70);

    this.scale = Math.min(xScale, yScale);
    if (this.scale > this.maxScale) this.scale = this.maxScale;
    if (xScale > yScale) right = 20 * xScale;
    if (yScale > xScale) down = 20 * yScale;

    x = (min.x - 20) * this.scale - right;
    y = (min.y - 10) * this.scale - down;

    if (this.markers.length < 2) {
      const { width, height } = mapData.meta;

      this.scale = this.maxScale;
      x = (this.markers[0].x * this.scale - width / 2) + 70;
      y = (this.markers[0].y * this.scale - height / 2) + 140;
    }

		this.svg = this.$refs.svgwrapper;
		container.setAttribute('transform', `matrix(${this.scale} 0 0 ${this.scale} ${-x} ${-y})`);
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
  position: relative;
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
  text-align: center;
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

.map__button {
  padding: 0 15px;
  font-size: 20px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
}

.map__button:not(:last-child) {
  margin-right: 5px;
}
</style>
