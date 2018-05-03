# dynamic-sagas-and-reducers
Allows you to follow the pattern laid out in react-boilerplate for the dynamic injection of sagas and reducers with good separation of concerns

[![scepter-logo](http://res.cloudinary.com/source-4-society/image/upload/v1519221119/scepter_hzpcqt.png)](https://github.com/source4societyorg/SCEPTER-core)

[![redux-logo](https://raw.githubusercontent.com/reactjs/redux/master/logo/logo-title-dark.png)](https://github.com/reactjs/redux)

[![react-boilerplate](https://github.com/react-boilerplate/brand/blob/master/assets/logo.png)](https://gihub.com/react-boilerplate)

[![airbnb-codestyle](https://camo.githubusercontent.com/1c5c800fbdabc79cfaca8c90dd47022a5b5c7486/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f636f64652532307374796c652d616972626e622d627269676874677265656e2e7376673f7374796c653d666c61742d737175617265)](https://github.com/airbnb/javascript)

[![Build Status](https://travis-ci.org/source4societyorg/dynamic-sagas-and-reducers.svg?branch=master)](https://travis-ci.org/source4societyorg/dynamic-sagas-and-reducers)

[![codecov](https://codecov.io/gh/source4societyorg/dynamic-sagas-and-reducers/branch/master/graph/badge.svg)](https://codecov.io/gh/source4societyorg/dynamic-sagas-and-reducers)

# Usage

# reducerInjector

Import { reducerInjector }. It takes an object containing the following parameters: { key: <string>, reducer, isNamespaced: <bool> }.
`reducer` is a `redux` style reducer function. The key should be unique in the store, unless isNamespaced is used. This will hook up the reducer dynamically

# Namespacing

When using `isNamespaced` you must wrap your reducer in a lambda as follows in the class definition: `(namespace) => <reducer function>`. The namespace property will be present in the action and you should confirm the namespace matches what you are expecting. This is useful if you have many components of the same type but do not want to subscribe to the same type of events. See the source code for more information on how to build proper namespaced selectors. 

# sagaInjector

Import { sagaInjector }. It takes an object containing the following parameters: { key <string>, saga }. `saga` is a property defined generator function that will subscribe to events. See `redux-saga` documentation for more information.

# Installation

  npm install @source4society/dynamic-sagas-and-reducers

or

  yarn install @source4society/dynamic-sagas-and-reducers

