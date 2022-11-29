<template>
  <div class="ssl-page">
    <div class="container">
      <div class="ssl-page-card">
        <template v-if="data">
          <div class="ssl__top">
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.registration_date") }}
              </div>

              <span>{{
                new Intl.DateTimeFormat().format(new Date(data.regdate))
              }}</span>
            </div>
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.product_service") }}
              </div>

              <span
                >{{ $t("ssl_product.SSL certificate") }} - {{ data.name }}
                <a-tag :color="getTagColor">
                  {{ $t(data.status) }}
                </a-tag></span
              >
              <a :href="data.domain">{{ data.domain }}</a>
            </div>
            <a-row>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.first_payment") }}
                  </div>
                  <span>{{ data.firstpaymentamount }} BYN</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.renewal_amount") }}
                  </div>
                  <span>{{ data.recurringamount }} BYN</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.payment_cycle") }}
                  </div>
                  <span>{{ $t("ssl_product." + data.billingcycle) }}</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.next_payment_date") }}
                  </div>
                  <span>{{
                    new Intl.DateTimeFormat().format(new Date(data.nextduedate))
                  }}</span>
                </div>
              </a-col>
            </a-row>
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.payment_method") }}
              </div>
              <span>{{ data.paymentmethodname }}</span>
            </div>
          </div>

          <div class="ssl__table">
            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.status") }}</div>
              <div>{{ $t("ssl_product." + data.SSL.sslstatus) }}</div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.ssl_status") }}</div>
              <div>{{ $t("ssl_product." + data.SSL.configdata.status) }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.valid_from") }}</div>
              <div>{{ data.SSL.configdata.valid_from }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.expires") }}</div>
              <div>{{ data.SSL.configdata.valid_till }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.subscription_starts") }}</div>
              <div>{{ data.SSL.configdata.begin_date }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.subscription_ends") }}</div>
              <div>{{ data.SSL.configdata.end_date }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.next_renewal") }}</div>
              <div><b>Renew SSL within 91 days</b></div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.domain") }}:</div>
              <div>{{ data.SSL.configdata.domain }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.dcv_method === 'email'"
            >
              <div>{{ $t("ssl_product.approver_email") }}</div>
              <div>{{ data.SSL.configdata.approver_method.email }}</div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.partner_order_id") }}</div>
              <div>{{ data.SSL.configdata.partner_order_id }}</div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.dcv_method === 'dns'"
            >
              <div>{{ $t("ssl_product.dns_cname_record") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.approver_method.dns.record"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              class="ssl__table__item"
              v-if="method.includes(data.SSL.configdata.dcv_method)"
            >
              <div>{{ $t("ssl_product.hash_file") }}</div>
              <div>
                <a-textarea
                  :value="
                    data.SSL.configdata.approver_method[
                      data.SSL.configdata.dcv_method
                    ].link
                  "
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              class="ssl__table__item"
              v-if="method.includes(data.SSL.configdata.dcv_method)"
            >
              <div>{{ $t("ssl_product.content") }}</div>
              <div>
                <a-textarea
                  :value="
                    data.SSL.configdata.approver_method[
                      data.SSL.configdata.dcv_method
                    ].content
                  "
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>
            <!-- ---------------------------------- -->
            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.certificate_crt") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.crt_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              class="ssl__table__item"
              v-if="data.SSL.configdata.status == 'active'"
            >
              <div>{{ $t("ssl_product.intermediate_chanfiles") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.ca_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>
            <!-- ---------------------------- -->
            <div
              class="ssl__table__item"
              v-if="method.includes(data.SSL.configdata.dcv_method)"
            >
              <div>SANs:</div>
              <div class="ssl__table__item-sans__wrap">
                <div class="ssl__table__item-sans" style="padding: 0">
                  <div class="ssl__table__item-sans__item">
                    {{ data.SSL.configdata.san[0].san_name }}
                  </div>
                  <div class="ssl__table__item-sans__item">
                    <div>{{ $t("ssl_product.hash_file") }}</div>
                    <div>
                      <a-textarea
                        :value="
                          data.SSL.configdata.approver_method[
                            data.SSL.configdata.dcv_method
                          ].link
                        "
                        :auto-size="{ minRows: 2, maxRows: 6 }"
                      />
                    </div>
                  </div>
                  <div class="ssl__table__item-sans__item">
                    <div>{{ $t("ssl_product.content") }}</div>
                    <div>
                      <a-textarea
                        :value="
                          data.SSL.configdata.approver_method[
                            data.SSL.configdata.dcv_method
                          ].content
                        "
                        :auto-size="{ minRows: 2, maxRows: 6 }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.certificate_signing_request") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.csr_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.actions") }}</div>
              <div class="ssl__table__item__button__wrap">
                <a-button v-if="data.SSL.configdata.status == 'active'"
                  ><router-link
                    :to="{
                      name: 'certificate',
                      params: { reissue: true },
                    }"
                    >{{ $t("ssl_product.reissue_certificate") }}</router-link
                  ></a-button
                >

                <a-button
                  v-if="data.SSL.configdata.status == 'processing'"
                  @click="modal.confirmCreate = true"
                >
                  {{ $t("ssl_product.Domain Validation method") }}
                </a-button>

                <a-button
                  :loading="resendLoading"
                  v-if="
                    data.SSL.configdata.status === 'processing' &&
                    data.SSL.configdata.dcv_method === 'email'
                  "
                  @click="resendValidationEmail"
                >
                  {{ $t("ssl_product.Resend Validation Email") }}
                </a-button>

                <a-button
                  :loading="revalidateLoading"
                  v-if="
                    data.SSL.configdata.status === 'processing' &&
                    methodRevalidate.includes(data.SSL.configdata.dcv_method)
                  "
                  @click="revalidate"
                >
                  {{ $t("ssl_product.Revalidate") }}
                </a-button>

                <a-button
                  v-if="method.includes(data.SSL.configdata.dcv_method)"
                  @click="
                    download(
                      'txt',
                      data.SSL.configdata.approver_method[
                        data.SSL.configdata.dcv_method
                      ].content,
                      data.SSL.configdata.approver_method[
                        data.SSL.configdata.dcv_method
                      ].filename
                    )
                  "
                  >{{ $t("ssl_product.download_validation_file") }}</a-button
                >

                <div v-for="(val, key) of fileinfo" :key="key">
                  <a-button
                    v-if="data.SSL.configdata.status == 'active'"
                    @click="download(key, data.SSL.configdata[val])"
                    >{{ $t("ssl_product.download") }} {{ key.toUpperCase() }}</a-button
                  >
                </div>

                <a-modal
                  :title="$t('Confirm')"
                  :visible="modal.confirmCreate"
                  :confirm-loading="modal.confirmLoading"
                  :cancel-text="$t('Cancel')"
                  @ok="handleOk"
                  @cancel="handleCancel"
                >
                  <a-form-model :model="action_data">
                    <a-form-model-item :label="$t('ssl_product.DCV Method')">
                      <a-select v-model="action_data.dcv">
                        <a-select-option
                          v-for="item in dcv_list"
                          :value="item"
                          :key="item"
                        >
                          {{ item }}
                        </a-select-option>
                      </a-select>
                    </a-form-model-item>

                    <a-form-model-item
                      :label="$t('ssl_product.email')"
                      v-if="action_data.dcv === 'EMAIL'"
                    >
                      <a-select v-model="action_data.email">
                        <a-select-option
                          v-for="item in email_list"
                          :key="item"
                          :value="`${item}${data.domain}`"
                        >
                          {{ item }}{{ data.domain }}
                        </a-select-option>
                      </a-select>
                    </a-form-model-item>
                  </a-form-model>
                </a-modal>
              </div>
            </div>
          </div>
        </template>
        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script>
import loading from "@/components/loading/loading.vue";
import api from "@/api.js";
export default {
  name: "SSL_certificate",
  components: {
    loading,
  },
  data() {
    return {
      data: "",
      dcv_list: ["EMAIL", "HTTP", "HTTPS", "DNS"],
      action_data: {
        dcv: "EMAIL",
      },
      email_list: [
        "admin@",
        "administrator@",
        "hostmaster@",
        "webmaster@",
        "postmaster@",
      ],
      fileinfo: {
        csr: "csr_code",
        crt: "crt_code",
        ca: "ca_code",
      },
      method: ["http", "https"],
      methodRevalidate: ["http", "https", "dns"],
      resendLoading: false,
      revalidateLoading: false,
      modal: {
        confirmCreate: false,
        confirmLoading: false,
      },
    };
  },
  computed: {
    getTagColor() {
      switch (this.data.status) {
        case "Active":
          return "green";
          break;
        case "Pending":
          return "orange";
          break;
        case "Cancelled":
          return "red";
          break;

        default:
          break;
      }
      return "";
    },
  },
  methods: {
    download(ext, text, fullname = null) {
      const domain = this.data.SSL.configdata.domain;
      let filename;

      if (fullname) {
        filename = fullname;
      } else {
        filename = domain.replace(".", "_") + "." + ext;
      }

      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      );
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    revalidate() {
      const data = {
        remoteid: this.data.SSL.remoteid,
        domain: this.data.SSL.configdata.domain,
      };
      this.revalidateLoading = true;
      api
        .sendAsUser(
          "moduleTouch",
          { ...data, ...{ path: "ssl/revalidate" } },
          "moduleTouch.phpssl"
        )
        .then((resp) => {
          if (resp.error) {
            throw resp;
          }
          if (resp.success) {
            this.$message.success(resp.message);
            this.revalidateLoading = false;
          }
        })
        .catch((err) => {
          console.error(err);
          this.$message.error(err.description);
        })
        .finally(() => (this.loading = false));
    },
    resendValidationEmail() {
      const data = {
        remoteid: this.data.SSL.remoteid,
      };
      this.resendLoading = true;
      api
        .sendAsUser(
          "moduleTouch",
          { ...data, ...{ path: "ssl/resendValidationEmail" } },
          "moduleTouch.phpssl"
        )
        .then((resp) => {
          if (resp.error) {
            throw resp;
          }
          if (resp.success) {
            this.$message.success(resp.message);
            this.resendLoading = false;
          }
        })
        .catch((err) => {
          console.error(err);
          this.$message.error(err.description);
        })
        .finally(() => (this.loading = false));
    },
    handleOk() {
      const data = {
        remoteid: this.data.SSL.remoteid,
        dcv:
          this.action_data.dcv === "EMAIL"
            ? this.action_data.email
            : this.action_data.dcv,
        domain: this.data.SSL.configdata.domain,
      };

      this.modal.confirmLoading = true;
      api
        .sendAsUser(
          "moduleTouch",
          { ...data, ...{ path: "ssl/changeValidationMethod" } },
          "moduleTouch.phpssl"
        )
        .then((resp) => {
          if (resp.error) {
            throw resp;
          }
          if (resp.success) {
            this.modal.confirmLoading = false;
            location.reload();
          }
        })
        .catch((err) => {
          console.error(err);
          this.$message.error(err.description);
        })
        .finally(() => (this.loading = false));
    },
    handleCancel() {
      this.modal.confirmCreate = false;
    },
  },
  created() {
    api
      .sendAsUser("services.getInfo", {
        serviceid: this.$route.params.id,
      })
      .then((res) => {
        this.data = res;
        this.$set(this.action_data, "email", `admin@${res.domain}`);
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
</script>

<style scoped>
.ssl-page {
  padding-top: 20px;
}
.ssl-page-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 15px 15px;
  margin-bottom: 20px;
}
.ssl-page__info {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.ssl-page__info-title {
  font-weight: bold;
}
.ssl__payment .ssl-page__info {
  width: 50%;
}
.ssl__table {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid #d9d9d9;
  margin-top: 30px;
}
.ssl__table__item {
  width: 100%;
  display: flex;
  border-bottom: 1px solid #d9d9d9;
}
.ssl__table__item:last-child {
  border-bottom: 0;
}
.ssl__table__item > div {
  padding: 20px 10px;
  display: flex;
  align-items: center;
}
.ssl__table__item div:first-child {
  border-right: 1px solid #d9d9d9;
  font-weight: 500;
  width: 30%;
}
.ssl__table__item div:last-child {
  width: 70%;
}
.ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-right: 0;
}
.ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans__item {
  padding: 0;
  width: 100%;
  border-bottom: 1px solid #d9d9d9;
  display: flex;
}
.ssl__table__item .ssl__table__item-sans__wrap {
  padding: 0;
}
.ssl__table__item .ssl__table__item-sans__item:first-child {
  padding: 20px 10px;
  font-weight: normal;
  border-right: 0;
}
.ssl__table__item
  .ssl__table__item-sans__wrap
  .ssl__table__item-sans__item:last-child {
  border-bottom: 0;
}
.ssl__table__item-sans__item div {
  padding: 20px 10px;
  display: flex;
  align-items: center;
}
.ssl__table__item-sans__item div:first-child {
  width: 20%;
}
.ssl__table__item-sans__item div:last-child {
  padding: 20px 10px;
  width: 80%;
}
.ssl__table__item__button__wrap {
  flex-wrap: wrap;
}
.ssl__table__item__button__wrap > div {
  margin: 5px;
}
.ssl__table__item__button__wrap > button {
  margin: 5px;
}
@media screen and (max-width: 768px) {
  .ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans {
    overflow-x: scroll;
  }
  .ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans__item {
    width: 600px;
  }
}
</style>
