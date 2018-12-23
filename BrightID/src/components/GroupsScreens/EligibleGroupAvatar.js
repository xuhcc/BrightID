// @flow

import * as React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { without } from 'ramda';
import { uInt8ArrayToUrlSafeB64 } from '../../utils/encoding';

/**
 * Avatar Picture displayed on the HomeScreen
 * The Image is sourced from the main reducer as avatar
 * @prop avatar a raw image string
 * TODO store the image locally using asyncStorage
 * or any local db easy to use with React-native
 */

type Props = {
  avatar: string,
  names: [string],
};

class EligibleGroupAvatar extends React.Component<Props> {
  state = {
    avatarSrc: [],
  };

  componentDidMount() {
    this.retreiveAvatars();
  }

  retreiveAvatars() {
    const { group, connections } = this.props;
    const { knownMembers, founders } = group;
    const findConnection = (publicKey) =>
      connections.find(
        (connection) =>
          uInt8ArrayToUrlSafeB64(connection.publicKey) === publicKey,
      ) || { avatar: { uri: '' } };
    const avatarSrc = knownMembers.map((publicKey) => {
      const { avatar } = findConnection(publicKey);
      return { avatar, faded: false };
    });
    without(knownMembers, founders).forEach((publicKey) => {
      const { avatar } = findConnection(publicKey);
      avatarSrc.push({ avatar, faded: true });
    });
    console.log(avatarSrc);
    // this.setState({ avatarSrc });
  }

  render() {
    const { avatar, group } = this.props;
    const { avatarSrc } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.topAvatars}>
          {!!avatarSrc[0] && (
            <Image
              source={avatar || require('../../static/default_avatar.jpg')}
              style={[styles.avatar]}
            />
          )}
        </View>
        <View style={styles.bottomAvatars}>
          {!!avatarSrc[1] && (
            <Image
              source={avatar || require('../../static/default_avatar.jpg')}
              style={[styles.avatar, true ? styles.faded : '']}
            />
          )}
          {!!avatarSrc[2] && (
            <Image
              source={avatar || require('../../static/default_avatar.jpg')}
              style={[styles.avatar, true ? styles.faded : '']}
            />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: 85,
  },
  avatar: {
    borderRadius: 20,
    width: 40,
    height: 40,
    backgroundColor: '#d8d8d8',
  },
  faded: {
    opacity: 0.25,
  },
  topAvatars: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: -3.3,
  },
  bottomAvatars: {
    marginTop: -3.3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default connect((state) => state.main)(EligibleGroupAvatar);
