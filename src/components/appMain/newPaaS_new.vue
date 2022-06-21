<template>
  <div class="newCloud_wrapper">
    <template>
      <template>
        <div class="newCloud" v-if="!isPlansLoading">
          <div class="newCloud__inputs field">
            <div style="display: none">{{ product }}</div>
            <a-collapse
              v-model="activeKey"
              accordion
              :style="{ 'border-radius': '20px' }"
            >
              <a-collapse-panel
                key="location"
                :header="
                  $t('Location:') +
                  (itemSP == undefined ? ' ' : ' (' + itemSP.title + ')')
                "
              >
                <a-row justify="space-between" style="margin-bottom: 10px">
                  <a-alert
                    message="Please select a suitable location"
                    type="warning"
                    show-icon
                    style="margin-bottom: 30px"
                  />
                  <a-radio-group v-model="location_uuid">
                    <a-radio-button
                      v-for="(sp, index) in getSP"
                      :key="index"
                      style="width: 130px; text-align: center"
                      :value="sp.uuid"
                    >
                      {{ sp.title }}
                    </a-radio-button>
                  </a-radio-group>
                </a-row>
              </a-collapse-panel>

              <a-collapse-panel
                key="plan"
                header="Plan:"
                :disabled="itemSP ? false : true"
              >
                <a-row
                  type="flex"
                  justify="space-between"
                  align="middle"
                  style="margin-top: 12px"
                >
                  <a-radio-group default-value="kind" v-model="tarification">
                    <a-radio-button
                      v-for="(pl, index) in getPlans"
                      :key="index"
                      style="width: 180px; text-align: center"
                      :value="pl.kind"
                    >
                      <a-tooltip placement="top">
                        <template slot="title" v-if="pl.kind == 'STATIC'">
                          Pre-Paid VDS
                        </template>
                        <template slot="title" v-else>
                          VDC (Pay-as-you-Go)</template
                        >
                        <span style="display: block">{{ pl.title }}</span>
                      </a-tooltip>
                    </a-radio-button>

                    <!-- <a-col
                      :xs="12"
                      :sm="18"
                      :lg="12"
                      style="margin-top: 20px; margin-bottom: 30px"
                      v-if="tarification == 'STATIC'"
                    >
                      <a-row type="flex" justify="space-between" align="middle">
                        <a-col> {{ $t("Payment period") }}: </a-col>
                        <a-col :lg="17">
                          <a-select
                            v-model="options.period"
                            style="width: 100%"
                          >
                            <a-select-option
                              v-for="period in periods"
                              :key="period.title + period.count"
                              :value="period.count"
                            >
                              {{ period.title == "year" ? "1 " : ""
                              }}{{ $tc(period.title, period.count) }}
                            </a-select-option>
                          </a-select>
                        </a-col>
                      </a-row>
                    </a-col> -->
                  </a-radio-group>
                </a-row>

                <a-slider
                  style="margin-top: 30px"
                  v-if="getPlan.kind === 'STATIC'"
                  :marks="{ ...getProducts }"
                  :tip-formatter="null"
                  :max="getProducts.length - 1"
                  :min="0"
                  :value="getProducts.indexOf(productSize)"
                  @change="(newval) => (productSize = getProducts[newval])"
                >
                </a-slider>
                <div
                  class="vdc_plan"
                  v-if="getPlan.kind === 'UNKNOWN'"
                  style="margin-top: 30px"
                >
                  <div
                    v-for="resource in getPlan.resources"
                    :key="resource.key"
                  >
                    <a-row
                      type="flex"
                      justify="space-between"
                      align="middle"
                      class="newCloud__prop"
                      style="margin-top: 20px"
                    >
                      <a-col>
                        <div v-if="resource.key == 'cpu'">
                          <span style="text-transform: uppercase"
                            >{{ resource.key }}
                          </span>
                          (vCPU):
                        </div>

                        <div v-if="resource.key == 'ram'">
                          <span style="text-transform: uppercase"
                            >{{ resource.key }}
                          </span>
                          (Gb):
                        </div>
                        <span
                          style="text-transform: uppercase"
                          v-if="resource.key == 'ip'"
                          >{{ resource.key }}:
                        </span>
                      </a-col>

                      <a-col style="width: 130px">
                        <a-row>
                          <a-col>
                            <a-row
                              type="flex"
                              justify="space-between"
                              align="middle"
                            >
                              <a-col>
                                <a-button
                                  type="link"
                                  icon="minus"
                                  @click="changeValueMinus(`${resource.key}`)"
                                >
                                </a-button>
                              </a-col>
                              <a-col v-if="resource.key === 'cpu'">
                                <a-input-number
                                  style="width: 60px"
                                  v-model="options.cpu.size"
                                  class="max-width"
                                  :min="options.cpu.min"
                                  :max="options.cpu.max"
                                  default-value="1"
                                />
                              </a-col>

                              <a-col v-if="resource.key === 'ram'">
                                <a-input-number
                                  style="width: 60px"
                                  v-model="options.ram.size"
                                  class="max-width"
                                  :min="options.ram.min"
                                  :max="options.ram.max"
                                  default-value="1"
                                />
                              </a-col>

                              <a-col v-if="resource.key === 'ip'">
                                <a-input-number
                                  style="width: 60px"
                                  v-model="options.network.public.count"
                                  class="max-width"
                                  :min="options.network.public.min"
                                  :max="options.network.public.max"
                                  default-value="1"
                                />
                              </a-col>

                              <a-col>
                                <!-- <a-input-number
                                  style="width: 60px"
                                  v-model="options.disk.size"
                                  class="max-width"
                                  :min="options.disk.min"
                                  :max="options.disk.max"
                                  default-value="1"
                                /> -->
                              </a-col>
                              <a-col>
                                <a-button
                                  icon="plus"
                                  type="link"
                                  @click="changeValuePlus(`${resource.key}`)"
                                >
                                </a-button>
                              </a-col>
                            </a-row>
                          </a-col>
                        </a-row>
                      </a-col>
                      <!-- </transition> -->
                    </a-row>
                  </div>
                </div>

                <!-- <a-skeleton :loading="getCurrentProd == null" :active="true"> -->
                <div v-if="getPlan.kind === 'STATIC'">
                  <a-row
                    type="flex"
                    justify="space-between"
                    align="middle"
                    class="newCloud__prop"
                    style="margin-top: 50px"
                  >
                    <a-col>
                      <span style="display: inline-block; width: 70px"
                        >CPU:</span
                      >
                    </a-col>
                    <a-col
                      class="changing__field"
                      span="6"
                      style="text-align: right"
                    >
                      {{ options.cpu.size }} vCPU
                    </a-col>
                  </a-row>
                  <a-row
                    type="flex"
                    justify="space-between"
                    align="middle"
                    class="newCloud__prop"
                  >
                    <a-col>
                      <span style="display: inline-block; width: 70px"
                        >RAM:</span
                      >
                    </a-col>
                    <transition name="textchange" mode="out-in">
                      <!-- :key="
                          getCurrentProd != null
                            ? getCurrentProd.props.ram.TITLE
                            : 'DefaultKeyForRAM'
                        " -->
                      <a-col
                        class="changing__field"
                        span="6"
                        style="text-align: right"
                      >
                        {{ options.ram.size }}
                        Gb
                      </a-col>
                    </transition>
                  </a-row>
                  <a-row class="newCloud__prop">
                    <a-col span="8" :xs="6">
                      <span style="display: inline-block; width: 70px"
                        >{{ $t("Drive") }}:</span
                      >
                    </a-col>
                    <a-col :xs="10" :sm="14">
                      <a-switch v-model="options.drive" style="width: 60px">
                        <span slot="checkedChildren">SSD</span>
                        <span slot="unCheckedChildren">HDD</span>
                      </a-switch>
                    </a-col>
                    <a-col
                      class="changing__field"
                      span="4"
                      style="text-align: right"
                    >
                      {{ options.disk.size }} Gb
                    </a-col>
                  </a-row>
                </div>
                <!-- <a-row class="newCloud__prop">
                    <a-col span="8" :xs="6"
                      >{{ $t("traffic") | capitalize }}:</a-col
                    >
                    <a-col span="16" :xs="18">
                      <a-select
                        default-value="-1"
                        style="width: 100%"
                        @change="(newdata) => setAddon('traffic', +newdata)"
                      >
                        <a-select-option value="-1">{{
                          $t("under 3 Gb per month") | capitalize
                        }}</a-select-option>
                        <a-select-option
                          v-for="group in getAddons.traffic"
                          :key="group.id"
                        >
                          {{
                            $t(
                              `newPaaSTrafficItem.${group.description.TITLE.replace(
                                "Безлимитный, скорость канала не менее",
                                "Безлимит, от "
                              )}`
                            )
                          }}
                        </a-select-option>
                      </a-select>
                    </a-col>
                  </a-row> -->
                <!-- </a-skeleton> -->
              </a-collapse-panel>

              <!-- OS -->
              <a-collapse-panel
                :disabled="itemSP ? false : true"
                key="OS"
                :header="
                  $t('OS') +
                  (options.os.name == '' ? ':' : ' (' + options.os.name + '):')
                "
              >
                <div class="newCloud__option-field">
                  <div class="newCloud__template" v-if="this.itemSP">
                    <div
                      v-for="(item, index) in this.itemSP.publicData.templates"
                      class="newCloud__template-item"
                      :key="index"
                      :class="{ active: options.os.name == item.name }"
                    >
                      <template v-if="item.warning">
                        <div class="newCloud__template-image">
                          <img
                            :src="`/img/OS/${item.name}.png`"
                            :alt="item.desc"
                          />
                        </div>
                        <div class="newCloud__template-name">
                          {{ item.name }}
                        </div>
                      </template>
                      <template v-else>
                        <div class="newCloud__template-image">
                          <img
                            :src="`/img/OS/${item.name}.png`"
                            :alt="item.desc"
                            @click="setOS(item, index)"
                          />
                        </div>
                        <div class="newCloud__template-name">
                          {{ item.desc }}
                        </div>
                      </template>
                    </div>
                  </div>
                  <a-row class="newCloud__prop">
                    <a-col :xs="12" :sm="10" style="margin-top: 10px">
                      <!-- <a-form-model-item> -->
                      <a-input
                        @focus="focused = true"
                        class="password"
                        :class="{ invalid: textInvalid }"
                        v-model="password"
                        placeholder="Password"
                      />
                      <span style="color: red">{{ textInvalid }}</span>
                      <!-- </a-form-model-item> -->
                      <!-- <a-form-model-item> -->
                      <a-input
                        style="margin-top: 10px"
                        v-model="vmName"
                        placeholder="VM name"
                      />
                      <!-- </a-form-model-item> -->
                    </a-col>
                  </a-row>
                </div>

                <!-- 
                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6">{{ $t("os") }}:</a-col>
                  <a-col span="16" :xs="18">
                    <a-select
                      :default-value="defaultOS"
                      style="width: 100%"
                      @change="(newdata) => setAddon('os', +newdata)"
                    >
                      <a-select-option
                        v-for="group in getAddons.os"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row> -->
              </a-collapse-panel>

              <!-- network -->
              <a-collapse-panel
                v-if="getPlan.kind === 'STATIC'"
                key="network"
                :header="$t('Network') + ':'"
                :disabled="itemSP ? false : true"
              >
                <div class="newCloud__option-field">
                  <a-row :gutter="[10, 10]">
                    <a-col :sm="12" :span="24">
                      <a-row :style="{ display: 'flex', alignItems: 'center' }">
                        <a-col :sm="10" :span="12">
                          {{ $t("Public network") }}:
                        </a-col>
                        <a-col :sm="12" :span="12">
                          <a-switch v-model="options.network.public.status" />
                          <a-input-number
                            v-model="options.network.public.count"
                            :min="1"
                            :max="10"
                            :disabled="!options.network.public.status"
                            :style="{ 'margin-left': '10px' }"
                          />
                        </a-col>
                      </a-row>
                    </a-col>

                    <a-col :sm="12" :span="24">
                      <a-row :style="{ display: 'flex', alignItems: 'center' }">
                        <a-col :sm="10" :span="12">
                          {{ $t("Private network") }}:
                        </a-col>
                        <a-col :sm="12" :span="12">
                          <a-switch v-model="options.network.private.status" />
                          <a-input-number
                            v-model="options.network.private.count"
                            :min="0"
                            :max="10"
                            :disabled="!options.network.private.status"
                            :style="{ 'margin-left': '10px' }"
                          />
                        </a-col>
                      </a-row>
                    </a-col>
                  </a-row>
                </div>
              </a-collapse-panel>

              <!-- Addons -->
              <!-- <div class="paas_addons" v-if="!isAddonsLoading"> -->
              <!-- <a-collapse-panel
                key="addons"
                :header="$t('Addons') + ':'"
                :style="{ 'border-radius': '0 0 20px 20px' }"
              >
                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6"
                    >{{ $t("panel") | capitalize }}:</a-col
                  >
                  <a-col span="16" :xs="18">
                    <a-select
                      default-value="-1"
                      style="width: 100%"
                      @change="(newdata) => setAddon('panel', +newdata)"
                    >
                      <a-select-option value="-1">{{
                        $t("none")
                      }}</a-select-option>
                      <a-select-option
                        v-for="group in getAddons.panel"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row>

                <a-row class="newCloud__prop">
                  <a-col span="8" :xs="6"
                    >{{ $t("backup HDD") | capitalize }}:</a-col
                  >
                  <a-col span="16" :xs="18">
                    <a-select
                      default-value="-1"
                      style="width: 100%"
                      @change="(newdata) => setAddon('backup', +newdata)"
                    >
                      <a-select-option value="-1">0 Gb</a-select-option>
                      <a-select-option
                        v-for="group in getAddons.backup"
                        :key="group.id"
                        >{{ group.description.TITLE }}</a-select-option
                      >
                    </a-select>
                  </a-col>
                </a-row>
              </a-collapse-panel> -->
              <!-- </div> -->
            </a-collapse>
          </div>

          <div class="newCloud__calculate field result">
            <!-- Location -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                style="
                  font-size: 1.2rem;
                  padding-bottom: 5px;
                  margin-bottom: 10px;
                  border-bottom: 1px solid #e8e8e8;
                "
                v-if="this.itemSP"
              >
                <a-col> {{ $t("Location") }}: </a-col>
                <a-col>
                  {{ this.itemSP.title }}
                </a-col>
              </a-row>
            </transition>
            <!-- Tarif -->
            <transition
              name="networkApear"
              v-if="this.itemSP && getPlan.kind === 'STATIC'"
            >
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem' }"
                v-if="options.size"
              >
                <a-col> {{ $t("Tarif") }}: </a-col>
                <a-col>
                  {{ productSize }}
                </a-col>
              </a-row>
            </transition>

            <!-- CPU -->
            <transition name="networkApear" v-if="this.itemSP">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'align-items': 'center' }"
              >
                <a-col> {{ $t("CPU") }}: </a-col>
                <!-- <a-col
                  :style="{
                    'font-size': '1rem',
                    background: '#ccc',
                    padding: '0 5px 0 5px',
                  }"
                >
                  {{ $t("High speed") }}
                </a-col> -->
                <a-col v-if="options.cpu.size">
                  {{ options.cpu.size }} vCPU
                </a-col>
              </a-row>
            </transition>

            <!-- RAM -->
            <transition name="networkApear" v-if="this.itemSP">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem' }"
              >
                <a-col> {{ $t("RAM") }}: </a-col>
                <a-col v-if="options.ram.size">
                  {{ options.ram.size }} Gb
                </a-col>
              </a-row>
            </transition>

            <!-- Drive -->
            <!-- <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.2rem', 'margin-bottom': '5px' }"
              >
                <a-col> {{ $t("Drive") }}: </a-col>
                <a-col>
                  {{ options.drive ? "SDD" : "HDD" }}
                  <span v-if="!options.addonsObjects.drive">{{
                    getCurrentProd.props.drive.VALUE
                  }}</span>
                  <span v-else>
                    {{
                      parseInt(getCurrentProd.props.drive.VALUE) +
                      parseInt(
                        options.addonsObjects.drive &&
                          options.addonsObjects.drive.description.VALUE
                      )
                    }}
                    Gb</span
                  >
                </a-col>
              </a-row>
            </transition> -->

            <!-- Trafic -->
            <!-- <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="getCurrentProd.props.ram"
              >
                <a-col>
                  <span v-if="!options.addonsObjects.traffic">{{
                    $t("under 3 Gb per month") | capitalize
                  }}</span>
                  <span v-else>
                    {{
                      $t(
                        `newPaaSTrafficItem.${
                          options.addonsObjects.traffic &&
                          options.addonsObjects.traffic.description.TITLE.replace(
                            "Безлимитный, скорость канала не менее",
                            "Безлимит, от "
                          )
                        }`
                      )
                    }}
                  </span>
                </a-col>
              </a-row>
            </transition> -->

            <!-- os -->
            <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.os.name"
              >
                <a-col> {{ $t("OS") }}: </a-col>
                <a-col>
                  {{ options.os.name }}
                </a-col>
              </a-row>
            </transition>

            <!-- network -->
            <transition name="networkApear" v-if="this.itemSP">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="
                  tarification === 'UNKNOWN'
                    ? (options.network.public.status = true)
                    : options.network.public.status
                "
              >
                <a-col>
                  <!-- <a-tooltip>
                    <template slot="title">
                      {{
                        $t(
                          `Included in total by default ${
                            options.network.price * options.network.public.count
                          }`
                        )
                      }}
                      {{ currency }}
                    </template>
                    <a-badge
                      :style="{ 'font-size': '1.1rem' }"
                      count="?"
                      :number-style="{
                        backgroundColor: '#fff',
                        color: '#999',
                        boxShadow: '0 0 0 1px #d9d9d9 inset',
                      }"
                      :offset="[10, 2]"
                    >
                   
                    </a-badge>
                  </a-tooltip> -->
                  {{ $t("public") }} IPv4:
                </a-col>
                <a-col>
                  {{ options.network.public.count }}
                </a-col>
              </a-row>
            </transition>

            <transition name="networkApear" v-if="this.itemSP">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.network.private.status"
              >
                <a-col>
                  <!-- <a-tooltip>
                    <template slot="title">
                      {{
                        $t(
                          `Included in total by default ${
                            options.network.price * options.network.public.count
                          }`
                        )
                      }}
                      {{ currency }}
                    </template>
                    <a-badge
                      :style="{ 'font-size': '1.1rem' }"
                      count="?"
                      :number-style="{
                        backgroundColor: '#fff',
                        color: '#999',
                        boxShadow: '0 0 0 1px #d9d9d9 inset',
                      }"
                      :offset="[10, 2]"
                    >
                   
                    </a-badge>
                  </a-tooltip> -->
                  {{ $t("Private") }} IPv4:
                </a-col>
                <a-col>
                  {{ options.network.private.count }}
                </a-col>
              </a-row>
            </transition>

            <!-- Panel -->
            <!-- <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.addonsObjects.panel"
              >
                <a-col>{{
                  options.addonsObjects.panel.description.TITLE
                }}</a-col>
              </a-row>
            </transition> -->

            <!-- Backup -->
            <!-- <transition name="networkApear">
              <a-row
                type="flex"
                justify="space-between"
                :style="{ 'font-size': '1.1rem' }"
                v-if="options.addonsObjects.backup"
              >
                <a-col> {{ $t("Backup") }}: </a-col>
                <a-col>
                  {{ options.addonsObjects.backup.description.TITLE }}
                </a-col>
              </a-row>
            </transition> -->
            <!-- <a-skeleton :loading="getCurrentProd == null" :active="true"> -->

            <a-row
              type="flex"
              justify="space-between"
              style="width: 100%; margin-top: 10px"
              v-if="this.itemSP && getServicesFull.length > 1"
            >
              <a-col style="width: 100%">
                <a-select
                  placeholder="Services"
                  style="width: 100%"
                  @change="(item) => (service = item)"
                >
                  <a-select-option
                    v-for="service in getServicesFull"
                    :key="service.uuid"
                    :value="service.uuid"
                    >{{ service.title }}
                  </a-select-option>
                </a-select>
              </a-col>
            </a-row>

            <a-row
              type="flex"
              justify="space-between"
              style="width: 100%; margin-top: 10px"
              v-if="this.itemSP && getNameSpaces.length > 1"
            >
              <a-col style="width: 100%">
                <a-select
                  style="width: 100%"
                  placeholder="NameSpaces"
                  @change="(item) => (namespace = item)"
                >
                  <a-select-option
                    v-for="name in getNameSpaces"
                    :key="name.uuid"
                    :value="name.uuid"
                    >{{ name.title }}</a-select-option
                  >
                </a-select>
              </a-col>
            </a-row>

            <a-divider
              orientation="left"
              :style="{ 'margin-bottom': '0' }"
              v-if="this.itemSP"
            >
              {{ $t("Total") }}:
            </a-divider>
            <!-- <transition name="textchange" mode="out-in"> -->
            <a-row
              type="flex"
              justify="center"
              :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
              v-if="tarification === 'STATIC'"
            >
              <a-col v-if="this.itemSP">
                <!-- {{
                    calculatePrice(
                      +getFullPrice +
                        options.network.price * options.network.public.count,
                      (period = "month")
                    ).toFixed(2)
                  }} -->
                <!-- {{ currency }}/{{ $tc("period.month") }} -->
                <!-- </a-tooltip> -->

                {{
                  calculatePrice(
                    productFullPriceStatic,
                    (period = "month")
                  ).toFixed(2)
                }}
                BYN/{{ $tc("period.month") }}
              </a-col>
            </a-row>
            <a-row
              type="flex"
              justify="center"
              :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
              v-if="tarification === 'UNKNOWN'"
            >
              <a-col v-if="this.itemSP">
                <!-- ~{{
                    calculatePrice(
                      +getFullPrice +
                        options.network.price * options.network.public.count,
                      (period = "hour")
                    ).toFixed(2)
                  }} -->
                <!-- {{ currency }}/{{ $t("hour") }} -->
                ~{{
                  calculatePrice(
                    productFullPriceCustom,
                    (period = "hour")
                  ).toFixed(2)
                }}
                BYN/{{ $t("hour") }}
              </a-col>
            </a-row>
            <!-- </transition> -->
            <!-- </a-skeleton> -->
            <a-row
              type="flex"
              justify="space-around"
              style="
                margin-top: 20px;
                margin-bottom: 10px;
                border-top: 1px solid #e8e8e8;
              "
            >
              <a-col :span="22" style="margin-top: 20px">
                <!-- :loading="getCurrentProd == null" -->
                <a-button
                  type="primary"
                  block
                  shape="round"
                  @click="() => (modal.confirmCreate = true)"
                  :disabled="
                    this.passwordValid == false ||
                    vmName == '' ||
                    service == '' ||
                    namespace == '' ||
                    options.os.name == ''
                  "
                >
                  {{ $t("Create") }}
                </a-button>
                <a-modal
                  :title="$t('Confirm')"
                  :visible="modal.confirmCreate"
                  :confirm-loading="modal.confirmLoading"
                  :cancel-text="$t('Cancel')"
                  @ok="handleOkOnCreateOrder"
                  @cancel="() => (modal.confirmCreate = false)"
                >
                  {{
                    $t(
                      "Virtual machine will be available after paying the invoice"
                    )
                  }}

                  <a-row style="margin-top: 20px">
                    <a-col>
                      <a-checkbox
                        :checked="modal.goToInvoice"
                        @change="(e) => (modal.goToInvoice = e.target.checked)"
                      />
                      {{ $t("go to invoice") | capitalize }}
                    </a-col>
                  </a-row>
                </a-modal>
              </a-col>
            </a-row>
          </div>
        </div>
        <loading v-else></loading>
      </template>
      <!-- <div v-else class="newCloud tariff">
        <div class="field field--fluid">
          <div class="tariff__header">Choose your tariff</div>

          <div class="tariff__wrapper">
            <div class="tariff__cards">
              <div class="tariff__items">
                <div
                  class="tariff__item"
                  v-for="tariff in tariffs"
                  :key="tariff"
                  @click="
                    () => {
                      options.isOnCalc = true;
                      options.kind = tariff;
                      options.size = getProductsData[options.slide];
                    }
                  "
                >
                  <div class="tariff__title">
                    {{
                      getProducts[tariff][getProductsData[options.slide]][0][0]
                        .name | replace("SVDS", "")
                    }}
                  </div>
                  <div class="tariff__body">
                    <loading v-if="isProductsLoading" />
                    <div v-else>
                      <ul>
                        <li class="tariff__property">
                          <span class="tariff__body-value">
                            {{
                              getProducts[tariff][
                                getProductsData[options.slide]
                              ][0][0].pricing[currency].monthly
                            }}
                            <span class="tariff__currency">{{ currency }}</span>
                          </span>
                        </li>
                        <li
                          v-for="(spec, index) in ['cpu_core', 'ram']"
                          :key="index"
                          class="tariff__property"
                        >
                          <span class="tariff__body-value">
                            {{
                              getProducts[tariff][
                                getProductsData[options.slide]
                              ][0][0].props[spec].VALUE
                            }}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tariff__nav">
                <span
                  class="tariff__nav-item tariff__nav-item_prev"
                  :class="[
                    sliderIsCanPrev
                      ? 'tariff__nav-item_active'
                      : 'tariff__nav-item_disabled',
                  ]"
                  @click="sliderNavPrev"
                >
                  <a-icon type="left" />
                </span>
                <span
                  class="tariff__nav-item tariff__nav-item_next"
                  :class="[
                    sliderIsCanNext
                      ? 'tariff__nav-item_active'
                      : 'tariff__nav-item_disabled',
                  ]"
                  @click="sliderNavNext"
                >
                  <a-icon type="right" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> -->
    </template>
  </div>
</template>

<script>
const periods = [
  {
    count: 1,
    title: "month",
    value: "monthly",
  },
  {
    count: 3,
    title: "month",
    value: "quarterly",
  },
  {
    count: 6,
    title: "month",
    value: "semiannually",
    discount: 5,
  },
  {
    count: 1,
    title: "year",
    value: "annually",
    discount: 10,
  },
];
const tariffs = ["standart", "X2CPU", "X2RAM"];
// const sizes = ["M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
import { mapGetters } from "vuex";
import loading from "../loading/loading";
export default {
  name: "newPaaS",
  components: {
    loading,
  },
  data() {
    return {
      productSize: "VDS L",
      activeKey: "location",
      plan: "",
      periods,
      service: "",
      namespace: "",
      tarification: "STATIC",
      location_uuid: "",
      vmName: "",
      password: "",
      textInvalid: '',
      focused: false,
      options: {
        // kind: "standart",

        // period: "monthly",
        period: "1",
        size: "VDS L",
        isOnCalc: false,
        highCPU: false, // 1 highCPU, 0 basicCPU
        // slide: 1,

        cpu: {
          size: 1,
          min: 1,
          max: 8,
        },
        ram: {
          size: 1,
          min: 1,
          max: 12,
        },
        disk: {
          type: "SSD",
          size: 1,
          min: 1,
          max: 12,
        },
        // ip: {
        //   size: 1,
        //   price: 0,
        //   min: 1,
        //   max: 5,
        // },
        os: {
          id: -1,
          name: "",
        },
        network: {
          public: {
            status: true,
            count: 1,
            min: 1,
            max: 5,
          },
          private: {
            status: false,
            count: 0,
          },
          price: 0,
        },
      },
      modal: {
        confirmCreate: false,
        confirmLoading: false,
        goToInvoice: true,
      },
    };
  },

  computed: {
    ...mapGetters("nocloud/namespaces", ["getNameSpaces"]),
    ...mapGetters("nocloud/plans", ["getPlans"]),
    ...mapGetters("nocloud/plans", ["isPlansLoading"]),
    ...mapGetters("nocloud/sp/", ["getSP"]),
    ...mapGetters("nocloud/auth/", ["userdata"]),
    ...mapGetters("nocloud/vms", ["getServicesFull"]),

    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },

    itemService() {
      const data = this.getServicesFull.find((el) => {
        return this.service === el.uuid;
      });
      return data;
    },

    itemSP() {
      const sp = this.getSP.find((el) => {
        return el.uuid === this.location_uuid;
      });
      if (sp) {
        this.activeKey = "plan";
      }
      return sp;
    },

    ...mapGetters("newPaaS", ["isProductsLoading"]),

    //--------------Plans-----------------
    //UNKNOWN and STATIC
    getPlan() {
      const item = this.getPlans.find((el) => {
        return el.kind === this.tarification;
      });
      this.plan = item;
      return item;
    },

    //STATIC
    getPlanOneStatic() {
      for (let planStatic of this.getPlans) {
        return planStatic;
      }
    },
    //-------------------------------------

    getProducts() {
      const planTitle = [];
      const sort = [];

      for (let prod of Object.values(this.getPlanOneStatic.products)) {
        sort.push(+prod.sorter);
        sort.sort();
      }

      for (let el of sort) {
        for (let prod of Object.values(this.getPlanOneStatic.products)) {
          if (el === +prod.sorter) {
            planTitle.push(prod.title);
          }
        }
      }
      return planTitle;
    },
    product() {
      for (let [key, el] of Object.entries(this.getPlanOneStatic.products)) {
        if (el.title === this.productSize) {
          const product = {
            ...el,
            key: key,
          };
          this.options.ram.size = product.resources.ram / 1024;
          this.options.cpu.size = product.resources.cpu;
          this.options.disk.size = 13000;
          return product;
        }
      }
    },

    productFullPriceStatic() {
      for (let product of Object.values(this.getPlanOneStatic.products)) {
        if (product.title === this.productSize) {
          return (
            Math.floor((product.period = 86400 / (3600 * 24))) *
            30 *
            product.price *
            this.options.period
          );
        }
      }
    },
    productFullPriceCustom() {
      if (this.getPlan.kind === "UNKNOWN") {
        const price = [];
        for (let resource of this.getPlan.resources) {
          if (resource.key === "cpu") {
            const priceCPU =
              this.options.cpu.size *
              resource.price *
              ((resource.period / 3600) * 24 * 30);
            price.push(priceCPU);
          }
          if (resource.key === "ram") {
            const priceRAM =
              this.options.ram.size *
              resource.price *
              ((resource.period / 3600) * 24 * 30);
            price.push(priceRAM);
          }
          if (resource.key === "ip") {
            const priceIP =
              this.options.network.public.count *
              resource.price *
              Math.floor(resource.period / (3600 * 24));
            price.push(priceIP);
          }
        }
        const fullPrice = price.reduce((accum, item) => {
          return accum + item;
        });
        return fullPrice;
      }
    },
    passwordValid() {
      if (this.focused == true) {
        if (!this.password.match(/[A-Za-z]/)) {
          this.textInvalid = "Password must contain at least one letter";
          return false;
        } else {
          this.textInvalid = "";
        }
        if (!this.password.match(/[0-9]/)) {
          this.textInvalid = "Password must contain at least one number";
          return false;
        } else {
          this.textInvalid = "";
        }
        if (this.password.length < 6) {
          this.textInvalid = "Password is too short";
          return false;
        } else {
          this.textInvalid = "";
        }
      } else {
        this.textInvalid = "";
        return false
      }
    },
    // getCurrentProd() {
    //   const o = this.options;
    //   const path = [o.kind, o.size, +o.drive, +o.highCPU];

    //   let current = this.getProducts;
    //   if (current == undefined || current.length == 0) {
    //     return null;
    //   }
    //   for (let index = 0; index < path.length; index++) {
    //     if (current[path[index]] != undefined) {
    //       // console.log(current[path[index]])
    //       current = current[path[index]];
    //     } else {
    //       let pt = path.slice(0, index + 1).join("/");
    //       console.error(
    //         `there is no product with path: ${pt}, there is only: ${Object.keys(
    //           current
    //         ).join(", ")}`
    //       );
    //       return null;
    //     }
    //   }
    //   return current;
    // },
    // getFullPrice() {
    //   if (this.isAddonsLoading || this.isProductsLoading) {
    //     return false;
    //   }
    //   const VMonly =
    //     +this.getCurrentProd.pricing[this.currency][this.options.period];
    //   const addonsName = ["drive", "traffic", "panel", "os", "backup"];
    //   const addonsCosts = addonsName.map((name) => {
    //     if (this.options.addonsObjects[name] == null) {
    //       return 0;
    //     }
    //     return this.options.addonsObjects[name].pricing[this.options.period];
    //   });
    //   return [VMonly, ...addonsCosts]
    //     .reduce((acc, val) => acc + val)
    //     .toFixed(2);
    // },
    sliderIsCanNext() {
      return this.options.slide < this.getProductsData.length - 1;
    },
    sliderIsCanPrev() {
      return this.options.slide > 0;
    },
    currency() {
      return this.$config.currency.code;
    },
  },
  mounted() {
    this.setOneService();
    this.setOneNameSpace();
    if (this.isLogged) {
      this.$store.dispatch("nocloud/vms/fetch");
      this.$store.dispatch("nocloud/sp/fetch");
      this.$store.dispatch("nocloud/namespaces/fetch");
      this.$store.dispatch("nocloud/plans/fetch");
    }

    // this.$store.dispatch("newPaaS/fetchProductsAuto");

    // this.$axios
    //   .get("getSettings.php?filter=cost,disktypes,minDisk,maxDisk")
    //   .then((res) => {
    //     this.options.network.price = res.data.PUBLIC_IP_COST;
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     this.$message.error("Can't load prices. Show saved ones.");
    //   });
  },
  methods: {
    setOneService() {
      if (this.getServicesFull.length === 1) {
        for (let gSF of this.getServicesFull) {
          this.service = gSF.uuid;
        }
      }
    },
    setOneNameSpace() {
      if (this.getNameSpaces.length === 1) {
        for (let gNS of this.getNameSpaces) {
          this.namespace = gNS.uuid;
        }
      }
    },
    setData() {
      //  this.$set(this.options.ram, 'size', this.product.resources.ram / 1024)
      //  this.$set(this.options.cpu, 'size', this.product.resources.cpu)
      // this.options.ram.size = this.product.resources.ram / 1024;
      // this.options.cpu.size = this.product.resources.cpu;
    },
    changeValuePlus(variable) {
      if (variable == "cpu") {
        this.options.cpu.size < this.options.cpu.max && this.options.cpu.size++;
      }
      if (variable == "ram") {
        this.options.ram.size < this.options.ram.max && this.options.ram.size++;
      }
      if (variable == "ip") {
        this.options.network.public.count < this.options.network.public.max &&
          this.options.network.public.count++;
      }
    },
    changeValueMinus(variable) {
      if (variable == "cpu") {
        this.options.cpu.size > this.options.cpu.min && this.options.cpu.size--;
      }
      if (variable == "ram") {
        this.options.ram.size > this.options.ram.min && this.options.ram.size--;
      }
      if (variable == "ip") {
        this.options.network.public.count > this.options.network.public.min &&
          this.options.network.public.count--;
      }
    },
    calculatePrice(price, period = this.period) {
      // if(this.options.tarification){
      // 	return price;
      // }
      switch (period) {
        case "minute":
          price = price / 60;
        case "hour":
          price = price / 24;
        case "day":
          price = price / 30;
        case "month":
          break;
        case "week":
          price = (price / 30) * 7;
          break;
        default:
          console.error("[VDC Calculator]: Wrong period in calc.", period);
          return undefined;
          break;
      }
      return price;
    },
    setOS(item, index) {
      this.options.os.id = +index;
      this.options.os.name = item.name;
    },
    getPopupContainer(trigger) {
      const elem = trigger.parentElement.parentElement.parentElement;
      return elem;
    },
    // URLparameter(obj, outer = "") {
    //   var str = "";
    //   for (var key in obj) {
    //     if (key == "price") continue;
    //     if (str != "") {
    //       str += "&";
    //     }
    //     if (typeof obj[key] == "object") {
    //       str += this.URLparameter(obj[key], outer + key);
    //     } else {
    //       str += outer + key + "=" + encodeURIComponent(obj[key]);
    //     }
    //   }
    //   return str;
    // },
    handleOkOnCreateOrder() {
      // --------------------------------
      const instance = {
        title: this.vmName,
        config: {
          template_id: this.options.os.id,
          password: this.password,
        },
        resources: {
          cpu: this.options.cpu.size,
          ram: this.options.ram.size * 1024,
          drive_type: this.options.disk.type,
          drive_size: this.options.disk.size,
          ips_private: this.options.network.private.count,
          ips_public: this.options.network.public.count,
        },
        billing_plan: {
          uuid: this.plan.uuid,
          // uuid: "fe8bb5cc-1a14-4d51-a3e1-df0053bc72ed",
          title: this.plan.title,
          type: this.plan.type,
          public: this.plan.public,
        },
        product: this.product.key,
      };
      //add key product in instance
      // const newInstance =
      //   this.plan.kind === "STATIC"
      //     ? Object.assign({}, { product: this.product.key },instance)
      //     : instance;
      // -------------------------------------
      //apdate service
      if (this.service !== "") {
        const newObj = Object.assign(
          {},
          { instances_groups: this.itemService.instancesGroups },
          { ...this.itemService }
        );
        delete newObj.instancesGroups;
        newObj.instances_groups[0].instances.push(instance);

        const orderDataNew = {
          uuid: newObj.uuid,
          service: {
            namespace: this.namespace,
            service: newObj,
          },
        };
        this.updateVM(orderDataNew);
      } else {
        //create service
        const orderData = {
          deploy_policies: {
            0: this.itemSP.uuid,
          },
          namespace: this.namespace,
          service: {
            title: this.userdata.title,
            context: {},
            version: "1",
            instances_groups: [
              {
                title: this.userdata.title + Date.now(),
                resources: {
                  ips_private: this.options.network.private.count,
                  ips_public: this.options.network.public.count,
                },
                type: "ione",
                instances: [instance],
              },
            ],
          },
        };
        this.orderVM(orderData);
      }
    },
    orderVM(orderData) {
      this.modal.confirmLoading = true;
      const self = this;
      this.$store
        .dispatch("nocloud/vms/createService", orderData)
        .then((result) => {
          if (result) {
            self.$message.success(self.$t("Order created successfully."));
            if (self.modal.goToInvoice) {
              self.$router.push(`/invoice-${res.invoiceid}`);
            }
          } else {
            throw "error";
          }
        })
        .catch((err) => {
          self.$message.error("Can't create order. Try later.");
          console.error(err);
        })
        .finally((res) => {
          self.modal.confirmLoading = false;
        });
    },
    updateVM(orderDataNew) {
      this.modal.confirmLoading = true;
      const self = this;
      this.$store
        .dispatch("nocloud/vms/updateService", orderDataNew)
        .then((result) => {
          if (result) {
            self.$message.success(self.$t("Order update successfully."));
            if (self.modal.goToInvoice) {
              self.$router.push(`/invoice-${res.invoiceid}`);
            }
          } else {
            throw "error";
          }
        })
        .catch((err) => {
          self.$message.error("Can't update order. Try later.");
          console.error(err);
        })
        .finally((res) => {
          self.modal.confirmLoading = false;
        });
    },
    // setAddon(name, value) {
    //   if (name == "os") {
    //     const data = this.getAddons[name];
    //     this.options.os.name = data.find(
    //       (el) => el.id == value
    //     ).description.TITLE;
    //   }

    //   this.options.addons[name] = value;
    //   let addons = [];
    //   if (name == "drive") {
    //     addons = this.getAddons[this.options.drive ? "ssd" : "hdd"];
    //   } else {
    //     addons = this.getAddons[name];
    //   }
    //   const addon = addons.find((el) => el.id == value);
    //   this.options.addonsObjects[name] = addon !== undefined ? addon : null;
    // },
    sliderNavNext() {
      if (this.sliderIsCanNext) {
        this.options.slide += 1;
      }
    },
    sliderNavPrev() {
      if (this.sliderIsCanPrev) {
        this.options.slide -= 1;
      }
    },
  },

  watch: {
    tarification() {
      if (this.getPlan.kind == "STATIC") {
        this.options.ram.size = this.product.resources.ram / 1024;
        this.options.cpu.size = this.product.resources.cpu;
      }
    },
    // getAddons: function (newVal) {
    //   this.options.addons.os = +newVal.os[0].id;
    // },
    // activeKey: function(){
    //     this.activeKey.push('tarif')
    // }
  },
};
</script>

<style>
.password.invalid {
  border: 1px solid red;
}
.location_item {
  display: flex;
  justify-content: center;
}
.ant-slider-mark-text:first-of-type {
  width: 60px !important;
  left: 2% !important;
}
.ant-slider-mark-text:last-of-type {
  width: 60px !important;
  left: 98% !important;
}
.newCloud__prop {
  margin-bottom: 15px;
}
.period__wrapper {
  display: block;
  padding: 15px 0 0;
}
.vdc_plan .ant-input-number-handler-wrap {
  display: none;
}
.vdc_plan .ant-input-number-input {
  text-align: center;
}
.period__item {
  display: flex;
  justify-content: center;
  position: relative;
}
.period__discount {
  position: absolute;
  top: -22px;
  font-size: 1.1rem;
  color: var(--err);
  font-weight: bold;
}
.newCloud_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}
.newCloud {
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}
.newCloud__inputs {
  margin-right: 20px;
  width: 72%;
  padding: 0;
}
.newCloud__change-tariff {
  color: var(--main);
  cursor: pointer;
}
.field {
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  height: max-content;
}
.field--fluid {
  width: 100%;
  padding: 10px 15px;
}
.newCloud__calculate {
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
}
.result__title {
  font-size: 1.5rem;
  text-align: center;
  padding: 2px 0 10px;
}
.tariff__header {
  text-align: center;
  padding: 5px 0;
  font-size: 1.6rem;
}
/* .tariff__wrapper:not(:last-child){ */
.tariff__wrapper {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.tariff__nav-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: var(--main);
  opacity: 0.7;
  --step: -55px;
  cursor: pointer;
  transition: opacity 0.2s ease, font-size 0.2s ease, transform 0.2s ease;
  user-select: none;
}
.tariff__nav-item_active:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}
.tariff__nav-item_active:active {
  opacity: 1;
  transform: translateY(-50%) scale(0.8);
}
.tariff__nav-item_prev {
  left: var(--step);
}
.tariff__nav-item_next {
  right: var(--step);
}
.tariff__nav-item_disabled {
  color: rgba(0, 0, 0, 0.6);
  font-size: 2.5rem;
}
.tariff__cards {
  display: flex;
  position: relative;
}
.tariff__items {
  display: flex;
}
.tariff__sizes {
  display: flex;
  justify-content: space-between;
  /* flex-wrap: wrap; */
  overflow-x: scroll;
}
.tariff-group--title {
  font-size: 1.4rem;
  text-transform: uppercase;
  padding-left: 12px;
}
.tariff__item {
  cursor: pointer;
  width: 200px;
  /* border: 1px solid lightgray; */
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 15px;
  flex-shrink: 0;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.tariff__item:not(:last-of-type) {
  margin-right: 15px;
}
.tariff__title {
  background-color: var(--main);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 5px;
  font-size: 1.6rem;
}
.tariff__body {
  padding: 5px 12px 15px;
}
.tariff__body ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}
.tariff__currency {
  font-size: 1rem;
  opacity: 0.8;
  transition: font 0.2s ease;
}
.tariff__property:hover .tariff__currency {
  opacity: 9;
  font-size: 1.1rem;
}
.tariff__property {
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
}
.tariff__body-value {
  margin-left: 5px;
}
.tariff__order:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.changing__field {
  font-weight: 600;
}
.newCloud__template {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.newCloud__template.one-line {
  flex-wrap: nowrap;
  justify-content: space-between;
}
.ant-collapse-item:last-child > .ant-collapse-content {
  border-radius: 0 0 20px 20px;
}
.newCloud__template-item {
  width: 116px;
  margin-bottom: 10px;
  background-color: #fff;
  box-shadow: 3px 2px 6px rgba(0, 0, 0, 0.08), 0px 0px 8px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  text-align: center;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}
.newCloud__template-item:hover {
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
}
.newCloud__template-item.active {
  box-shadow: 5px 8px 12px rgba(0, 0, 0, 0.08), 0px 0px 13px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
}
.newCloud__template-image {
  padding: 10px;
}
.newCloud__template-name {
  padding: 10px;
}
.newCloud__template-item.active .newCloud__template-name {
  background-color: var(--main);
  color: var(--bright_font);
}
.ant-collapse > .ant-collapse-item:last-child {
  border-radius: 0 0 15px 15px;
}
@media screen and (max-width: 991px) {
  .newCloud {
    flex-direction: column;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }
  .newCloud__inputs {
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
    padding-bottom: 0;
  }
  .field {
    box-shadow: none;
    flex-grow: 0;
  }
  .newCloud__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}
@media screen and (max-width: 768px) {
  .tariff__items {
    flex-direction: column;
  }
}
@media screen and (max-width: 576px) {
  .newCloud__template {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .newCloud__template-item {
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .newCloud__template-item:not(:last-child) {
    margin-right: 0px;
  }
  .newCloud__template-image {
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .newCloud__template-image__rate {
    line-height: 42px;
    font-size: 1.4rem;
  }
  .newCloud__template-image img {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .newCloud__template-name {
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .newCloud__template-type {
    width: 56px;
  }
  .newCloud__template-name ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1;
  }
  .newCloud__template-name ul li {
    margin-left: 20px;
  }
}
.networkApear-enter-active,
.networkApear-leave-active {
  transition: opacity 0.5s, height 0.5s;
  height: 28px;
}
.networkApear-enter,
.networkApear-leave-to {
  opacity: 0;
  height: 0;
}
</style>
