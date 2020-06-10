/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, StatusBar} from 'react-native';

import {Janus} from './janus.js';
import {RTCView} from 'react-native-webrtc';

let janus;
let host = '192.168.1.78';
// let server = 'http://' + host + ':8088/janus';
let wsServer = 'ws://' + host + ':8188';

let echotest;

Janus.init({
  debug: 'all',
  callback: function () {
    if (started) return;
    started = true;
  },
});

const App = () => {
  const [state, setState] = useState({
    remoteViewSrc: null,
    remoteViewSrcKey: null,
  });

  useEffect(() => {
    janusStart();
    return () => {
      // cleanup;
    };
  }, []);

  function janusStart() {
    janus = new Janus({
      // server: server,
      server: wsServer,
      success: () => {
        janus.attach({
          plugin: 'janus.plugin.echotest',
          success: function (pluginHandle) {
            // Negotiate WebRTC
            echotest = pluginHandle;
            var body = {
              audio: true,
              video: true,
            };
            echotest.send({message: body});
            echotest.createOffer({
              // No media property provided: by default,
              // it's sendrecv for audio and video
              success: function (jsep) {
                // Got our SDP! Send our OFFER to the plugin
                echotest.send({
                  message: body,
                  jsep: jsep,
                });
              },
              error: function (error) {
                // An error occurred...
              },
              customizeSdp: function (jsep) {
                // if you want to modify the original sdp, do as the following
                // oldSdp = jsep.sdp;
                // jsep.sdp = yourNewSdp;
              },
            });
          },
          onmessage: function (msg, jsep) {
            // Handle msg, if needed, and check jsep
            if (jsep !== undefined && jsep !== null) {
              // We have the ANSWER from the plugin
              echotest.handleRemoteJsep({
                jsep: jsep,
              });
            }
          },
          onlocalstream: function (stream) {
            // This will NOT be invoked, we chose recvonly
            Janus.debug(' ::: Got a local stream :::');
            Janus.debug(stream);
            setState((preState) => ({
              ...preState,
              localViewSrc: stream.toURL(),
              localViewSrcKey: Math.floor(Math.random() * 1000),
            }));
          },
          onremotestream: function (stream) {
            // Invoked after handleRemoteJsep has got us a PeerConnection
            // This is the remote video
          },
        });
      },
      error: (error) => {
        Janus.error('  Janus Error', error);
        // Alert.alert('  Janus Error', error);
      },
      destroyed: () => {
        // Alert.alert('  Success for End Call ');
      },
    });
  }
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        {state.localViewSrc && (
          <RTCView
            key={state.localViewSrcKey}
            streamURL={state.localViewSrc}
            style={styles.localStream}
          />
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  localStream: {width: 350, height: 600},
});

export default App;
