import auth from './nocloud/auth.js'
import sp from './nocloud/sp.js'
import vms from './nocloud/vms.js'
import plans from './nocloud/plans.js'
import namespaces from './nocloud/namespaces.js'
import accounts from './nocloud/accounts'

export default {
    namespaced: true,
    modules:{
        auth,
        sp,
        vms,
        plans,
        namespaces,
        accounts
    }
}