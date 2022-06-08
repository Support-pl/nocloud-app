
export default {
    state: {
        plans: {
            "uuid": "fe8bb5cc-1a14-4d51-a3e1-df0053bc72ed",
            "title": "Sample Static",
            "type": "ione",
            "public": true,
            "kind": 2,
            "products": {
                "vds_l": {
                    "kind": 2,
                    "title": "VDS L",
                    "price": 2,
                    "period": 86400,
                    "resources": {
                        "cpu": 2,
                        "ram": 4096
                    },
                    "sorter": 1
                },
                "vds_m": {
                    "kind": 2,
                    "title": "VDS M",
                    "price": 1,
                    "period": 86400,
                    "resources": {
                        "cpu": 1,
                        "ram": 2048
                    },
                    "sorter": 0
                },
             
       
                "vds_xl": {
                    "kind": 2,
                    "title": "VDS XL",
                    "price": 3,
                    "period": 86400,
                    "resources": {
                        "cpu": 4,
                        "ram": 8192
                    },
                    "sorter": 2
                }
            }
        }
    },
    mutations: {

    },
    actions: {

    },
    getters: {
        getPlans:state => state.plans
    }
}
