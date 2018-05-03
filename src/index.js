import conformsTo from 'lodash/conformsTo';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import invariant from 'invariant';
import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { combineReducers } from 'redux-immutable';
import { valueOrDefault, ifTrueElseDefault } from '@source4society/scepter-utility-lib';

/**
 * Validate the shape of redux store
 */
export function checkStore(store) {
  const shape = {
    dispatch: isFunction,
    subscribe: isFunction,
    getState: isFunction,
    replaceReducer: isFunction,
    runSaga: isFunction,
    injectedReducers: isObject,
    injectedSagas: isObject,
  };
  invariant(
    conformsTo(store, shape),
    '(app/utils...) injectors: Expected a valid redux store'
  );
}

/**
 * injectReducer: Dynamically injects a reducer
 *
 * @param {string} key A key of the reducer
 * @param {function} reducer A reducer that will be injected
 *
 */
export const reducerInjector = ({ key, reducer, isNamespaced = false, injectConstructReducerArgument }) => (WrappedComponent) => {
  class ReducerInjector extends React.Component {
    static WrappedComponent = WrappedComponent;

    static propTypes = { // eslint-disable-line no-undef
      reducerKey: PropTypes.string,
    }

    static displayName = `withReducer(${(WrappedComponent.displayName || WrappedComponent.name || 'Component')})`; // eslint-disable-line no-undef
    static contextTypes = { // eslint-disable-line no-undef
      store: PropTypes.object.isRequired,
    };

    componentWillMount() {
      const constructReducerArgument = valueOrDefault(injectConstructReducerArgument, constructReducerArgumentFunction);
      const { injectReducer } = this.injectors;
      injectReducer(
        ifTrueElseDefault(isNamespaced, valueOrDefault(this.props.reducerKey, key), key),
        constructReducerArgument(isNamespaced, this.props.reducerKey, key, reducer),
      );
    }

    injectors = getReducerInjectors(this.context.store); // eslint-disable-line no-undef

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  return hoistNonReactStatics(ReducerInjector, WrappedComponent);
};

export function injectReducerFactory(store, isValid) {
  return function injectReducer(key, reducer) {
    if (!isValid) checkStore(store);

    invariant(
      isString(key) && !isEmpty(key) && isFunction(reducer),
      '(app/utils...) injectReducer: Expected `reducer` to be a reducer function'
    );

    // Check `store.injectedReducers[key] === reducer` for hot reloading when a key is the same but a reducer is different
    if (Reflect.has(store.injectedReducers, key) && store.injectedReducers[key] === reducer) return;

    store.injectedReducers[key] = reducer; // eslint-disable-line no-param-reassign
    store.replaceReducer(combineReducers(store.injectedReducers));
  };
}

export function getReducerInjectors(store) {
  checkStore(store);

  return {
    injectReducer: injectReducerFactory(store, true),
  };
}

export function injectSagaFactory(store, isValid) {
  return function injectSaga(key, descriptor = {}, args) {
    if (!isValid) checkStore(store);
    const mode = valueOrDefault(descriptor.mode, RESTART_ON_REMOUNT);
    const newDescriptor = { ...descriptor, mode };
    const { saga } = newDescriptor;
    checkKey(key);
    checkDescriptor(newDescriptor);

    let hasSaga = Reflect.has(store.injectedSagas, key);
    if (process.env.NODE_ENV !== 'production') {
      const oldDescriptor = store.injectedSagas[key];
      // enable hot reloading of daemon and once-till-unmount sagas
      if (hasSaga && oldDescriptor.saga !== saga) {
        oldDescriptor.task.cancel();
        hasSaga = false;
      }
    }

    if (!hasSaga || (hasSaga && mode !== DAEMON && mode !== ONCE_TILL_UNMOUNT)) {
      store.injectedSagas[key] = { ...newDescriptor, task: store.runSaga(saga, args) }; // eslint-disable-line no-param-reassign
    }
  };
}

export function ejectSagaFactory(store, isValid) {
  return function ejectSaga(key) {
    if (!isValid) checkStore(store);

    checkKey(key);

    if (Reflect.has(store.injectedSagas, key)) {
      const descriptor = store.injectedSagas[key];
      if (descriptor.mode !== DAEMON) {
        descriptor.task.cancel();
        // Clean up in production; in development we need `descriptor.saga` for hot reloading
        if (process.env.NODE_ENV === 'production') {
          // Need some value to be able to detect `ONCE_TILL_UNMOUNT` sagas in `injectSaga`
          store.injectedSagas[key] = 'done'; // eslint-disable-line no-param-reassign
        }
      }
    }
  };
}

export function getSagaInjectors(store) {
  checkStore(store);

  return {
    injectSaga: injectSagaFactory(store, true),
    ejectSaga: ejectSagaFactory(store, true),
  };
}

const checkKey = (key) => invariant(
  isString(key) && !isEmpty(key),
  '(app/utils...) injectSaga: Expected `key` to be a non empty string'
);

const checkDescriptor = (descriptor) => {
  const shape = {
    saga: isFunction,
    mode: (mode) => isString(mode) && allowedModes.includes(mode),
  };
  invariant(
    conformsTo(descriptor, shape),
    '(app/utils...) injectSaga: Expected a valid saga descriptor'
  );
};

/**
 * injectSaga: Dynamically injects a saga, passes component's props as saga arguments
 *
 * @param {string} key A key of the saga
 * @param {function} saga A root saga that will be injected
 * @param {string} [mode] By default (constants.RESTART_ON_REMOUNT) the saga will be started on component mount and
 * cancelled with `task.cancel()` on component un-mount for improved performance. Another two options:
 *   - constants.DAEMON—starts the saga on component mount and never cancels it or starts again,
 *   - constants.ONCE_TILL_UNMOUNT—behaves like 'RESTART_ON_REMOUNT' but never runs it again.
 *
 */
export const sagaInjector = ({ key, saga, mode }) => (WrappedComponent) => {
  class InjectSaga extends React.Component {   // eslint-disable-line react/no-multi-comp
    static WrappedComponent = WrappedComponent;
    static contextTypes = { // eslint-disable-line no-undef
      store: PropTypes.object.isRequired,
    };
    static displayName = `withSaga(${(WrappedComponent.displayName || WrappedComponent.name || 'Component')})`; // eslint-disable-line no-undef

    componentWillMount() {
      const { injectSaga } = this.injectors;
      injectSaga(key, { saga, mode }, this.props);
    }

    componentWillUnmount() {
      const { ejectSaga } = this.injectors;

      ejectSaga(key);
    }

    injectors = getSagaInjectors(this.context.store); // eslint-disable-line no-undef

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  return hoistNonReactStatics(InjectSaga, WrappedComponent);
};

export const constructReducerArgumentFunction = (isNamespaced, reducerKey, key, reducer) => isNamespaced ? reducer(valueOrDefault(reducerKey, key)) : reducer;

export const RESTART_ON_REMOUNT = '@@saga-injector/restart-on-remount';
export const DAEMON = '@@saga-injector/daemon';
export const ONCE_TILL_UNMOUNT = '@@saga-injector/once-till-unmount';

const allowedModes = [RESTART_ON_REMOUNT, DAEMON, ONCE_TILL_UNMOUNT];
