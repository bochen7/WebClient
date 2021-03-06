/* @ngInject */
function attachSignupSubscription(dispatchers, signupModel, authentication, eventManager, notification, Payment) {
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type, data = {}) => dispatcher.signup(type, data);
    const processPlan = async () => {
        const { Name, Amount, Currency, Cycle, ID } = signupModel.get('temp.plan') || {};

        // if the user subscribed to a plan during the signup process
        if (['plus', 'visionary'].includes(Name) && Amount === authentication.user.Credit) {
            const subscribe = () => {
                return Payment.subscribe({ Amount: 0, Currency, Cycle, PlanIDs: { [ID]: 1 } });
            };

            return subscribe().then(eventManager.call);
        }
    };

    const processPaymentMethod = async () => {
        const method = signupModel.get('temp.method') || {};
        // We save the payment method used during the subscription
        if (method.Type === 'card') {
            return Payment.updateMethod(method);
        }
    };

    return () => {
        Promise.all([processPlan(), processPaymentMethod()])
            .then(() => {
                if (signupModel.get()) {
                    dispatch('user.subscription.finished', { plan: signupModel.get('temp.plan') });
                }
            })
            .then(() => signupModel.clear())
            .catch(() => {
                signupModel.clear();
            });
    };
}
export default attachSignupSubscription;
