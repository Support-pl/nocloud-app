<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">
				<div class="order__option">
					<a-slider
            v-if="sizes.length < 6"
            tooltip-placement="bottom"
						:marks="{...sizes}"
						:value="sizes.indexOf(options.size)"
            :tip-formatter="(value) => sizes[value]"
						:tooltip-visible="true"
						:max="sizes.length-1"
						:min="0"
						@change="(value) => options.size = sizes[value]"
					/>

          <a-carousel v-else arrows draggable adaptive-height :dots="false" :slides-to-show="3" :slides-to-scroll="3">
            <div
              class="order__slider-item"
              v-for="size of sizes"
              :key="size"
              :class="{ 'order__slider-item--active': options.size === size }"
              @click="options.size = size"
            >
              {{ size }}
            </div>

            <template #prevArrow>
              <div class="custom-slick-arrow" style="left: -35px;">
                <a-icon type="left-circle" />
              </div>
            </template>

            <template #nextArrow>
              <div class="custom-slick-arrow" style="right: -35px">
                <a-icon type="right-circle" />
              </div>
            </template>
          </a-carousel>

          <transition name="specs" mode="out-in">
            <div
              v-if="typeof getProducts.description === 'string'"
              v-html="getProducts.description"
            ></div>
            <table v-else-if="getProducts.description" class="product__specs">
              <tr v-for="resource in getProducts.description" :key="resource.name">
                <td>{{ resource.name }}</td>
                <td>{{ resource.value }}</td>
              </tr>
            </table>
          </transition>
				</div>
			</div>

			<div class="order__calculate order__field">
				<a-row style="margin-top: 20px" type="flex" justify="space-around" align="middle">
					<a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
						{{ $t('Pay period') }}:
					</a-col>

					<a-col :xs="12" :sm="18" :lg='12'>
						<a-select style="width: 100%" v-if="!fetchLoading" v-model="options.period">
							<a-select-option v-for="period in periods" :key="period" :value='period'>
								{{ $t(period) }}
							</a-select-option>
						</a-select>
						<div v-else class="loadingLine"></div>
					</a-col>
				</a-row>

        <a-row style="margin-top: 20px" type="flex" justify="space-around" align="middle">
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Payment method') | capitalize }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <a-select style="width: 100%" v-if="!fetchLoading" v-model="options.payment">
              <a-select-option
                v-for="method of payMethods"
                :key="method.module"
                :value="method.module"
              >
                {{ method.displayname }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine"></div>
          </a-col>
        </a-row>

				<a-divider orientation="left" style="margin-bottom: 0">
					{{ $t('Total') }}:
				</a-divider>

				<a-row type="flex" justify="space-around" style="font-size: 1.5rem">
					<a-col>
						<transition name="textchange" mode="out-in">
							<div v-if="!fetchLoading">
								{{ getProducts.price[options.period] }} {{ getProducts.price.currency }}
							</div>
							<div v-else class="loadingLine loadingLine--total"></div>
						</transition>
					</a-col>
				</a-row>

				<a-row type="flex" justify="space-around" style="margin: 10px 0">
					<a-col :span="22">
						<a-button type="primary" block shape="round" @click="orderConfirm">
							{{ $t('order') | capitalize }}
						</a-button>
						<a-modal
							:title="$t('Confirm')"
							:visible="modal.confirmCreate"
							:confirm-loading="sendloading"
							:cancel-text="$t('Cancel')"
							@ok="orderClickHandler"
							@cancel="() => {modal.confirmCreate = false}"
						>
							<p>{{ $t('order_services.Do you want to order') }}: {{ getProducts['name'] }}</p>

							<a-row style="margin-top: 20px">
								<a-col>
									<a-checkbox :checked="modal.goToInvoice" @change="(e) => modal.goToInvoice = e.target.checked" />
                  {{ $t('go to invoice') | capitalize }}
								</a-col>
							</a-row>
						</a-modal>
					</a-col>
				</a-row>

        <add-funds
          v-if="addfunds.visible"
          :sum="addfunds.amount"
          :modalVisible="addfunds.visible"
          :hideModal="() => addfunds.visible = false"
        />
			</div>
		</div>
	</div>
</template>

<script>
import addFunds from '@/components/balance/addFunds.vue';

export default {
  name: 'iaas-component',
  components: { addFunds },
	data:() => ({
    sizes: [],
    products: [],
    payMethods: [],
    fetchLoading: false,
    sendloading: false,
    options: { size: '', payment: '', period: '' },
    modal: {
      confirmCreate: false,
      confirmLoading: false,
      goToInvoice: true
    },
    addfunds: { visible: false, amount: 0 },
    periods: []
	}),
	methods: {
		fetch(){
			this.fetchLoading = true;
			this.$store.dispatch('products/fetchServices')
        .then((res) => {
          const { prod } = {
	"prod": [
		{
			"id": 2,
			"name": "WHMCS and Bitrix24 integration",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/wb.png\"><div>\r\n30-DNIOWA DEMO - WYPRÓBUJ MODUŁ ZA DARMO.<br><br>Nasze rozwiązanie nie jest gotowym modułem i wymaga pewnych prac wdrożeniowych.\r\n<br><br>\r\nCo będzie zrobione: <br>\r\nKonta mogą być automatycznie importowane z WHMCS do b24 (lub odwrotnie).<br>\r\nZamówienia są również automatycznie importowane z WHMCS do b24 i dołączane do klientów (lub odwrotnie).<br>\r\nBilety zostaną automatycznie zaimportowane do Bitrix24, a menedżer automatycznie otrzyma zlecenia i będzie mógł na nie odpowiedzieć.\r\n<br><br>\r\nIstnieje również wiele innych funkcji (importowanie faktur, itp.).<br>\r\nDodatkowe funkcje zostaną omówione i ocenione oddzielnie.<br>\r\n\r\nW razie jakichkolwiek pytań, proszę kontaktować z nami. </div><br><div>Dowiedz się więcej na\r\n</div>\r\n",
			"paytype": "onetime",
			"price": [
				{
					"id": 2,
					"type": "product",
					"currency": 1,
					"relid": 2,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 20,
					"type": "product",
					"currency": 3,
					"relid": 2,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "800.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 26,
					"type": "product",
					"currency": 4,
					"relid": 2,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "800.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 58,
			"name": "PayU and Bitrix24 Integration Module",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/payu.png\">\r\n\r\n<div>Integracja Bitrix24 i popularnego systemu płatności PayU.</div>\r\n<div class=\"prod_desc_list\"><i class=\"far fa-check-circle\"></i> Łatwa instalacja <br><i class=\"far fa-check-circle\"></i> Kilka systemów płatności z Twoim Bitrix24<br><i class=\"far fa-check-circle\"></i> Płatność rachunków za pośrednictwem PayU (link do płatności bezpośrednio w dokumencie faktury)<br><i class=\"far fa-check-circle\"></i> Możliwość płacenia rachunków za pomocą karty kredytowej, debetowej, w bankowości internetowej, portfelu elektronicznym itp.</div>\r\n<div> Aplikacja sprawia, że płacenie rachunków jest łatwiejsze dla klienta i szybsze. </div>",
			"paytype": "recurring",
			"price": [
				{
					"id": 287,
					"type": "product",
					"currency": 4,
					"relid": 58,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 288,
					"type": "product",
					"currency": 1,
					"relid": 58,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 289,
					"type": "product",
					"currency": 3,
					"relid": 58,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 60,
			"name": "ServerSMS and Bitrix24 Integration App",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/ServerSMS.pl and Bitrix24 Integration App.png\">\r\n<div>Aplikacja do integracji Bitrix24 z serwisem wysyłającym SMS Serwersms.pl.\r\nWysyłaj różne wiadomości do klientów (SMS, MMS, VMS, wiadomości w Viber) bezpośrednio z kart kontaktowych w Bitrix24 CRM.</div>\r\n<div class=\"prod_desc_list\"><i class=\"far fa-check-circle\"></i> wysyłaj prywatne wiadomości lub wysyłaj pocztą masową;<br><i class=\"far fa-check-circle\"></i> śledzić status wiadomości;<br><i class=\"far fa-check-circle\"></i> skonfiguruj nazwę nadawcy i nie tylko.</div>",
			"paytype": "free",
			"price": [
				{
					"id": 299,
					"type": "product",
					"currency": 4,
					"relid": 60,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 300,
					"type": "product",
					"currency": 1,
					"relid": 60,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 301,
					"type": "product",
					"currency": 3,
					"relid": 60,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 72,
			"name": "Check company by NIP",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/nip.png\">\r\n<div>Automatyczne tworzenie firmy w Bitrix24 po NIP w oparciu o dane GUS.</div>\r\n<div class=\"prod_desc_list\"><i class=\"far fa-check-circle\"></i> Wyszukaj dane firmy według numeru NIP<br><i class=\"far fa-check-circle\"></i> Automatyczne uzupełnianie pól w profilu firmowym (Pobieranie danych z GUS)<br><i class=\"far fa-check-circle\"></i> Natychmiastowe sprawdzenie w wykazie podatników VAT<br><i class=\"far fa-check-circle\"></i> Edycja pól i wypełnienie niezbędnych pól profilu w Bitrix24</div>",
			"paytype": "recurring",
			"price": [
				{
					"id": 335,
					"type": "product",
					"currency": 4,
					"relid": 72,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 336,
					"type": "product",
					"currency": 1,
					"relid": 72,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 337,
					"type": "product",
					"currency": 3,
					"relid": 72,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 74,
			"name": "WHMCS-B24 SOLUTION INSTALLATION",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/wb.png\">\r\n<br>✓ Solution installation<br>✓ Basic setup<br>✓ Contact base import<br>✓ Synchronization of systems<br>✓ FREE with the purchase of Bitrix24",
			"paytype": "onetime",
			"price": [
				{
					"id": 341,
					"type": "product",
					"currency": 4,
					"relid": 74,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "90.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 342,
					"type": "product",
					"currency": 1,
					"relid": 74,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "390.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 343,
					"type": "product",
					"currency": 3,
					"relid": 74,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "90.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 75,
			"name": "MAPs Mobile",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/maps_app.png\">\r\n<div>Planuj  dostawy lub spotkania z klientami w oparciu o ich pozycję geograficzną</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Wyświetlanie leadów, dealów, kontaktów, firm bezpośrednio na mapie\r\n<i class=\"far fa-check-circle\"></i>Planowanie trasy z wizytą wielu punktów\r\n<i class=\"far fa-check-circle\"></i>  Wbudowane w deal, kontakt, kalendarz\r\n<i class=\"far fa-check-circle\"></i> Tworzenie zadania z wykazem adresów bezpośrednio z aplikacji\r\n<i class=\"far fa-check-circle\"></i> Rozpocznij określanie punktów\r\n<i class=\"far fa-check-circle\"></i> Import do excel i dodaj plik do Lead / Deal\r\n<i class=\"far fa-check-circle\"></i> Zaawansowany filtr obiektów\r\n<i class=\"far fa-check-circle\"></i> Promień wyszukiwania i lista obiektów\r\n\r\nDowiedz się więcej na  <a href=\"https://maps.support.pl/\" target=\"_blank\">https://maps.support.pl/</a>\r\n\r\nObejrzyj wideo, jak to działa \r\n<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/d0C1Dfcp34o\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 344,
					"type": "product",
					"currency": 4,
					"relid": 75,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 345,
					"type": "product",
					"currency": 1,
					"relid": 75,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 346,
					"type": "product",
					"currency": 3,
					"relid": 75,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 76,
			"name": "Numerator",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/numerator_app.png\">\r\n<div>Użyj numerator do oddzielenia faktur swoich firm - utwórz różne automatyczne numerowanie faktur według szablonu dla różnych firm i firm, które korzystają z tego samego portalu Bitrix24.</div>\r\n\r\n<div>\r\nNumerator niestandardowy to:</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Samodzielne tworzenie i przypisywanie szablonu (pola specjalne: numer seryjny lub losowy, data bieżącego dnia, miesiąca lub roku, Twój separator, a także tworzenie własnych opisów do numeracji);\r\n<i class=\"far fa-check-circle\"></i> Automatyczne liczenie zmienionych faktur i brak ręcznego numerowania;\r\n<i class=\"far fa-check-circle\"></i>  Uporządkowany sposób dystrybucji dokumentów;\r\n<i class=\"far fa-check-circle\"></i>  Natychmiastowe przypisanie faktury\r\n\r\nObejrzyj wideo, jak to działa \r\n<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/RGP6daV2PYc\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\r\n\r\n<div>BONUS: Instalacja aplikacji na Twoim portalu jest już wliczona w cenę!</div>\r\n</div>",
			"paytype": "recurring",
			"price": [
				{
					"id": 347,
					"type": "product",
					"currency": 4,
					"relid": 76,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "100.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 348,
					"type": "product",
					"currency": 1,
					"relid": 76,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "450.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 349,
					"type": "product",
					"currency": 3,
					"relid": 76,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 77,
			"name": "Price management",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/price_app.png\">\r\n<div>Aplikacja do automatycznego stosowania rabatów i zarządzania cenami</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Rabaty na produkty według ilości\r\n<i class=\"far fa-check-circle\"></i> Segmentacja Klientów\r\n<i class=\"far fa-check-circle\"></i>  Tymczasowe rabaty, wyprzedaże i promocje\r\n\r\nDowiedz się więcej na  <a href=\"https://price-management.support.pl/\" target=\"_blank\">https://price-management.support.pl/</a>\r\n\r\nObejrzyj wideo, jak to działa \r\n<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/XzXkHNiEJDo\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\r\n\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 350,
					"type": "product",
					"currency": 4,
					"relid": 77,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 351,
					"type": "product",
					"currency": 1,
					"relid": 77,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 352,
					"type": "product",
					"currency": 3,
					"relid": 77,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 86,
			"name": "Archiwum",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/arh_en.png\">\r\n<div>Kompleksowe rozwiązanie zapewniające prawidłowe przetwarzanie dokumentów.</div>\r\n<br>\r\n<div><b>\r\nFUNKCJONALNOŚĆ APLIKACJI OBEJMUJE:\r\n</b></div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Rejestracja przychodzących dokumentów: ręcznie i automatycznie z sieci folderów lub z wiadomości e-mail\r\n<i class=\"far fa-check-circle\"></i> 2 etapy przetwarzania dokumentów: początkowy i główny\r\n<i class=\"far fa-check-circle\"></i> Zaawansowane wyszukiwanie we wszystkich polach opisujących dokument\r\n<i class=\"far fa-check-circle\"></i> Przypisanie odpowiedzialności za wstępne przetworzenie dokumentu\r\n<i class=\"far fa-check-circle\"></i> Dystrybucja dokumentów przychodzących między kilkoma osobami prawnymi\r\n<i class=\"far fa-check-circle\"></i> Automatyczne wyznaczenie osoby odpowiedzialnej za przetwarzanie dokumentu na podstawie jego powiązania z firmą\r\n<i class=\"far fa-check-circle\"></i> Przypisywanie specjalnych etykiet (tagi)\r\n<i class=\"far fa-check-circle\"></i> Archiwum dokumentów\r\n<i class=\"far fa-check-circle\"></i> Łączenie dokumentów w jeden plik\r\n<i class=\"far fa-check-circle\"></i> Dodawanie metryki dokumentu (krótki opis na ostatnim arkuszu)\r\n<i class=\"far fa-check-circle\"></i> Szybki podgląd dokumentu na dowolnym etapie\r\n<i class=\"far fa-check-circle\"></i> Komentowanie dokumentu i historię zmian dokumentów\r\n\r\nDowiedz się więcej na <a href=\"https://docs.support.pl/\" target=\"_blank\">https://docs.support.pl/</a>\r\n\r\nObejrzyj wideo, jak to działa \r\n<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/mJDrIuqGGZQ\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\r\n\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 401,
					"type": "product",
					"currency": 4,
					"relid": 86,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 402,
					"type": "product",
					"currency": 1,
					"relid": 86,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 403,
					"type": "product",
					"currency": 3,
					"relid": 86,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 88,
			"name": "Aplikacja &quot;Fakturowanie&quot; dla Bitrix24",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/invoice_app.png\">\r\n<div>Kompleksowe rozwiązanie do organizacji szczegółów przetwarzania dokumentów oraz faktur przychodzących i wychodzących</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> System rozpoznawania wymagań (pól) (sieć neuronowa odczytuje pola dokumentu i przesyła je do Bitrix24);\r\n<i class=\"far fa-check-circle\"></i> Fakturowanie (szczegółowe przetwarzanie faktur z akceptacją i elastyczną edycją);\r\n<i class=\"far fa-check-circle\"></i> Alokacja kosztów do centrów kosztów (podziel koszty faktury na różne centra i typy kosztów);\r\n<i class=\"far fa-check-circle\"></i> Przetwarzanie dokumentów standardowych i poufnych;\r\n<i class=\"far fa-check-circle\"></i> Dystrybucja praw dostępu, wyznaczenie osoby odpowiedzialnej za zatwierdzanie dokumentów;\r\n<i class=\"far fa-check-circle\"></i> Eksport listy dokumentów do pliku XML i innego formatu;\r\n<i class=\"far fa-check-circle\"></i> Elastyczne raporty dotyczące dokumentów.\r\n\r\nDowiedz się więcej, jak to działa w serwisie  <a href=\"https://obieg-faktur.support.pl/\" target=\"_blank\">https://obieg-faktur.support.pl/</a>\r\n\r\n<div>Wypróbuj aplikację za darmo już teraz! Zainstaluj go na swoim Bitrix24 i korzystaj z 14-dniowego demo za darmo.</div>\r\n\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 407,
					"type": "product",
					"currency": 4,
					"relid": 88,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "200.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 408,
					"type": "product",
					"currency": 1,
					"relid": 88,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "920.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 409,
					"type": "product",
					"currency": 3,
					"relid": 88,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "230.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 89,
			"name": "HR data / Vacation / Offs",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/hr_app.png\">\r\n<div>Aplikacja do przechowywania, edycji, szybkiego dostępu do danych pracowników oraz zarządzania urlopami i nieobecnościami.</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Przechowywanie danych osobowych (Informacje systemowe (ogólne) i zamknięte o pracowniku)\r\n<i class=\"far fa-check-circle\"></i> Rejestrowanie historii zmian danych osobowych\r\n<i class=\"far fa-check-circle\"></i> Rejestracja urlopów i nieobecności\r\n<i class=\"far fa-check-circle\"></i> Raporty dla HR i CEO w sprawie danych pracowników oraz umów o pracę\r\n\r\nDowiedz się więcej na <a href=\"https://hr.support.pl/\" target=\"_blank\">https://hr.support.pl/</a>\r\n\r\nObejrzyj wideo, jak to działa \r\n<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/11o6uUQ_LLg\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 410,
					"type": "product",
					"currency": 4,
					"relid": 89,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 411,
					"type": "product",
					"currency": 1,
					"relid": 89,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 412,
					"type": "product",
					"currency": 3,
					"relid": 89,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 91,
			"name": "Calculator in Deals",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/calc_pl.png\">\r\n<div>Specjalny moduł bezpośrednio wbudowany w kartę Deal, za pomocą którego możesz zarządzać wszystkimi kosztami produktów z uwzględnieniem różnych walut, a kalkulator automatycznie obliczy marżę Deal.</div>\r\n<div>Po zainstalowaniu modułu na karcie Deal pojawi się dodatkowa zakładka \"Kalkulator\", w której można pracować z następującymi wskaźnikami:</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i> Ustawianie kursu wymiany;\r\n<i class=\"far fa-check-circle\"></i> Rozliczanie kosztów wg produktu (Cena zakupu produktu, Cena transportu, Cena pakowania);\r\n<i class=\"far fa-check-circle\"></i> Marża produktu;\r\n<i class=\"far fa-check-circle\"></i> Całkowita sprzedaż i kwota marży (Marża, Suma marży, Procent marży).\r\n\r\n\r\nWIĘCEJ SZCZEGÓŁÓW  <a href=\"https://b24.support.pl/kalkulator-marza/\" target=\"_blank\">https://b24.support.pl/</a>\r\n\r\n\r\n</div>\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 428,
					"type": "product",
					"currency": 4,
					"relid": 91,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 429,
					"type": "product",
					"currency": 1,
					"relid": 91,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 430,
					"type": "product",
					"currency": 3,
					"relid": 91,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 101,
			"name": "Instalacja aplikacji i konsultacje (1 godzina)",
			"description": "✓ instalacja aplikacji w portalu <br>\r\n✓ ustawienie standardowych funkcji aplikacji <br>\r\n✓ konsultacja lub szkolenie online (jednorazowe) <br>",
			"paytype": "onetime",
			"price": [
				{
					"id": 479,
					"type": "product",
					"currency": 4,
					"relid": 101,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "40.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 480,
					"type": "product",
					"currency": 1,
					"relid": 101,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "200.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 481,
					"type": "product",
					"currency": 3,
					"relid": 101,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "39.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 102,
			"name": "Instalacja aplikacji i konsultacje (2 godziny)",
			"description": "✓ instalacja aplikacji w portalu <br>\r\n✓ ustawienie standardowych funkcji aplikacji <br>\r\n✓ konsultacja lub szkolenie online (jednorazowe) <br>",
			"paytype": "onetime",
			"price": [
				{
					"id": 482,
					"type": "product",
					"currency": 4,
					"relid": 102,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "85.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 483,
					"type": "product",
					"currency": 1,
					"relid": 102,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "400.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 484,
					"type": "product",
					"currency": 3,
					"relid": 102,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "80.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 103,
			"name": "Instalacja aplikacji i konsultacje (3 godziny)",
			"description": "✓ instalacja aplikacji w portalu <br>\r\n✓ ustawienie standardowych funkcji aplikacji <br>\r\n✓ konsultacja lub szkolenie online (jednorazowe) <br>",
			"paytype": "onetime",
			"price": [
				{
					"id": 485,
					"type": "product",
					"currency": 4,
					"relid": 103,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "130.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 486,
					"type": "product",
					"currency": 1,
					"relid": 103,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "560.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 487,
					"type": "product",
					"currency": 3,
					"relid": 103,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "120.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 105,
			"name": "T-Mobile BILLING",
			"description": "",
			"paytype": "free",
			"price": [
				{
					"id": 491,
					"type": "product",
					"currency": 4,
					"relid": 105,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 492,
					"type": "product",
					"currency": 1,
					"relid": 105,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 493,
					"type": "product",
					"currency": 3,
					"relid": 105,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 106,
			"name": "Backup",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/Archive.png\">\r\nAplikacja do automatycznego tworzenia kopii zapasowych danych Twojego portalu\r\n\r\nApplication functionality:\r\n<li>Backup danych potencjalnych klientów, ofert, kontaktów, firm, zadań\r\n<li>Zapisywanie pliku .csv w bitrix24.disk. wygodne jest zaimportowanie pliku kopii zapasowej do CRM\r\n<li>Ustawienie częstotliwości tworzenia kopii zapasowych: codziennie, co tydzień, co miesiąc\r\nwysłanie powiadomienia o wykonanej kopii zapasowej na pocztę pracownika lub w portalu Bitrix24\r\n<li>Historia kopii zapasowych\r\n<li>Natychmiastowe tworzenie aktualnego pliku stanu\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 494,
					"type": "product",
					"currency": 4,
					"relid": 106,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "25.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 495,
					"type": "product",
					"currency": 1,
					"relid": 106,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "120.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 496,
					"type": "product",
					"currency": 3,
					"relid": 106,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "25.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 108,
			"name": "Shipper",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/Shipper.png\">\r\n<div>Wysyłaj paczki i śledź status przesyłek bezpośrednio w CRM</div>\r\n\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i>  połączenie między deal a paczką\r\n<i class=\"far fa-check-circle\"></i> drukowanie etykiet\r\n<i class=\"far fa-check-circle\"></i> śledzenie statusu paczki\r\n<i class=\"far fa-check-circle\"></i> synchronizacja statusu z etapami dealów w CRM\r\n<i class=\"far fa-check-circle\"></i> uruchamianie wyzwalaczy podczas aktualizacji statusów (np. powiadomienia klientów)\r\n<i class=\"far fa-check-circle\"></i> obserwowanie całej listy paczek\r\n\r\nCzytaj więcej <a href=\"https://shipper.support.pl/\" target=\"_blank\">https://shipper.support.pl/ </a>\r\n</div>\r\n\r\n",
			"paytype": "recurring",
			"price": [
				{
					"id": 500,
					"type": "product",
					"currency": 4,
					"relid": 108,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 501,
					"type": "product",
					"currency": 1,
					"relid": 108,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 502,
					"type": "product",
					"currency": 3,
					"relid": 108,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 109,
			"name": "Shipper",
			"description": "Create parcels directly in CRM and track the status of parcels from popular services (InPost, DHL, DPD) directly in CRM",
			"paytype": "recurring",
			"price": [
				{
					"id": 503,
					"type": "product",
					"currency": 4,
					"relid": 109,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 504,
					"type": "product",
					"currency": 1,
					"relid": 109,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 505,
					"type": "product",
					"currency": 3,
					"relid": 109,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 111,
			"name": "Symfonia TEMP",
			"description": "",
			"paytype": "recurring",
			"price": [
				{
					"id": 509,
					"type": "product",
					"currency": 4,
					"relid": 111,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 510,
					"type": "product",
					"currency": 1,
					"relid": 111,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 511,
					"type": "product",
					"currency": 3,
					"relid": 111,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "-1.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		},
		{
			"id": 114,
			"name": "MeetMe",
			"description": "<img class=\"img_prod\" src=\"/templates/six_supportby/img/meet.png\">\r\n<div>Aplikacja dla automatyzacji procesu rezerwacji terminów w oparciu na wcześniej skonfigurowany harmonogram lub rozkład.</div>\r\n<div>Funkcjonalność aplikacji:</div>\r\n<div class=\"prod_desc_list\">\r\n<i class=\"far fa-check-circle\"></i>Automatyzacja z kalendarzem Bitrix24\r\n<i class=\"far fa-check-circle\"></i>Prosty formularz rezerwacji spotkań\r\n<i class=\"far fa-check-circle\"></i>Powiadomienia  automatyczne w Bitrix24\r\n<i class=\"far fa-check-circle\"></i>Odpowiedzi automatyczne w Bitrix24\r\n<i class=\"far fa-check-circle\"></i>Automatyczne tworzenie zadania w Bitrix24\r\n<i class=\"far fa-check-circle\"></i>Ustawienia według roli\r\n\r\n\r\n\r\nDowiedz się więcej na  <a href=\"https://rezerwacja.support.pl/\" target=\"_blank\">https://rezerwacja.support.pl/</a>\r\n</div>",
			"paytype": "recurring",
			"price": [
				{
					"id": 518,
					"type": "product",
					"currency": 4,
					"relid": 114,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 519,
					"type": "product",
					"currency": 1,
					"relid": 114,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "480.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				},
				{
					"id": 520,
					"type": "product",
					"currency": 3,
					"relid": 114,
					"msetupfee": "0.00",
					"qsetupfee": "0.00",
					"ssetupfee": "0.00",
					"asetupfee": "0.00",
					"bsetupfee": "0.00",
					"tsetupfee": "0.00",
					"monthly": "-1.00",
					"quarterly": "-1.00",
					"semiannually": "-1.00",
					"annually": "99.00",
					"biennially": "-1.00",
					"triennially": "-1.00"
				}
			]
		}
	]
}

          this.products = prod.sort((a, b) => b.name - a.name);
          this.products.forEach(({ description }, i) => {
            this.products[i].description = description.replace('/templates', 'https://my.support.pl/templates');
          });

          this.sizes = this.products.map((el) => el.name);
          this.options.size = this.sizes[0];

          this.periods = Object.entries(this.products[0].price[0]).filter(
            ([key, value]) => key.match(/ly/) && value > -1
          ).map((el) => el[0]);
          this.options.period = this.periods[0];
        })
        .catch(err => console.error(err))
        .finally(() => {
          this.fetchLoading = false;
        });
		},
		orderClickHandler(){
			const info = {
        run: 'add_product',
				billingcycle: this.options.period,
				product: this.getProducts.id,
        paymentmethod: this.options.payment
			}

			if(!this.user){
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'IaaS',
					title: this.$route.query.service,
					cost: this.getProducts.price[this.options.period]
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createService(info);
				});
				this.$router.push({name: 'login'});
				return
			}

			this.createService(info);
		},
		createService(info){
			this.sendloading = true;
			this.$api.get(this.baseURL, { params: info })
        .then((result) => {
          if (this.modal.goToInvoice){
            this.$router.push({ name: 'invoiceFS', params: { uuid: result.invoiceid } });
          } else {
            this.$router.push({ name: 'services' });
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.sendloading = false;
        });
		},
		orderConfirm(){
			if (this.options.payment === '') {
				this.$message.error(this.$t('Choose your payment method'));
				return
			}
      if (!this.checkBalance()) return;
			this.modal.confirmCreate = true;
		},
    checkBalance() {
      const sum = this.getProducts.price[this.options.period];

      if (this.user.balance < parseFloat(sum)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance.'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - this.user.balance);
            this.addfunds.visible = true;
          }
        });
        return false;
      }
      return true;
    }
	},
	computed: {
		getProducts() {
			if(Object.keys(this.products).length == 0) return "NAN"
      const product = this.products[this.sizes.indexOf(this.options.size)]

      if (typeof product.description !== 'string') return product
      if (/<\/?[a-z][\s\S]*>/i.test(product.description)) {
        return product
      } else {
        product.description = product.description.split('\r\n').map(
          (res) => ({ name: res.split(': ')[0], value: res.split(': ')[1] })
        )
        product.description.pop()

        product.price = product.price.find(({ currency }) => currency === this.user.currency)
        product.price.currency = this.user.currency_code
      }

			return product
		},
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    baseURL() {
      return this.$store.getters['nocloud/auth/getURL'];
    }
	},
	created() {
    this.$api.get(this.baseURL, { params: { run: 'get_payment' } })
      .then((res) => {
        this.payMethods = res.paymentmethod;
        this.options.payment = res.paymentmethod[0].module;
      });

		this.$store.dispatch('nocloud/auth/fetchBillingData');
		this.fetch();
	},
  watch: {
    'options.size'() {
      this.periods = Object.entries(this.getProducts.price).filter(
        ([key, value]) => key.match(/ly/) && value > -1
      ).map((el) => el[0]);

      this.options.period = this.periods[0];
    }
  }
}
</script>

<style>
.order_wrapper{
	position: relative;
	width: 100%;
	min-height: 100%;
}

.order{
	position: absolute;
	margin-top: 15px;
	margin-bottom: 15px;
	width: 100%;
	max-width: 1024px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
}

.product__specs{
	--color: rgb(126, 126, 126);
	color: var(--color);
	margin: 0 auto;
	--border-color: #dbdbdb;
	--border-line-weight: 1px;
	--border-line-type: solid;
	width: 80%;
	font-size: 1.2rem;
}

.product__specs td{
	padding: 10px 20px;
	position: relative;
}

.product__specs td:nth-child(1){
	font-weight: 500;
}

.product__specs td:nth-child(2){
	text-align: right;
	color: rgba(0, 0, 0, .7)
}

.product__specs tr{
	border-bottom: var(--border-line-weight) var(--border-line-type) var(--border-color);
}

.product__specs td:last-child::before{
	content: '';
	width: 2px;
	height: 50%;
	background: #f5f5f5;
	display: block;
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
}

.order__prop:not(:first-child){
	margin-top: 15px;
}

.order__inputs{
	margin-right: 20px;
	width: 72%;
}

.order__option .ant-slider-mark {
  display: none;
}

.order__option .ant-carousel {
  width: calc(100% - 50px);
  margin: 0 auto;
}

.order__option .ant-carousel .slick-slide > div {
  margin: 0 5px;
}

.order__option .ant-carousel .custom-slick-arrow {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: var(--main);
  opacity: 0.5;
  transition: 0.3s;
}
.order__option .ant-carousel .custom-slick-arrow::before {
  display: none;
}
.order__option .ant-carousel .custom-slick-arrow:hover {
  opacity: 1;
}

.order__field{
	border-radius: 20px;
	box-shadow:
		5px 8px 10px rgba(0, 0, 0, .08),
		0px 0px 12px rgba(0, 0, 0, .05);
	padding: 20px;
	background-color: #fff;
	height: max-content;
}

.order__calculate{
	width: 28%;
	font-size: 1.1rem;
	padding: 10px 15px 10px;
}

.order__field-header{
	text-align: center;
	font-size: 1.2rem;
	font-weight: bold;
	margin-bottom: 20px;
}

.order__template{
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-start;
}

.order__template.one-line{
	flex-wrap: nowrap;
	justify-content: space-between;
}

.order__template-item{
	width: 116px;
	margin-bottom: 10px;
	background-color: #fff;
	box-shadow:
		3px 2px 6px rgba(0, 0, 0, .08),
		0px 0px 8px rgba(0, 0, 0, .05);
	border-radius: 15px;
	transition: box-shadow .2s ease, transform .2s ease;
	cursor: pointer;
	text-align: center;
	overflow: hidden;

	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: max-content auto;
}

.order__template-item:not(:last-child){
	margin-right: 10px;
}

.order__template-item:hover{
	box-shadow:
		5px 8px 10px rgba(0, 0, 0, .08),
		0px 0px 12px rgba(0, 0, 0, .05);
}

.order__template-item.active{
	box-shadow:
		5px 8px 12px rgba(0, 0, 0, .08),
		0px 0px 13px rgba(0, 0, 0, .05);
	transform: scale(1.02);
}

.order__template-image{
	padding: 10px;
}

.order__template-image__rate{
	font-size: 2rem;
}

.order__template-name{
	padding: 10px;
}

.order__template-item.active .order__template-name{
	background-color: var(--main);
	color: var(--bright_font);
}

.max-width{
	width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content{
	border-radius: 0 0 28px 28px;
}

.slider_btn{
	cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title{
	margin: 0;
	margin-top: 4px;
}

.removeMarginSkeleton{
	min-width: 75px;
}

.total.removeMarginSkeleton{
	width: 100%;
}

.order__slider{
	display: flex;
  gap: 10px;
	overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item{
	flex-shrink: 0;
	/* border: 1px solid rgba(0, 0, 0, .15); */
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 7px 10px;
  text-align: center;
	cursor: pointer;
	border-radius: 15px;
	font-size: 1.1rem;
	transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
	background-color: var(--main);
	color: #fff;
}


.order__slider-item--loading{
	/* background-color: #f2f2f2; */
	box-shadow: none;
	/* animation: glowing .5s ease infinite; */
	animation-name: glowing;
	animation-duration: 1s;
	animation-timing-function: ease;
	animation-iteration-count: infinite;
	animation-direction: alternate;
}

.loadingLine{
	min-width: 100px;
	width: 100%;
	height: 2rem;
	border-radius: 4px;
	animation-name: glowing;
	animation-duration: 1s;
	animation-timing-function: ease;
	animation-iteration-count: infinite;
	animation-direction: alternate;
}

.loadingLine--total{
	margin-top: 10px;
	height: 26px;
}

@keyframes glowing {
	from {
		background-color: #f2f2f2;
	}
	to {
		background-color: #e9e9e9;
		/* background-color: red; */
	}
}

@media screen and (max-width: 1024px) {
	.order{
		flex-direction: column;
		padding: 10px;
		margin-top: 0px;
		overflow: auto;
	}
	.order__inputs{
		margin: 0;
		border-radius: 20px 20px 0 0;
		width: auto;
	}
	.order__field{
		box-shadow: none;
		flex-grow: 0;
	}
	.order__calculate{
		border-radius: 0 0 20px 20px;
		width: auto;
	}
}

@media screen and (max-width: 576px) {
	.order__template{
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: stretch;
	}
	.order__template-item{
		grid-template-columns: max-content auto;
		grid-template-rows: 1fr;
		width: auto;
		height: 50px;
	}
	.order__template-item:not(:last-child){
		margin-right: 0px;
	}
	.order__template-image{
		width: 50px;
		height: 50px;
		padding: 4px;
	}
	.order__template-image__rate{
		line-height: 42px;
		font-size: 1.4rem;
	}
	.order__template-image img{
		object-fit: contain;
		width: 100%;
		height: 100%;
	}
	.order__template-name{
		text-align: left;
		line-height: 30px;
		display: flex;
	}
	.order__template-type{
		width: 56px;
	}
	.order__template-name ul{
		display: flex;
		justify-content: space-around;
		list-style: none;
		flex: 1
	}
	.order__template-name ul li{
		margin-left: 20px;
	}
}

.specs-enter-active,
.specs-leave-active {
  transition: all .15s ease;
}

.specs-enter{
  transform: translateX(-1em);
  opacity: 0;
}

.specs-leave-to{
  transform: translateX(1em);
  opacity: 0;
}


.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter{
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to{
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
