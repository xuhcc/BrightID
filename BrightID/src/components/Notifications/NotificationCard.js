// @flow

import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { DEVICE_TYPE } from '@/utils/constants';

/**
 * Notification Card in the Notifications Screen
 * each Notification should have:
 * @prop msg
 * @prop icon
 */

class NotificationCard extends React.Component<Props> {
  render() {
    const { navigation, msg, icon } = this.props;

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          navigation.navigate('TrustedConnections');
        }}
      >
        <Ionicon size={32} style={styles.itemIcon} name={icon} color="#ccc" />
        <Text style={styles.msg}>{msg}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderBottomColor: '#e3e0e4',
    borderBottomWidth: 1,
    height: DEVICE_TYPE === 'large' ? 94 : 80,
    marginBottom: DEVICE_TYPE === 'large' ? 7 : 3,
  },
  msg: {
    fontFamily: 'ApexNew-Book',
    color: 'black',
    fontSize: 18,
    marginLeft: 18,
    marginRight: 18,
  },
  itemIcon: {
    marginLeft: 16,
  },
});

export default connect()(NotificationCard);
