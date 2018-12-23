// @flow

import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { connect } from 'react-redux';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GroupAvatar from './EligibleGroupAvatar';
import { uInt8ArrayToUrlSafeB64 } from '../../utils/encoding';
import { deleteNewGroup, joinToGroup } from './actions';

/**
 * Connection Card in the Connections Screen
 * is created from an array of connections
 * each connection should have:
 * @prop name
 * @prop trustScore
 */

type Props = {
  names: Array<string>,
  groupId: string,
  isNew: boolean,
  alreadyIn: boolean,
  trustScore: string,
};

class EligibleGroupCard extends React.Component<Props> {
  renderApprovalButtons = () => (
    <View style={styles.approvalButtonContainer}>
      <TouchableOpacity
        style={styles.moreIcon}
        onPress={() => this.deleteThisGroup()}
      >
        <AntDesign size={30} name="closecircleo" color="#000" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.moreIcon}
        onPress={() => this.joinThisGroup()}
      >
        <AntDesign size={30} name="checkcircleo" color="#000" />
      </TouchableOpacity>
    </View>
  );

  renderReviewButton = () => (
    <TouchableOpacity style={styles.reviewButton}>
      <Text style={styles.reviewButtonText}>Awaiting co-</Text>
      <Text style={styles.reviewButtonText}>founders</Text>
    </TouchableOpacity>
  );

  trustScoreColor = () => {
    const { group } = this.props;
    if (parseFloat(group.score) >= 85) {
      return { color: '#139c60' };
    } else {
      return { color: '#e39f2f' };
    }
  };

  deleteThisGroup = () => {
    Alert.alert(
      'WARNING',
      'Are you sure to delete this group?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Sure',
          onPress: async () => {
            try {
              let result = await this.props.dispatch(
                deleteNewGroup(this.props.groupId),
              );
              alert(
                result.success
                  ? 'Group deleted successfully'
                  : JSON.stringify(result, null, 4),
              );
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  joinThisGroup = () => {
    Alert.alert(
      'ATTENTION',
      'Are you sure to join to this group?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Sure',
          onPress: async () => {
            try {
              let result = await this.props.dispatch(
                joinToGroup(this.props.groupId),
              );
              alert(
                result.success
                  ? 'You joined to the group successfully'
                  : JSON.stringify(result, null, 4),
              );
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  mapPublicKeysToNames() {
    let { connections, nameornym, group } = this.props;
    console.log(connections);
    let user = uInt8ArrayToUrlSafeB64(this.props.publicKey);
    const findConnection = (publicKey) =>
      connections.find(
        (connection) =>
          uInt8ArrayToUrlSafeB64(connection.publicKey) === publicKey,
      ) || { nameornym: 'Stranger' };
    return group.founders.map((publicKey) =>
      publicKey === user ? nameornym : findConnection(publicKey).nameornym,
    );
  }

  names() {
    const { group } = this.props;
    this.mapPublicKeysToNames(group.knownMembers);
  }

  alreadyIn() {
    const { group, publicKey } = this.props;
    return group.knownMembers.indexOf(uInt8ArrayToUrlSafeB64(publicKey)) >= 0;
  }

  render() {
    const { group } = this.props;
    const names = this.mapPublicKeysToNames();
    console.log(group);
    return (
      <View style={styles.container}>
        <GroupAvatar group={group} />
        <View style={styles.info}>
          <Text style={styles.names}>{names.join(', ')}</Text>
          <View style={styles.trustScoreContainer}>
            <Text style={styles.trustScoreLeft}>Score:</Text>
            <Text style={[styles.trustScoreRight, this.trustScoreColor()]}>
              {group.score}
            </Text>
          </View>
        </View>
        {!this.alreadyIn()
          ? this.renderApprovalButtons()
          : this.renderReviewButton()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#fff',
    height: 90,
    borderTopColor: '#e3e0e4',
    borderTopWidth: 1,
  },
  info: {
    marginLeft: 25,
    flex: 1,
    height: 71,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  names: {
    fontFamily: 'ApexNew-Book',
    fontSize: 20,
    shadowColor: 'rgba(0,0,0,0.32)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  trustScoreLeft: {
    fontFamily: 'ApexNew-Book',
    fontSize: 14,
    color: '#9b9b9b',
    marginRight: 3,
    paddingTop: 1.5,
  },
  trustScoreRight: {
    fontFamily: 'ApexNew-Medium',
    fontSize: 16,
  },
  moreIcon: {
    marginRight: 8,
  },
  approvalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  reviewButton: {
    width: 89,
    height: 43,
    borderRadius: 3,
    backgroundColor: '#f8f8ba',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewButtonText: {
    fontFamily: 'ApexNew-Medium',
    fontSize: 14,
    // fontWeight: '500',
    color: '#b9b75c',
  },
});

export default connect(({ main }) => main)(EligibleGroupCard);
