import api from "@/api.js";
import { capitalize } from "vue";

export function debounce(func, ms) {
  let timeout;

  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), ms);
  };
}

export function getDisk(key) {
  const keys = key?.match(/[0-9]{1,}x[0-9]{1,}/g) ?? [];

  return keys.reduce((sum, key) => {
    const [count, size] = key.split("x");

    return sum + count * size;
  }, 0);
}

export function toDate(timestamp, sep = ".", timeFormat = true, reverse) {
  if (timestamp < 1) return "-";

  const date = new Date(isNaN(+timestamp) ? timestamp : timestamp * 1000);
  const time = date.toTimeString().split(" ")[0];

  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (`${month}`.length < 2) month = `0${month}`;
  if (`${day}`.length < 2) day = `0${day}`;

  let result = `${day}${sep}${month}${sep}${year}`;

  if (reverse) {
    result = `${year}${sep}${month}${sep}${day}`;
  }
  if (timeFormat === true) result += ` ${time}`;
  else if (typeof timeFormat !== "string") {
    result += "";
  } else if (timeFormat.split(":").length === 2) {
    result += ` ${time.slice(0, 5)}`;
  } else if (timeFormat.split(":").length === 3) {
    result += ` ${time}`;
  }

  return result;
}

export function setValue(path, value, result) {
  if (!path || typeof path !== "string") {
    console.error("[Error]: Path is not valid - ", path);
    return;
  }

  path.split(".").forEach((key, i, array) => {
    if (i === array.length - 1) result[key] = value;
    else result = result[key];
  });
}

export function getTarification(timestamp) {
  const day = 3600 * 24;
  const month = day * 30;
  const year = day * 365;

  switch (+timestamp) {
    case 3600:
      return "Hourly";
    case day:
      return "Daily";
    case month:
      return "Monthly";
    case year:
      return "Annually";
    case year * 2:
      return "Biennially";
  }
}

export function getPeriods(productSize, plans) {
  const value = [];
  const types = new Set();
  const day = 3600 * 24;
  const month = day * 30;
  const year = day * 365;

  plans.forEach((plan) => {
    types.add(plan.type);

    if (plan.kind === "DYNAMIC") {
      value.push({ value: "Hourly", label: "ssl_product.Hourly" });
    }

    if (plan.kind !== "STATIC") return;
    const periods = Object.values(plan.products)
      .filter(({ title }) => title === productSize)
      .map((el) => +el.period);

    if (value.find(({ period }) => periods.includes(period))) return;
    if (periods.includes(day)) {
      value.push({ value: "Daily", label: "daily", period: day });
    }

    if (periods.includes(month)) {
      value.push({
        value: "Monthly",
        label: "ssl_product.Monthly",
        period: month,
      });
    }

    if (periods.includes(year)) {
      value.push({ value: "Annually", label: "annually", period: year });
    }

    if (periods.includes(year * 2)) {
      value.push({
        value: "Biennially",
        label: "biennially",
        period: year * 2,
      });
    }
  });

  if (types.size > 1) return;
  value.sort((a, b) => (a.value === "Hourly" ? 1 : a.period - b.period));

  return value;
}

export function getInstStatusColor(status) {
  switch (status) {
    case "RUNNING":
    case "Active":
      return "var(--success)";
    // останавливающийся и запускающийся
    case "BOOT":
    case "BUILD":
    case "BOOT_POWEROFF":
    case "SHUTDOWN_POWEROFF":
      return "var(--warn)";
    case "LCM_INIT":
    case "STOPPED":
    case "SUSPENDED":
      return "#ff9140";
    case "OPERATION":
    case "PENDING":
    case "Pending":
      return "var(--main)";
    default:
      return "var(--err)";
  }
}

export function transformInstances(instances) {
  return instances.map((inst) => {
    const regexp =
      /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

    const publicIPs = inst.state?.meta?.networking?.public?.filter(
      (el) => !regexp.test(el)
    );
    const state = inst.state?.meta?.lcm_state_str ?? inst.state?.state;
    let status = "UNKNOWN";

    switch (state) {
      case "LCM_INIT":
        status = "POWEROFF";
        break;
      default:
        if (state) status = state.replaceAll("_", " ");
    }

    if (inst.state?.meta.state === 1) status = "PENDING";
    if (inst.state?.meta.state === 5) status = "SUSPENDED";
    if (inst.data.suspended_manually) status = "SUSPENDED";
    if (inst.state?.meta.state === "BUILD") status = "BUILD";
    if (!inst.state && !inst.data.is_monitored) status = "INIT";

    const result = {
      ...inst,
      sp: inst.sp,
      orderid: inst.uuid,
      groupname: "Self-Service VDS SSD HC",
      invoicestatus: null,
      domainstatus: status,
      productname: inst.title,
      domain: publicIPs?.at(0),
      date: inst.data.next_payment_date * 1000 || 0,
      orderamount: inst.billingPlan.products[inst.product]?.price ?? 0,
    };

    setInstByType(inst, result);
    return result;
  });
}

function setInstByType(inst, result) {
  switch (inst.type) {
    case "vdc":
      result.groupname = "VDC";
      break;
    case "cpanel":
      result.groupname = "Shared Hosting";
      result.domain = inst.config.domain;
      break;
    case "openai":
      result.groupname = "OpenAI";
      break;
    case "empty":
    case "virtual":
      result.groupname = "Custom";
      break;
    case "acronis":
      result.groupname = "Acronis";
      break;
    case "opensrs":
      result.groupname = "Domains";
      result.date = inst.data.expiry?.expiredate ?? 0;
      result.domain = inst.resources.domain;
      break;
    case "goget":
      setGogetInst(inst, result);
      break;

    case "ovh":
      setOvhInst(inst, result);
      break;

    case "ione":
      setIoneInst(inst, result);
  }
}

function setGogetInst(inst, result) {
  const key = `${inst.resources.period} ${inst.resources.id}`;

  result.groupname = "SSL";
  result.date = +`${inst.resources.period}`;
  result.domain = inst.resources.domain;
  result.orderamount = inst.billingPlan.products[key]?.price ?? 0;
}

function setOvhInst(inst, result) {
  const key = !inst.product
    ? `${inst.config.duration} ${inst.config.planCode}`
    : inst.product;

  result.date =
    (inst.data.expiration * 1000 || null) ??
    (inst.data.next_payment_date * 1000 || 0);
  result.orderamount = inst.billingPlan.products[key]?.price ?? 0;

  inst.config.addons?.forEach((addon) => {
    const addonKey = inst.billingPlan.type.includes("dedicated")
      ? `${inst.config.duration} ${inst.config.planCode} ${addon}`
      : `${inst.config.duration} ${addon}`;

    const { price } = inst.billingPlan.resources.find(
      ({ key }) => key === addonKey
    ) ?? { price: 0 };

    result.orderamount += +price;
  });
}

function setIoneInst(inst, result) {
  const keys = [];

  result.orderamount += +inst.billingPlan.resources
    .reduce((prev, curr) => {
      if (keys.includes(curr.key)) return prev;
      else keys.push(curr.key);

      if (curr.key === `drive_${inst.resources.drive_type.toLowerCase()}`) {
        return prev + (curr.price * inst.resources.drive_size) / 1024;
      } else if (curr.key === "ram") {
        return prev + (curr.price * inst.resources.ram) / 1024;
      } else if (inst.resources[curr.key]) {
        return prev + curr.price * inst.resources[curr.key];
      }
      return prev;
    }, 0)
    ?.toFixed(2);
}

export async function createRenewInvoice(instance, service, account, baseURL) {
  // try {
  //   // const response = await api.get(baseURL, {
  //   //   params: {
  //   //     run: 'invoice_instans_renew',
  //   //     uuid_instans: instance.uuid,
  //   //     uuid_service: service,
  //   //     uuid_account: account
  //   //   }
  //   // })
  //   // const url = response.redirect_url ?? response
  //   // setTimeout(() => { window.open(url, '_blank') }, 300)
  //   return url
  // } catch (error) {
  //   const url = error.response?.data.redirect_url ?? error.response?.data[0] ?? error[0]
  //   if (url.startsWith && url.startsWith('http')) {
  //     window.open(url, '_blank')
  //   }
  //   return url
  // }
}

export function checkPayg(instance) {
  const { config } = instance ?? {};
  const { type, kind } = instance.billingPlan ?? instance.billing_plan ?? {};

  if (type === "openai") return true;
  if (config.duration === "P1H") return true;
  return type === "ione" && kind === "DYNAMIC";
}

export function generateUuid() {
  const result = [];

  for (let i = 0; i < 4; i++) {
    result.push(
      window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
    );
  }

  return result.join("-");
}

export function setChartsTheme(charts, isDark = true) {
  for (const chart of charts) {
    const rect = chart.querySelector("svg[aria-label] > rect");
    const texts = chart.querySelectorAll(
      "svg[aria-label] > g text[text-anchor]"
    );

    rect.setAttribute("fill", "var(--bright_bg)");
    for (const text of texts) {
      const color = isDark
        ? "rgba(255, 255, 255, 0.85)"
        : "rgba(0, 0, 0, 0.65)";

      text.setAttribute("fill", color);
    }
  }
}

export function onError({ target }) {
  target.src = "/img/OS/default.png";
}

export function getImageName(name) {
  return name
    .toLowerCase()
    .replace(/[-_\d]/g, " ")
    .split(" ")[0];
}

export function toKebabCase(text) {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function toPascalCase(text) {
  return text.replace(/(^\w|-\w)/g, (text) =>
    text.replace(/-/, "").toUpperCase()
  );
}

export function toInvoice(transaction, type = "default") {
  if (type == "whmcs") {
    let status = "Unpaid";

    if (Number(+new Date(transaction.datepaid) / 1000 > 0)) {
      status = "Paid";
    }

    return {
      id: transaction.id,
      payment_invoice_id: transaction.id,
      uuid: null,
      created: toDate(
        Number(+new Date(transaction.created_at) / 1000),
        "-",
        false,
        true
      ),
      deadline: null,
      payment: toDate(
        Number(+new Date(transaction.duedate) / 1000),
        "-",
        false,
        true
      ),
      total: transaction.total,
      status,
      credit: transaction.credit,
      service: transaction.service,
      currencycode: transaction.currencycode,
      meta: transaction.meta,
      type: "NO_ACTION",
    };
  } else {
    const status = capitalize(transaction.status.toLowerCase());

    return {
      id: transaction.number,
      payment_invoice_id: transaction.meta?.whmcs_invoice_id,
      uuid: transaction.uuid,
      created: toDate(Number(transaction.created), "-", false, true),
      payment: transaction.payment
        ? toDate(Number(transaction.payment), "-", false, true)
        : null,
      deadline: toDate(Number(transaction.deadline), "-", false, true),
      total: transaction.total,
      status,
      credit: 0,
      service: transaction.service,
      currencycode: transaction.currency,
      meta: transaction.meta,
      type: transaction.type,
    };
  }
}

export function getInvoiceNumber(invoice) {
  if (invoice.status === "Paid") {
    return invoice.id;
  }

  return invoice.payment_invoice_id || invoice.id;
}
