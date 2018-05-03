/**
 * Test injectors
 */

import { memoryHistory } from 'react-router-dom';
import { put } from 'redux-saga/effects';
import { shallow } from 'enzyme';
import React from 'react';
import { configureStore } from '@source4society/scepter-app-utilities';
import { sagaInjector, ONCE_TILL_UNMOUNT } from '../src/index';

// Fixtures
const Component = () => null;

function* testSaga() {
  yield put({ type: 'TEST', payload: 'yup' });
}

describe('injectSaga decorator', () => {
  let store;
  let ComponentWithSaga;

  it('should set a correct display name', () => {
    ComponentWithSaga = sagaInjector({ key: 'test', saga: testSaga, mode: ONCE_TILL_UNMOUNT })(Component);
    expect(ComponentWithSaga.displayName).toBe('withSaga(Component)');
    expect(sagaInjector({ key: 'test', saga: testSaga })(() => null).displayName).toBe('withSaga(Component)');
  });

  it('should propagate props', () => {
    const props = { testProp: 'test' };
    store = configureStore({}, memoryHistory);
    ComponentWithSaga = sagaInjector({ key: 'test', saga: testSaga, mode: ONCE_TILL_UNMOUNT })(Component);
    const renderedComponent = shallow(<ComponentWithSaga {...props} />, { context: { store } });
    expect(renderedComponent.prop('testProp')).toBe('test');
  });

  it('should call eject on unmount', () => {
    const props = { testProp: 'test' };
    store = configureStore({}, memoryHistory);
    ComponentWithSaga = sagaInjector({ key: 'test', saga: testSaga, mode: ONCE_TILL_UNMOUNT })(Component);
    const renderedComponent = shallow(<ComponentWithSaga {...props} />, { context: { store } });
    renderedComponent.unmount();
  });
});
