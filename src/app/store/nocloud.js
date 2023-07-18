import auth from './nocloud/auth.js'
import sp from './nocloud/sp.js'
import vms from './nocloud/vms.js'
import plans from './nocloud/plans.js'
import namespaces from './nocloud/namespaces.js'
import accounts from './nocloud/accounts'
import transactions from './nocloud/transactions'
import app from './nocloud/app'

export default {
    namespaced: true,
    modules:{
        auth,
        sp,
        vms,
        plans,
        namespaces,
        accounts,
        transactions,
        app
    }
}