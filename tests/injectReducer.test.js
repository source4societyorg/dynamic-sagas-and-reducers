/**
 * Test injectors
 */

import { memoryHistory } from 'react-router-dom';
import { shallow } from 'enzyme';
import React from 'react';
import { configureStore } from '@source4society/scepter-app-utilities';
import { reducerInjector, constructReducerArgumentFunction } from '../src/index';

// Fixtures
const Component = () => null;

const reducer = () => ({ route: 'someroute', test: 'test' });

describe('injectReducer decorator', () => {
  let store;
  let ComponentWithReducer;

  it('should set a correct display name', () => {
    ComponentWithReducer = reducerInjector({ key: 'test', reducer })(Component);
    expect(ComponentWithReducer.displayName).toBe('withReducer(Component)');
    expect(reducerInjector({ key: 'test', reducer })(() => null).displayName).toBe('withReducer(Component)');
  });

  it('should propagate props', () => {
    const props = { testProp: 'test' };
    ComponentWithReducer = reducerInjector({ key: 'test', reducer })(Component);
    store = configureStore({}, memoryHistory);
    const renderedComponent = shallow(<ComponentWithReducer {...props} />, { context: { store } });
    expect(renderedComponent.prop('testProp')).toBe('test');
  });
});

describe('constructReducerArgument function', () => {
  it('should return either the reducer, or the reducer with namespaced reducer key if a reducer key is provided', () => {
    const mockReducerKey = 'mockReducerKey';
    const mockKey = 'mockKey';
    const mockReducer = { hasProperties: 'mockReducer' };
    const mockNamespacedReducer = (reducerKey) => {
      expect(reducerKey).toEqual(mockReducerKey);
      return mockReducer;
    };

    expect(constructReducerArgumentFunction(true, mockReducerKey, mockKey, mockNamespacedReducer)).toEqual(mockReducer);
    expect(constructReducerArgumentFunction(false, mockReducerKey, mockKey, mockReducer)).toEqual(mockReducer);
  });
});
