<template>
  <div class="cloud__fullscreen Fcloud">
    <template>
      <transition name="opencloud" :duration="600">
        <div v-if="!vmsLoading" class="cloud__container">
          <div class="Fcloud">
            <div class="Fcloud__header">
              <div class="Fcloud__back-wrapper">
                <div class="Fcloud__back icon__wrapper" @click="$router.go(-1)">
                  <a-icon type="left" />
                </div>
              </div>
              <div v-if="VM && VM.status" class="Fcloud__header-title">
                <div
                  class="Fcloud__status-color"
                  :class="{ 'glowing-animations': getActionLoadingInvoke }"
                  :style="{ 'background-color': stateColor }"
                ></div>
                <div class="Fcloud__title">
                  {{ VM.title }}
                </div>
                <div
                  class="Fcloud__status"
                  :class="{ 'glowing-animations': getActionLoadingInvoke }"
                >
                  <!-- {{
                    VM.state.meta.state_str
                      ? VM.state.meta.state_str
                      : VM.state.meta.error
                  }} -->
                  <!-- {{ vmState | replace("_", " ") }} -->
                  {{ stateVM }}
                </div>
              </div>
              <div class="Fcloud__menu-wrapper">
                <div class="Fcloud__menu-btn icon__wrapper">
                  <a-icon type="more" @click="openModal('menu')" />
                  <a-modal v-model="modal.menu" title="Menu" :footer="null">
                    <!-- v-for="btn in menuOptions.filter(
                        (el) => !el.forVNC || SingleCloud.GNAME == 'VDC'
                      )" -->

                    <a-button
                      block
                      class="menu__button"
                      v-for="btn in menuOptions"
                      :key="btn.title"
                      :icon="btn.icon"
                      :type="btn.type || 'default'"
                      :disabled="disabledMenu(btn.title.toLowerCase())"
                      :loading="(btn.icon === 'delete') ? isDeleteLoading : null"
                      @click="btn.onclick(...btn.params)"
                    >
                      {{ $t(btn.title) }}
                    </a-button>
                  </a-modal>
                  <a-modal
                    v-model="modal.rename"
                    :confirmLoading="isRenameLoading"
                    title="rename"
                    @ok="sendRename"
                  >
                    <p>{{ $t("Enter new VM name") }}</p>
                    <a-input
                      v-model="renameNewName"
                      :placeholder="$t('input new name')"
                    >
                    </a-input>
                  </a-modal>
                  <a-modal
                    v-model="modal.reinstall"
                    title="reinstall"
                    @ok="sendReinstall"
                  >
                    <template v-if="!disabledMenu('reinstall')">
                      <p>{{ $t("Enter new password") }}</p>
                      <a-input-password
                        v-model="reinstallPass"
                        :placeholder="$t('input password')"
                      >
                      </a-input-password>
                    </template>
                    <template v-else>
                      <p>
                        We can't do it automaticly. Presss OK to create a
                        ticket.
                      </p>
                      <p>All unsaved data will be lost.</p>
                    </template>
                  </a-modal>
                  <a-modal
                    :confirm-loading="loadingResizeVM"
                    v-model="modal.expand"
                    :title="$t('Resize VM')"
                    @ok="ResizeVM"
                  >
                    <a-row
                      style="
                        display: flex;
                        align-items: center;
                        margin-bottom: 5px;
                      "
                    >
                      <a-col  style="width: 75px"> CPU </a-col>
                      <a-col style="width: 100%">
                        <a-input-number
                        style="width: 100%"
                          v-model="resize.VCPU"
                          :min="1"
                          :max="32"
                          default-value="1"
                        />
                      </a-col>
                    </a-row>
                    <a-row
                      style="
                        display: flex;
                        align-items: center;
                        margin-bottom: 5px;
                        width: 100%
                      "
                    >
                      <a-col style="width: 75px"> RAM (GB) </a-col>
                      <a-col style="width: 100%">
                        <a-input-number
                          style="width: 100%"
                          v-model="resize.RAM"
                          :min="1"
                          :max="64"
                          default-value="1"
                        />
                      </a-col>
                    </a-row>
                    <a-row style="display: flex; align-items: center; width: 100%">
                      <a-col style="width: 75px; padding-top:20px"> Disk (GB) </a-col>
                      <a-col style="width: 100%">
                        <div
                          :style="{
                            color: config.colors.err,
                            'text-align': 'center',
                          }"
                        >
                          Can't reduce disk size
                        </div>
                        <a-input-number
                          style="width: 100%"
                          v-model="resize.size"
                          :min="VM.resources && VM.resources.drive_size / 1024"
                          default-value="1"
                        />
                      </a-col>
                    </a-row>

                    <!-- <a-slider
                      :min="mbToGb(VM && VM.resources.drive_size)"
                      :tooltip-visible="true"
                      v-model="resize.size"
                     :tipFormatter="(el) => el + resize.scale" 
                    /> -->
                  </a-modal>
                  <a-modal
                    v-model="modal.SSH"
                    :title="$t('SSH key')"
                    :footer="null"
                  >
                    <div>
                      <span style="font-weight: 700">Key: </span>
                      <span
                        class="ssh-text"
                        title="Click to copy"
                        @click="addToClipboard"
                      >
                        {{ VM.config && VM.config.ssh_public_key || 'none' }}
                      </span>
                    </div>
                  </a-modal>
                  <a-modal
                    v-model="modal.diskControl"
                    :title="$t('Disk control')"
                    :footer="null"
                  >
                    <disk-control />
                  </a-modal>

                  <a-modal
                    width="600px"
                    v-model="modal.networkControl"
                    :title="$t('Network control')"
                    :footer="null"
                  >
                    <network-control
                      :itemService="itemService"
                      :VM="VM"
                      @closeModal="modal.networkControl = false"
                    />
                  </a-modal>

                  <a-modal
                    v-model="modal.bootOrder"
                    :title="$t('Boot order')"
                    :footer="null"
                  >
                    <boot-order @onEnd="bootOrderNewState" />
                  </a-modal>

                  <a-modal
                    v-model="modal.accessManager"
                    :title="$t('Access manager')"
                    :footer="null"
                  >
                    <access-manager />
                  </a-modal>
                </div>
              </div>
            </div>
            <div class="Fcloud__buttons" v-if="!VM.state">
              <div class="Fcloud__button" @click="deployService()">
                <div class="Fcloud__BTN-icon">
                  <a-icon type="deployment-unit" />
                </div>
                <div class="Fcloud__BTN-title">
                  <!-- {{$t('Start')}} -->
                  Deploy
                </div>
              </div>
            </div>
            <div class="Fcloud__buttons" v-else>
              <div
                v-if="
                  VM.state &&
                  VM.state.meta.state !== 8 &&
                  VM.state.meta.lsm_state !== 0
                "
                class="Fcloud__button"
                @click="openModal('shutdown')"
                :class="{
                  disabled: statusVM.shutdown,
                }"
              >
                <div class="Fcloud__BTN-icon">
                  <div class="cloud__icon cloud__icon--stop"></div>
                </div>
                <div class="Fcloud__BTN-title">{{ $t("Power off") }}</div>
                <a-modal
                  v-model="modal.shutdown"
                  :title="$t('cloud_Shutdown_modal')"
                  @ok="handleOk('shutdown')"
                >
                  <p>{{ $t("cloud_Shutdown_invite") }}</p>
                  <a-radio-group
                    v-model="option.shutdown"
                    name="shutdownOption"
                    :default-value="1"
                  >
                    <a-radio :value="0" :style="{ 'margin-bottom': '10px' }">
                      <a-tag color="green" :style="{ margin: '0 2px 0 0' }">{{
                        $t("cloud_Regular")
                      }}</a-tag>
                      {{ $t("cloud_Shutdown") }}
                    </a-radio>
                    <a-radio :value="1">
                      <a-tag color="red" :style="{ margin: '0 2px 0 0' }">
                        HARD
                      </a-tag>
                      {{ $t("cloud_Shutdown") }}
                    </a-radio>
                  </a-radio-group>
                </a-modal>
              </div>
              <div
                v-else
                class="Fcloud__button"
                @click="sendAction('resume')"
                :class="{
                  disabled: statusVM && statusVM.start,
                }"
              >
                <div class="Fcloud__BTN-icon">
                  <a-icon type="caret-right" />
                </div>
                <div class="Fcloud__BTN-title">{{ $t("Start") }}</div>
              </div>
              <div
                class="Fcloud__button"
                @click="openModal('reboot')"
                :class="{
                  disabled: statusVM && statusVM.reboot,
                  btn_disabled_wiggle: true,
                }"
              >
                <div class="Fcloud__BTN-icon">
                  <a-icon type="redo" />
                </div>
                <div class="Fcloud__BTN-title">{{ $t("Reboot") }}</div>
                <a-modal
                  v-model="modal.reboot"
                  :title="$t('cloud_Reboot_modal')"
                  @ok="handleOk('reboot')"
                >
                  <p>{{ $t("cloud_Reboot_invite") }}</p>
                  <a-radio-group
                    v-model="option.reboot"
                    name="rebootOption"
                    :default-value="1"
                  >
                    <a-radio :value="0">
                      <a-tag color="green" :style="{ 'margin-bottom': '10px' }">
                        {{ $t("cloud_Regular") }}
                      </a-tag>
                      {{ $t("cloud_Reboot_modal") }}
                    </a-radio>
                    <a-radio :value="1">
                      <a-tag color="red"> HARD </a-tag>
                      {{ $t("cloud_Reboot_modal") }}
                    </a-radio>
                  </a-radio-group>
                </a-modal>
              </div>
              <div
                class="Fcloud__button"
                @click="openModal('recover')"
                :class="{
                  disabled: statusVM && statusVM.recover,
                }"
              >
                <div class="Fcloud__BTN-icon">
                  <a-icon type="backward" />
                </div>
                <div class="Fcloud__BTN-title">{{ $t("Recover") }}</div>
                <a-modal
                  v-model="modal.recover"
                  :title="$t('cloud_Recover_modal')"
                  @ok="handleOk('recover')"
                >
                  <p>{{ $t("cloud_Recover_invite_line1") }}</p>
                  <p>{{ $t("cloud_Recover_invite_line2") }}</p>
                  <p>{{ $t("cloud_Recover_invite_line3") }}</p>
                  <p>{{ $t("cloud_Recover_invite") }}</p>
                  <a-radio-group
                    v-model="option.recover"
                    name="recover"
                    :default-value="1"
                  >
                    <a-radio :value="0">
                      {{ $t("yesterday") }}
                    </a-radio>
                    <a-radio :value="1">
                      {{ $t("today") }}
                    </a-radio>
                  </a-radio-group>
                </a-modal>
              </div>
            </div>

            <div class="Fcloud__info">
              <div class="Fcloud__info-header">
                <div class="Fcloud__info-title">
                  {{ $t("Information") }}
                </div>
              </div>

              <!-- <div v-if="SingleCloud.ORDER_INFO.invoicestatus && SingleCloud.ORDER_INFO.invoicestatus.toLowerCase() == 'unpaid'" class="Fcloud__main-info Fcloud__main-info--invoice">
							<div class="icon">
								<a-icon type="exclamation-circle" />
							</div>
							<div class="content">
								{{$t('advice.renewal bill') | capitalize}}.
							</div>
							<div class="link__wrapper">
								<router-link
									class="link"
									:to="{name: 'invoiceFS', params: {pathMatch: SingleCloud.ORDER_INFO.invoiceid}}"
								>
									{{$t('advice.open') | capitalize}}
								</router-link>
							</div>
						</div> -->

              <div
                class="Fcloud__info-block block"
                v-if="VM.state && VM.state.meta.networking"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="flag" theme="filled" />
                  {{ "IP" }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div
                      class="block__value"
                      v-if="dataSP"
                      style="font-size: 18px"
                    >
                      <table class="Fcloud__table">
                        <tbody>
                          <tr
                            v-for="nic in VM.state &&
                            VM.state.meta.networking.private"
                            :key="nic.NAME"
                          >
                            <td>{{ nic }}</td>
                          </tr>
                        </tbody>
                        <tbody>
                          <tr
                            v-for="nic in VM.state &&
                            VM.state.meta.networking.public"
                            :key="nic.NAME"
                          >
                            <td>{{ nic }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="environment" theme="filled" />
                  {{ "Location" }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div
                      class="block__value"
                      v-if="dataSP"
                      style="font-size: 18px"
                    >
                      {{ dataSP.title }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="info-circle" />
                  {{ $t("info") | capitalize }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">OS</div>
                    <div class="block__value">
                      {{ OSName || "no data" }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">Plan</div>
                    <div class="block__value">
                      {{ VM.billingPlan.title || 'no data' }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">Product</div>
                    <div class="block__value">
                      {{ VM.product || 'no data' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="setting" theme="filled" />
                  {{ $t("cloud_system") | capitalize }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">CPU</div>
                    <div class="block__value">
                      {{ VM.resources && VM.resources.cpu }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">{{ $t("cloud_Memory") }}</div>
                    <div class="block__value">
                      {{ VM.resources && VM.resources.ram / 1024 }} GB
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="Fcloud__info-block block"
                v-if="!(chart3Data.length == 0 || chart4Data.length == 0)"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="line-chart" />
                  {{ $t("graphs") | capitalize }}
                </div>
                <div
                  class="Fcloud__block-content Fcloud__block-content--charts"
                >
                  <a-row type="flex" justify="space-around" style="width: 100%">
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="cpuChartDataReady"
                        :options="chartOption('cpu')"
                      />
                    </a-col>
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="ramChartDataReady"
                        :options="chartOption('ram')"
                      />
                    </a-col>
                  </a-row>
                </div>
              </div>
              <div class="Fcloud__info-block block">
                <div class="Fcloud__block-header">
                  <a-icon type="database" theme="filled" />
                  {{ $t("cloud_Storage") }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">{{ $t("cloud_Type") }}</div>
                    <div class="block__value">
                      {{ VM.resources && VM.resources.drive_type }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">{{ $t("cloud_Size") }}</div>
                    <div class="block__value">
                      {{ mbToGb(VM.resources && VM.resources.drive_size) }} GB
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="Fcloud__info-block block"
                v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="apartment" />
                  {{ $t("Network") }}
                </div>
                <div class="Fcloud__block-content">
                  <div class="block__column">
                    <div class="block__title">
                      {{ $t("inbound") | capitalize }}
                    </div>
                    <div class="block__value">
                      {{
                        printWidthRange(chart1Data[chart1Data.length - 1][1])
                      }}
                    </div>
                  </div>
                  <div class="block__column">
                    <div class="block__title">
                      {{ $t("outgoing") | capitalize }}
                    </div>
                    <div class="block__value">
                      {{
                        printWidthRange(chart2Data[chart2Data.length - 1][1])
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- <div v-if="VM.status != 'up'" class="Fcloud__info-block block"> -->
              <!-- <div  class="Fcloud__info-block block">
							<div class="Fcloud__block-header">
								<a-icon type="database" theme="filled" />
								Deloy
							</div>
							<div class="Fcloud__block-content">
								<a-row> -->
              <!-- <a-col>
										<a-select v-model="selectedSP" style="width: 300px; margin-right: 10px">
											<a-select-option v-for="sp in servicesProviders.filter(el=> el.type == 'ione')" :key="sp.uuid" :value="sp.uuid">
												{{sp.title}}
											</a-select-option>
										</a-select>
										<a-button type="primary" :loading="deployLoading" @click="deployVM">
											deploy
										</a-button>
									</a-col> -->
              <!-- </a-row>
							</div>
						</div> -->

              <div
                class="Fcloud__info-block block"
                v-if="!(chart1Data.length == 0 || chart2Data.length == 0)"
              >
                <div class="Fcloud__block-header">
                  <a-icon type="line-chart" />
                  {{ $t("graphs") | capitalize }}
                </div>
                <div
                  class="Fcloud__block-content Fcloud__block-content--charts"
                >
                  <a-row type="flex" justify="space-around" style="width: 100%">
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="inbChartDataReady"
                        :options="chartOption('inbound')"
                      />
                    </a-col>
                    <a-col>
                      <GChart
                        type="LineChart"
                        :data="outChartDataReady"
                        :options="chartOption('outgoing')"
                      />
                    </a-col>
                  </a-row>
                </div>
              </div>

              <a-row :gutter="[15, 15]" style="margin-top: 20px" v-if="VM.state">
                <a-col :span="24" :md="12">
                  <div class="button">
                    <a-button
                      type="primary"
                      shape="round"
                      block
                      size="large"
                      @click="openModal('snapshot')"
                    >
                      {{ $t("Snapshots") }}
                    </a-button>
                    <a-modal
                      v-model="snapshots.modal"
                      :title="$t('Snapshots')"
                      :footer="null"
                    >
                      <!-- <div
                        v-if="
                          ((VM.state && VM.state.meta.state != 3) ||
                            (VM.state && VM.state.meta.lsm_state != 3)) &&
                          VM.state &&
                          VM.state.meta.lsm_state != 24
                        "
                        :style="{
                          color: config.colors.err,
                          'text-align': 'center',
                        }"
                      >
                        {{ $t("turn on VM to create or load snapshots") }}
                      </div> -->
                      <!-- <a-table
                        :columns="snapshots.columns"
                        :data-source="snapshots.data"
                        :pagination="false"
                        :loading="snapshots.loading"
                        rowKey="TIME"
                      >
                        <template slot="time" slot-scope="time">
                          {{ getFormatedDate(time) }}
                        </template>
                        <template slot="actions" slot-scope="actions">
                          <a-button
                            icon="caret-right"
                            type="primary"
                            shape="round"
                            :style="{ 'margin-right': '10px' }"
                            @click="revToShapshot(actions)"
                            :disabled="
                              actions.ACTION != undefined ||
                              (VM.state && VM.state.meta.lsm_state != 3) ||
                              (VM.state && VM.state.meta.state != 3)
                            "
                            :loading="
                              snapshots.loadingSnaps.includes(
                                actions.SNAPSHOT_ID
                              )
                            "
                          ></a-button>
                          <a-button
                            icon="close"
                            type="danger"
                            shape="round"
                            @click="RMSnapshot(actions)"
                            :disabled="
                              actions.ACTION != undefined ||
                              (VM.state && VM.state.meta.lsm_state != 3) ||
                              (VM.state && VM.state.meta.state != 3)
                            "
                            :loading="
                              snapshots.loadingSnaps.includes(
                                actions.SNAPSHOT_ID
                              )
                            "
                          ></a-button>
                        </template>
                      </a-table> -->

                      <!-- <div v-for="item in this.VM.state.meta.snapshots" :key="item.name">
                          {{item.name}}{{item.ts}}
                      </div> -->

                      <div
                        v-for="(item, index) in VM.state.meta.snapshots"
                        :key="item.name"
                        style="
                          display: flex;
                          align-items: center;
                          margin-bottom: 10px;
                        "
                      >
                        <a-col style="width: 100%">
                          <div style="display: flex; font-size: 16px">
                            <div style="margin-right: 30px; width: 30%">
                              {{ item.name }}
                            </div>
                            <div style="width: 70%">
                              {{ (item.ts * 1000) | dateFormat }}
                            </div>
                          </div>
                        </a-col>
                        <a-col style="margin-left: auto; display: flex">
                          <!-- :disabled="!VM.state.meta.snapshots" -->
                          <a-button
                            type="primary"
                            @click="revSnapshot(index)"
                            style="margin-right: 10px"
                          >
                            <a-icon type="caret-right" />
                          </a-button>
                          <!-- :disabled=" !VM.state.meta.snapshots" -->
                          <a-button
                            type="danger"
                            @click="deleteSnapshot(index)"
                          >
                            <a-icon type="close"
                          /></a-button>
                        </a-col>
                      </div>

                      <div class="modal__buttons">
                        <!-- :disabled="!VM.state.meta.snapshots" -->
                        <a-button
                          icon="plus"
                          type="primary"
                          shape="round"
                          size="large"
                          @click="openModal('createSnapshot')"
                          >{{ $t("Take snapshot") }}</a-button
                        >
                      </div>
                      <a-modal
                        v-model="snapshots.addSnap.modal"
                        :footer="null"
                        title="Create snapshot"
                      >
                        <p>
                          {{ $t("You can only have 3 snapshots at a time.") }}
                        </p>
                        <p>
                          {{
                            $t(
                              "Each snapshot exists for 24 hours and is then deleted."
                            )
                          }}
                        </p>
                        <p>
                          {{ $t("Choose a name for the new snapshot:") }}
                        </p>
                        <a-input
                          ref="snapNameInput"
                          placeholder="Snapshot name"
                          v-model="snapshots.addSnap.snapname"
                        />
                        <div class="modal__buttons">
                          <a-button
                            shape="round"
                            :style="{ 'margin-right': '10px' }"
                            @click="closeModal('createSnapshot')"
                            >{{ $t("Cancel") }}</a-button
                          >
                          <a-button
                            icon="plus"
                            type="primary"
                            shape="round"
                            :disabled="snapshots.addSnap.snapname.length < 1"
                            :loading="snapshots.addSnap.loading"
                            @click="newsnap()"
                            >{{ $t("Take snapshot") }}</a-button
                          >
                        </div>
                      </a-modal>
                    </a-modal>
                  </div>
                </a-col>

                <a-col :span="24" :md="12">
                  <div class="button">
                    <a-button
                      :disabled="!(VM.state.meta.state === 3 || VM.state.meta.lsm_state === 3)"
                      type="primary"
                      shape="round"
                      block
                      size="large"
                    >
                      <router-link
                        :to="{
                          path: `${$route.params.uuid}/vnc`,
                        }"
                      >
                        VNC
                      </router-link>
                    </a-button>
                  </div>
                </a-col>
              </a-row>
            </div>
          </div>
        </div>
        <loading v-else color="#fff" :style="{'position': 'absolute', 'height':
        '100%', 'width': '100%'}" key="loading" duration: />
      </transition>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import loading from "@/components/loading/loading.vue";
import config from "@/appconfig";
import api from "@/api";
import diskControl from "./openCloud/diskControl";
import bootOrder from "./openCloud/bootOrder";
import networkControl from "./openCloud/networkControl";
import accessManager from "./openCloud/accessManager";
import notification from "../../../mixins/notification";
const columns = [
  {
    title: "Name",
    key: "Name",
    dataIndex: "NAME",
  },
  {
    title: "Time",
    dataIndex: "TIME",
    key: "Time",
    scopedSlots: { customRender: "time" },
  },
  {
    title: "Actions",
    key: "Actions",
    scopedSlots: { customRender: "actions" },
  },
];
const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB"];
export default {
  name: "openCloud",
  components: {
    loading,
    diskControl,
    bootOrder,
    networkControl,
    accessManager,
  },
  mixins: [notification],
  data() {
    return {
      chart1Data: [["Time", ""]],
      chart2Data: [["Time", ""]],
      chart3Data: [["Time", ""]],
      chart4Data: [["Time", ""]],
      chartHead: ["Timestamp"],
      chartOptions: {
        title: "network",
        curveType: "function",
        legend: "none",
        width: 300,
        height: 150,
        vAxis: {
          viewWindowMode: "explicit",
          viewWindow: { min: 0 },
        },
      },
      config,
      status: "running",
      name: "test3",
      showPermissions: false,
      isDeleteLoading: false,
      isRenameLoading: false,
      reinstallPass: "",
      renameNewName: "",
      loadingResizeVM: false,
      modal: {
        reboot: false,
        shutdown: false,
        recover: false,
        snapshot: false,
        menu: false,
        reinstall: false,
        delete: false,
        expand: false,
        diskControl: false,
        bootOrder: false,
        SSH: false,
        networkControl: false,
        accessManager: false,
        rename: false,
        resize: false,
      },
      option: {
        reboot: 0,
        shutdown: 0,
        recover: 0,
      },
      bootOrder: {
        loading: false,
      },
      snapshots: {
        modal: false,
        loading: true,
        columns,
        data: [],
        loadingSnaps: [],
        addSnap: {
          modal: false,
          snapname: "Snapshot",
          loading: false,
        },
      },
      resize: {
        VCPU: 0,
        RAM: 0,
        size: 0,
        scale: "GB",
      },
      menuOptions: [
        {
          title: "Reinstall",
          onclick: this.sendReinstall,
          params: [],
          icon: "exclamation",
        },
        {
          title: "Rename",
          onclick: this.openModal,
          params: ["rename"],
          icon: "tag",
        },
        // {
        //   title: "Access manager",
        //   onclick: this.openModal,
        //   params: ["accessManager"],
        //   icon: "safety",
        // },
        {
          title: "Resize VM",
          onclick: this.changeModal,
          params: ["expand"],
          icon: "arrows-alt",
          forVNC: true,
        },
        // {
        //   title: "Disk control",
        //   onclick: this.changeModal,
        //   params: ["diskControl"],
        //   icon: "container",
        //   forVNC: true,
        // },
        {
          title: "SSH key",
          onclick: this.changeModal,
          params: ["SSH"],
          icon: "safety",
        },
        {
          title: "Network control",
          onclick: this.changeModal,
          params: ["networkControl"],
          icon: "global",
          forVNC: true,
        },
        // {
        //   title: "Boot order",
        //   onclick: this.changeModal,
        //   params: ["bootOrder"],
        //   icon: "ordered-list",
        //   forVNC: true,
        // },
        {
          title: "Delete",
          onclick: this.sendDelete,
          icon: "delete",
          type: "danger",
          forVNC: true,
        },
      ],
      actualAction: "",
      actionLoading: false,
      selectedSP: "",
      deployLoading: false,
    };
  },
  computed: {
    ...mapGetters("nocloud/vms", [
      "getActionLoadingInvoke",
      "getServicesFull",
      "getInstances",
    ]),
    ...mapGetters("support", { baseURL: "getURL" }),
    inbChartDataReady() {
      let data = this.chart1Data;
      if (data == undefined) {
        console.error("can't get chart1");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "bytes"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },
    outChartDataReady() {
      let data = this.chart2Data;
      if (data == undefined) {
        console.error("can't get chart2");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "bytes"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },
    cpuChartDataReady() {
      let data = this.chart3Data;
      if (data == undefined) {
        console.error("can't get chart3");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "%"],
          [0, 0],
        ];
      }
      data = data.map((pair) => [new Date(pair[0] * 1000), parseInt(pair[1])]);
      data.unshift([this.chartHead[0], 'usage']);
      return data;
    },
    ramChartDataReady() {
      let data = this.chart4Data;
      if (data == undefined) {
        console.error("can't get chart4");
        return [[0], [0]];
      }
      if (data[0] == undefined || data[1] == undefined) {
        return [
          [this.chartHead[0], "mb"],
          [0, 0],
        ];
      }
      let range = this.checkRange(data[data.length - 1][1]);
      data = data.map((pair) => [
        new Date(pair[0] * 1000),
        this.fromBytesTo(parseInt(pair[1]), range),
      ]);
      data.unshift([this.chartHead[0], range]);
      return data;
    },

    itemService() {
      const data = this.getServicesFull.find((el) => {
        return this.VM.uuidService === el.uuid;
      });
      return data;
    },
    statusVM() {
      if (this.VM) {
        if (this.VM.state.meta.state === 1) return {
          shutdown: true, reboot: true, recover: true
        }
        return {
          shutdown:
            (this.VM.state.meta.lcm_state == 18 &&
              this.VM.state.meta.state == 3) ||
            (this.VM.state.meta.lcm_state == 20 &&
              this.VM.state.meta.state == 3),
          reboot:
            (this.VM.state.meta.lcm_state == 18 &&
              this.VM.state.meta.state == 3) ||
            (this.VM.state.meta.lcm_state == 20 &&
              this.VM.state.meta.state == 3) ||
            (this.VM.state.meta.lcm_state == 0 &&
              this.VM.state.meta.state == 8),
          start:
            (this.VM.state.meta.lcm_state == 18 &&
              this.VM.state.meta.state == 3) ||
            (this.VM.state.meta.lcm_state == 20 &&
              this.VM.state.meta.state == 3),
          recover:
            (this.VM.state.meta.lcm_state == 18 &&
              this.VM.state.meta.state == 3) ||
            (this.VM.state.meta.lcm_state == 20 &&
              this.VM.state.meta.state == 3),
        };
      }
    },
    VM() {
      for (let instance of this.getInstances) {
        if (instance.uuid === this.$route.params.uuid) {
          this.resize.VCPU = instance.resources.cpu;
          this.resize.RAM = instance.resources.ram / 1024;
          this.resize.size = Math.ceil(instance.resources.drive_size / 1024);
          return instance;
        }
      }
      return {};
    },
    getSP() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    dataSP() {
      const data = this.getSP.find((el) => {
        return el.uuid == this.VM.sp;
      });
      return data;
    },
    vmsLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    stateVM() {
      if (!this.VM.state) return "UNKNOWN";
      if (this.VM.state.meta.state === 1) return "PENDING";
      switch (this.VM.state.meta.lcm_state_str) {
        case "LCM_INIT":
          return "POWEROFF";
        default:
          return this.VM.state.meta.lcm_state_str
            .replaceAll('_', ' ');
      }
    },
    stateColor() {
      switch (this.VM.state && this.VM.state.meta.lcm_state) {
        case 3:
          return "#0fd058";
        // останавливающийся и запускающийся
        case 18:
        case 20:
          return "#919191";
        case 0:
          return "#f9f038";
        default:
          return "rgb(145, 145, 145)";
      }
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    OSName() {
      const i = this.VM?.config?.template_id;

      return this.dataSP?.publicData.templates[i]?.name;
    }
  },
  created() {
    if (this.VM?.uuidService) {
      this.renameNewName = this.VM.title;
      this.$store.dispatch("nocloud/vms/subscribeWebSocket", this.VM.uuidService);
      this.fetchMonitoring();
    }
    if (this.isLogged) {
      this.$store.dispatch("nocloud/vms/fetch");
      this.$store.dispatch("nocloud/sp/fetch");
    }
  },
  destroyed() {
    this.$store.state.nocloud.vms.socket.close(1000, 'Work is done');
  },
  methods: {
    deployVM() {
      this.deployLoading = true;
      // this.$api.services
      //   .up(this.VM.meta.serviceUUID, this.VM.meta.groupUUID, this.selectedSP)
      //   .then(() => {
      //     this.$store.dispatch("nocloud/vms/fetch");
      //     this.$message.success("VM depoyed!");
      //   })
      //   .catch((res) => {
      //     let data = res.response.data;
      //     // console.log(data)
      //     this.$message.error(`Error#${data.code}: ${data.message}`);
      //   })
      //   .finally(() => {
      //     this.deployLoading = false;
      //   });
    },
    disabledMenu(menuName) {
      if (this.VM?.product && menuName === "resize") {
        return true;
      }
      // if(this.SingleCloud.DISABLE.includes(menuName) || (this.SingleCloud.STATE == 3 && this.SingleCloud.LCM_STATE == 2)){
      // 	return true;
      // }
    },
    checkRange(val) {
      let count = 0;
      for (let i = 0; val > 1024; count++) {
        val = val / 1024;
      }
      return sizes[count];
    },
    fromBytesTo(val, newRange) {
      let count = sizes.indexOf(newRange);
      if (count == -1) {
        console.log("can't get such range");
        return;
      }
      while (count > 0) {
        val = val / 1024;
        count--;
      }
      return val;
    },
    chartOption(title) {
      const newOpt = JSON.parse(JSON.stringify(this.chartOptions));
      let range = "";
      let capitalized = "";
      if (title.toLowerCase() == "inbound") {
        range = this.checkRange(this.chart1Data[this.chart1Data.length - 1][1]);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "outgoing") {
        range = this.checkRange(this.chart2Data[this.chart2Data.length - 1][1]);
        capitalized = this.$t(title)[0].toUpperCase() + this.$t(title).slice(1);
      } else if (title.toLowerCase() == "cpu") {
        range = "%"
        capitalized = this.$t(title).toUpperCase();
      } else if (title.toLowerCase() == "ram") {
        range = this.checkRange(this.chart4Data[this.chart4Data.length - 1][1]);
        capitalized = this.$t(title).toUpperCase();
      }
      newOpt.title = `${capitalized} (${range})`;
      return newOpt;
    },
    sendAction(action) {
      const hard = this.option.reboot || action.includes('Hard');
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: action.replace('Hard', ''),
        params: (hard) ? { hard: true } : {},
      }

      if (action === 'recoverYesterday' || action === 'recoverToday') {
        action = action.replace('recover', '');
        this.$api.get(this.baseURL, { params: {
          run: 'create_ticket',
          subject: `Recover VM - ${this.VM.title}`,
          message: `1. ID: ${this.VM.uuid}\n2. Date: ${action}`,
          department: 1,
        }})
          .then((resp) => {
            if (resp.result == "success") {
              this.$message.success("Ticket created successfully");
            } else {
              throw resp;
            }
          })
          .catch((err) => {
            console.error(err);
            this.$message.error("Something went wrong");
          });
        return;
      }
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then(() => {
          const opts = {
            message: `Done!`,
          };
          this.openNotificationWithIcon("success", opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
    fetchMonitoring() {
      const data = {
        uuid: this.VM.uuid,
        uuidService: this.VM.uuidService,
        action: 'monitoring',
      };

      this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          if (res.meta?.NETRX !== undefined) {
            this.chart1Data = res.meta.NETRX;
          }
          if (res.meta?.NETTX !== undefined) {
            this.chart2Data = res.meta.NETTX;
          }
          if (res.meta?.CPU !== undefined) {
            this.chart3Data = res.meta.CPU;
          }
          if (res.meta?.MEMORY !== undefined) {
            this.chart4Data = res.meta.MEMORY;
          }
        })
        .catch((err) => {
          console.error(err);
          this.openNotificationWithIcon("error", {
            message: `Error: ${err.response?.data?.message ?? "Unknown"}.`
          });
        });
    },
    deployService() {
      this.actionLoading = true;
      api.services
        .up(this.itemService.uuid)
        .then(() => {
          const opts = {
            message: `Done!`,
          };
          this.openNotificationWithIcon("success", opts);
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        })
        .finally(() => {
          this.actionLoading = false;
        });
    },
    mbToGb(mb) {
      return (mb / 1024).toFixed(1);
    },
    handleOk(from) {
      this.VM.state.meta.state = 0;

      switch (from) {
        case "reboot":
          this.sendAction("reboot");
          this.modal.reboot = false;
          break;
        case "shutdown":
          if (this.option.shutdown) {
            this.sendAction("poweroffHard");
          } else {
            this.sendAction("poweroff");
          }
          this.modal.shutdown = false;
          break;
        case "recover":
          this.$confirm({
            title: this.$t("Do you want to download a backup?"),
            maskClosable: true,
            content: () => {
              return <div>{ this.$t("All unsaved progress will be lost, are you sure?") }</div>;
            },
            okText: this.$t("Yes"),
            cancelText: this.$t("Cancel"),
            onOk: () => {
              if (this.option.recover) {
                this.sendAction("recoverToday");
              } else {
                this.sendAction("recoverYesterday");
              }
              this.modal.recover = false;
            },
            onCancel() {},
          });
          break;
      }
    },
    printWidthRange(value) {
      let range = this.checkRange(value);
      let newVal = this.fromBytesTo(value, range);
      if (newVal) {
        newVal = Math.round(newVal * 1000) / 1000;
      }
      return `${newVal} ${range}`;
    },
    newsnap() {
      // if (this.snapshots.data.lenght >= 3) {
      //   this.$error({
      //     title: this.$t("You can't have more than 3 snaps at the same time"),
      //     content: this.$t("remove or commit old ones to create new"),
      //   });
      // }

      const data = {
        uuid: this.VM.uuid,
        params: { snap_name: this.snapshots.addSnap.snapname },
        action: "snapcreate",
      };
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          this.openNotificationWithIcon("success", {
            message: "Create Snapshot",
          });
          this.snapshots.addSnap.modal = false;
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
    openModal(name) {
      switch (name) {
        case "start":
          if (this.statusVM.start) return;
          break;
        case "shutdown":
          if (this.statusVM.shutdown) return;
          break;
        case "reboot":
          if (this.statusVM.reboot) return;
          break;
        case "delete":
          if (this.statusVM.delete) return;
          break;
        case "recover":
          if (this.statusVM.recover) return;
          break;
        case "snapshot":
          // if (this.permissions.snapshot) return;
          // this.snapshotsFetch();
          this.snapshots.modal = true;
          break;
        case "createSnapshot":
          // if (this.permissions.snapshot) return;
          // this.snapshotsFetch();
          this.snapshots.addSnap.modal = true;
          break;
      }
      this.modal[name] = true;
    },
    changeModal(name) {
      for (let key in this.modal) {
        this.modal[key] = false;
      }
      this.modal[name] = true;
    },
    closeModal(name) {
      switch (name.toLowerCase()) {
        case "createsnapshot":
          this.snapshots.addSnap.modal = false;
          break;
        default:
          this.modal[name] = false;
      }
    },
    ResizeVM() {
      let confirm = window.confirm("VM will be restarted");
      if (confirm) {
        this.isRenameLoading = true;
        const group = this.itemService.instancesGroups.find((el) => el.sp === this.VM.sp);
        const instance = group.instances.find((el) => el.uuid === this.VM.uuid);

        if (this.VM.billingPlan.kind === 'DYNAMIC') {
          instance.resources.cpu = +this.resize.VCPU;
          instance.resources.ram = this.resize.RAM * 1024;
        } else {
          this.$api.get(this.baseURL, { params: {
            run: 'create_ticket',
            subject: `Resize VM - ${this.VM.title}`,
            message: `1. ID: ${this.VM.uuid}\n2. Resources:\n- cpu: ${this.resize.VCPU}\n- ram: ${this.resize.RAM * 1024}`,
            department: 1,
          }})
            .then((resp) => {
              if (resp.result == "success") {
                this.$message.success("Ticket created successfully");
              } else {
                throw resp;
              }
            })
            .catch((err) => {
              console.error(err);
              this.$message.error("Something went wrong");
            });
        }
        instance.resources.drive_size = this.resize.size * 1024;

        this.$store
          .dispatch("nocloud/vms/updateService", this.itemService)
          .then((result) => {
            if (result) {
              // this.$message.success(this.$t("VM resized successfully"));
              this.openNotificationWithIcon("success", {
                message: "VM resized successfully",
              });
              this.isRenameLoading = false;
              this.closeModal("expand");
            } else {
              this.openNotificationWithIcon("error", {
                message: "Can't VM resize to same size",
              });
              // this.$message.error("Can't resize to same size");
            }
          })
          .catch((err) => {
            // this.$message.error( "Can't resize to same size");
            this.openNotificationWithIcon("error", {
              message: "Can't VM resize to same size",
            });
            console.error(err);
          })
          .finally((res) => {
            this.modal.confirmLoading = false;
          });
      }
    },
    URLparameter(obj, outer = "") {
      var str = "";
      for (var key in obj) {
        if (key == "price") continue;
        if (str != "") {
          str += "&";
        }
        if (typeof obj[key] == "object") {
          str += this.URLparameter(obj[key], outer + key);
        } else {
          str += outer + key + "=" + encodeURIComponent(obj[key]);
        }
      }
      return str;
    },
    deleteSnapshot(index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: "snapdelete",
      };
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          this.openNotificationWithIcon("success", {
            message: "Delete Snapshot",
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
    revSnapshot(index) {
      const data = {
        uuid: this.VM.uuid,
        params: { snap_id: +index },
        action: "snaprevert",
      };
      this.$store
        .dispatch("nocloud/vms/actionVMInvoke", data)
        .then((res) => {
          this.openNotificationWithIcon("success", {
            message: "Revert Snapshot",
          });
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
          };
          this.openNotificationWithIcon("error", opts);
        });
    },
    getFormatedDate(dstring) {
      const date = new Date(+(dstring + "000"));
      return date.toLocaleString();
    },
    sendRename() {
      if (this.renameNewName !== "") {
        const group = this.itemService.instancesGroups.find((el) => el.sp === this.VM.sp);
        const instance = group.instances.find((el) => el.uuid === this.VM.uuid);

        this.isRenameLoading = true;
        instance.title = this.renameNewName;
        this.$store
          .dispatch("nocloud/vms/updateService", this.itemService)
          .then((result) => {
            if (result) {
              this.$message.success(this.$t("VM name changes successfully"));
              this.isRenameLoading = false;
              this.closeModal("rename");
              this.closeModal("menu");
            } else {
              this.openNotificationWithIcon("error", {
                message: "Can't VM name changes",
              });
            }
          })
          .catch(() => {
            this.openNotificationWithIcon("error", {
              message: "Can't VM name changes",
            });
          })
          .finally((res) => {
            this.modal.confirmLoading = false;
          });
      }
      // api
      //   .sendVMaction("VMChangeName", { newVmName: this.renameNewName })
      //   .then((res) => {
      //     if (res.result == "success") {
      //       this.$store.dispatch(
      //         "cloud/silentUpdate",
      //         this.$route.params.pathMatch
      //       );
      //       this.closeModal("rename");
      //       this.closeModal("menu");
      //       this.renameNewName = "";
      //       this.$message.success(this.$t("vm name changes successfully"));
      //       this.isRenameLoading = false;
      //     } else {
      //       throw res;
      //     }
      //   })
      //   .catch((err) => {
      //     console.error(err);
      //   });
    },
    sendReinstall() {
      if (this.disabledMenu("reinstall")) {
        this.$store
          .dispatch("utils/createTicket", {
            subject: `[generated]: Reinstall VM#${this.$route.params.pathMatch}`,
            message: `VM#${this.$route.params.pathMatch} имеет аддон, запрещающий автопереустановку. Необходимо выполнить перустановку вручную.`,
          })
          .then(() => {
            this.$message.success("Order created successuffly");
            this.closeModal("reinstall");
          })
          .catch(() => {
            this.$message.success("Some error during creation order");
          });
        return;
      }
      this.$confirm({
        title: this.$t("Do you want to reinstall this virtual machine?"),
        okType: "danger",
        content: (h) => (
          <div style="color:red;">{ this.$t("All data will be deleted!") }</div>
        ),
        onOk: () => {
          this.sendAction("reinstall");
          this.modal.menu = false;
          this.modal.reinstall = false;
        },
        onCancel: () => {
          this.modal.reinstall = false;
        },
      });
    },
    sendDelete() {
      this.$confirm({
        title: this.$t("Do you want to delete this virtual machine?"),
        okType: "danger",
        content: () => (
          <div style="color:red">{this.$t("All data will be deleted!")}</div>
        ),
        onOk: () => {
          const group = this.itemService.instancesGroups.find(
            (el) => el.uuid === this.VM.uuidInstancesGroups
          );

          this.isDeleteLoading = true;
          group.instances = group.instances.filter(
            (inst) => inst.uuid !== this.VM.uuid
          );
          group.resources.ips_public = group.instances.length ;
          this.$store
            .dispatch("nocloud/vms/updateService", this.itemService)
            .then((result) => {
              if (result) {
                this.openNotificationWithIcon("success", {
                  message: "VM deleted successfully",
                });

                this.$router.push({ path: '/cloud' });
              } else {
                this.openNotificationWithIcon("error", {
                  message: "Failed to delete VM",
                });
              }
            })
            .catch(() => {
              this.openNotificationWithIcon("error", {
                message: "Failed to delete VM",
              });
            })
            .finally(() => {
              this.isDeleteLoading = false;
            });
        },
        onCancel: () => {
          this.modal.delete = false;
        },
      });
    },
    bootOrderNewState() {
      this.closeModal("bootOrder");
    },
    addToClipboard({ target }) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(target.innerText)
          .then(() => {
            this.openNotificationWithIcon("success", {
              message: 'Text copied'
            });
          })
          .catch((res) => {
            console.error(res);
          });
      } else {
        this.openNotificationWithIcon("error", {
          message: 'Clipboard is not supported!'
        });
      }
    }
  },
  watch: {
    "VM.uuidService"() {
      if (!this.VM.uuidService) return;
      this.renameNewName = this.VM.title;
      this.$store.dispatch("nocloud/vms/subscribeWebSocket", this.VM.uuidService);
      this.fetchMonitoring();
    },
  },
};
</script>
<style>
.cloud__container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.cloud__fullscreen {
  background: var(--main);
  display: flex;
}
.cloud__fullscreen--while {
  background: #fff;
}
.Fcloud {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.Fcloud__header {
  position: sticky;
  padding-top: 10px;
  color: var(--bright_font);
  top: 0;
  background-color: var(--main);
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
}
.Fcloud__header-title {
  position: relative;
  transition: transform 0.3s ease;
}
.Fcloud__title {
  font-weight: bold;
  font-size: 24px;
  line-height: 1;
}
.Fcloud__status {
  text-transform: uppercase;
  font-weight: bold;
  font-size: 14px;
  color: var(--bright_font);
  opacity: 0.7;
}
.Fcloud__status-color {
  position: absolute;
  height: 15px;
  width: 15px;
  background-color: var(--bright_font);
  border-radius: 50%;
  top: 55%;
  left: -25px;
  transform: translateY(-50%);
}
.Fcloud__buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20px;
}
.Fcloud__button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.Fcloud__BTN-icon {
  padding: 10px;
  background: var(--bright_bg);
  border-radius: 14px;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
}
.Fcloud__BTN-title {
  color: var(--bright_font);
  opacity: 0.8;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  transition: color 0.1s ease, text-shadow 0.1s ease, opacity 0.1s ease;
}
.Fcloud__button:hover .Fcloud__BTN-icon {
  background-color: #fff;
  box-shadow: 2px 2px 7px rgba(0, 0, 0, 0.2);
}
.Fcloud__button:hover .Fcloud__BTN-title {
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 1);
  opacity: 1;
}
.Fcloud__button:active {
  transform: scale(1.05);
}
.Fcloud__button.disabled {
  opacity: 0.8;
  transform: scale(0.8);
  color: #c9c9c9;
}
.Fcloud__button.disabled .Fcloud__BTN-title {
  color: var(--bright_font);
  opacity: 0.8;
}
.Fcloud__button.disabled:hover {
  transform: scale(0.81);
}
.Fcloud__info {
  background: var(--bright_bg);
  flex: 1 0;
  border-radius: 35px 35px 0 0;
  margin-top: 30px;
  padding: 10px 30px 0;
  overflow: auto;
}
.Fcloud__info-header {
  text-align: center;
}
.Fcloud__back {
  font-weight: bold;
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
}
.Fcloud__menu-btn {
  font-size: 1.4rem;
}
.Fcloud__info-title {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}
.Fcloud__main-info {
  margin-top: 20px;
  background: #fff;
  border-radius: 15px;
  padding: 15px 0;
}
.Fcloud__table td {
  padding: 0 15px;
}
.Fcloud__table td:first-child {
  color: rgba(0, 0, 0, 0.5);
}
.Fcloud__main-info--invoice {
  display: flex;
  align-items: stretch;
  color: #32af32;
  background-color: #c5eec5;
  min-height: 2px;
  padding: 0;
  overflow: hidden;
}
.Fcloud__main-info--invoice .icon {
  padding: 5px 15px;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.Fcloud__main-info--invoice .content {
  font-weight: bold;
  flex: 1 0;
  padding: 15px 0;
}
.Fcloud__main-info--invoice .link {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  padding: 5px 15px;
  border-left: 1px solid #32af3260;
  color: #32af32;
  text-decoration: underline;
  transition: background-color 0.2s ease;
}
.Fcloud__main-info--invoice .link:hover {
  background-color: #b9e6b9;
}
.block {
  margin-top: 10px;
}
.Fcloud__block-header {
  font-weight: 700;
  font-size: 1rem;
  color: #919392;
}
.Fcloud__block-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 8px;
  font-size: 1rem;
  background-color: #fff;
  border-radius: 20px;
  padding: 10px 0;
}
.Fcloud__block-content--charts {
  flex-wrap: wrap;
}
.block__column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.block__title {
  color: #919392;
}
.ssh-text {
  border-bottom: 1px solid rgba(0, 0, 0, 0.65);
  cursor: pointer;
  transition: 0.3s;
}
.ssh-text:hover {
  border-bottom: 0px solid rgba(0, 0, 0, 0);
}
.permissions td:not(:first-child) {
  text-align: center;
  width: 80px;
}
.permissions th {
  text-align: center;
  font-weight: 600;
}
.permissions td:first-child {
  color: #919392;
}
.glowing-animations {
  animation: glowing 1.5s ease infinite;
}
@keyframes glowing {
  from,
  to {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
/* ANIMATIONS AFTER LOADING */
.opencloud-enter-active,
.opencloud-leave-active {
  transition: opacity 0.6s;
}
.opencloud-enter,
.opencloud-leave-to {
  opacity: 0;
}
.opencloud-enter-active .Fcloud__header-title {
  transition: transform 0.2s 0.4s ease;
}
.opencloud-enter .Fcloud__header-title {
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}
.opencloud-enter-active .Fcloud__info {
  transition: opacity 0.2s 0.2s ease, transform 0.2s 0.2s ease;
}
.opencloud-enter .Fcloud__info {
  transform: translateY(200px);
  opacity: 0;
}
.opencloud-enter-active .Fcloud__button {
  transition: opacity 0.2s 0.1s ease, transform 0.2s 0.1s ease;
}
.opencloud-enter .Fcloud__button {
  transform: scale(0.5) rotate(15deg);
  opacity: 0;
}
.cloud__icon {
  height: 0.8em;
  width: 0.8em;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 2px;
}
.button--mt20 {
  margin-top: 20px;
}
.modal__buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
/* disabled button animation */
.disabled:active {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.menu__button:not(:last-child) {
  margin-bottom: 10px;
}
@keyframes shake {
  10%,
  90% {
    transform: translateX(-1px) scale(0.85);
  }
  20%,
  80% {
    transform: translateX(2px) scale(0.85);
  }
  30%,
  50%,
  70% {
    transform: translateX(-4px) scale(0.85);
  }
  40%,
  60% {
    transform: translateX(4px) scale(0.85);
  }
}
</style>
