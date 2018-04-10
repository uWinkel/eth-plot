import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from '../reducers';
import thunk from 'redux-thunk';
var finalCreateStore = compose(applyMiddleware(thunk))(createStore);
export function configureStore(initialState) {
    return finalCreateStore(rootReducer, initialState);
}
//# sourceMappingURL=configureStore.prod.js.map