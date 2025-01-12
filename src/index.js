import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import api from './api/api';
import * as firebase from "firebase/app";
import AuthProvider, { useAuth } from '@entur/auth-provider';

import "firebase/auth";
import "firebase/firestore";

import 'bootstrap/dist/css/bootstrap.css';
import './style/index.css';


const headers = token => ({
  headers: {
    Authorization: 'Bearer ' + token
  }
});

const TOKEN_REFRESH_RATE = 60 * 1000;

const AuthenticatedApp = ({ config }) => {
  const auth = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const authApi = config['auth-api'];

  useEffect(() => {
    const getToken = async () => {
      const token = await auth.getAccessToken();
      const authResponse = await fetch(authApi, headers(token));
      const {firebaseToken} = await authResponse.json();
      await firebase.auth().signInWithCustomToken(firebaseToken);
      setLoggedIn(true);
    }

    if (auth.isAuthenticated) {
      getToken();
    }

    const updater = setInterval(() => {
      if (auth.isAuthenticated) {
        getToken();
      }
    }, TOKEN_REFRESH_RATE);

    return () => {
      clearInterval(updater);
    }
  }, [auth, authApi]);

  return (
    <>
      {loggedIn && (
        <App firebase={firebase} auth={auth} api={api(config)}/>
      )}
   </>
  );
}

const renderApp = (config) => {
  ReactDOM.render((
    <AuthProvider
      auth0Config={{
        domain: config.auth0.domain,
        clientId: config.auth0.clientId,
        audience: config.auth0.audience,
        redirectUri: window.location.origin
      }}
      auth0ClaimsNamespace={config.auth0.claimsNamespace}
    >
      <AuthenticatedApp config={config} />
    </AuthProvider>
  ), document.getElementById('root'));
};

const init = async () => {
  const configResponse = await fetch('/config.json');
  const config = await configResponse.json();

  const firebaseConfigResponse = await fetch('/__/firebase/init.json');
  firebase.initializeApp(await firebaseConfigResponse.json());

  renderApp(config);
}

init();
