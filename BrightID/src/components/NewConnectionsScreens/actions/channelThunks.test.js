import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  addChannel,
  setMyChannel,
  updateChannel,
  closeChannel,
  channel_types,
  channel_states,
} from '@/components/NewConnectionsScreens/channelSlice';
import reducer from '@/reducer';
import {
  createChannel,
  joinChannel,
  leaveChannel,
} from '@/components/NewConnectionsScreens/actions/channelThunks';
import { CHANNEL_TTL, MIN_CHANNEL_JOIN_TTL } from '@/utils/constants';

const middlewares = [thunk];
const createMockStore = configureMockStore(middlewares);
const createState = (initialState) => (actions) =>
  actions.reduce(reducer, initialState);

describe('create channel', () => {
  let store;

  beforeEach(() => {
    fetch.resetMocks();
    const initialState = {
      channels: {
        ids: [],
        entities: {},
        myChannelId: '',
      },
    };
    store = createMockStore(createState(initialState));
  });

  test('create and leave a GROUP channel ', async () => {
    await store.dispatch(createChannel(channel_types.GROUP));

    // addChannel
    expect(store.getActions()[0]).toMatchObject({
      type: addChannel.type,
      payload: {
        aesKey: expect.any(String),
        id: expect.any(String),
        initiatorProfileId: expect.any(String),
        ipAddress: expect.any(String),
        myProfileId: expect.any(String),
        state: expect.any(String),
        timestamp: expect.any(Number),
        ttl: expect.any(Number),
        type: channel_types.GROUP,
      },
    });
    // extract created channelId
    const channelId = store.getActions()[0].payload.id;

    // MyChannel set?
    expect(store.getActions()[1]).toMatchObject({
      type: setMyChannel.type,
      payload: channelId,
    });

    // polltimer set?
    expect(store.getActions()[2]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channelId,
        changes: {
          pollTimerId: expect.anything(), // can't check for "number" as Timeout in node.js env is an Object
        },
      },
    });

    // leave channel
    await store.dispatch(leaveChannel(channelId));

    // polltimer cleared?
    expect(store.getActions()[3]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channelId,
        changes: {
          pollTimerId: 0,
        },
      },
    });

    // channel closed?
    expect(store.getActions()[4]).toMatchObject({
      type: closeChannel.type,
      payload: channelId,
    });
  });

  test('create and leave a SINGLE channel ', async () => {
    await store.dispatch(createChannel(channel_types.SINGLE));

    // addChannel
    expect(store.getActions()[0]).toMatchObject({
      type: addChannel.type,
      payload: {
        aesKey: expect.any(String),
        id: expect.any(String),
        initiatorProfileId: expect.any(String),
        ipAddress: expect.any(String),
        myProfileId: expect.any(String),
        state: expect.any(String),
        timestamp: expect.any(Number),
        ttl: expect.any(Number),
        type: channel_types.SINGLE,
      },
    });
    // extract created channelId
    const channelId = store.getActions()[0].payload.id;

    // MyChannel set?
    expect(store.getActions()[1]).toMatchObject({
      type: setMyChannel.type,
      payload: channelId,
    });

    // polltimer set?
    expect(store.getActions()[2]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channelId,
        changes: {
          pollTimerId: expect.anything(), // can't check for "number" as Timeout in node.js env is an Object
        },
      },
    });

    // leave channel
    await store.dispatch(leaveChannel(channelId));

    // polltimer cleared?
    expect(store.getActions()[3]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channelId,
        changes: {
          pollTimerId: 0,
        },
      },
    });

    // channel closed?
    expect(store.getActions()[4]).toMatchObject({
      type: closeChannel.type,
      payload: channelId,
    });
  });
});

describe('join channel', () => {
  let store;

  beforeEach(() => {
    fetch.resetMocks();
    const initialState = {
      channels: {
        ids: [],
        entities: {},
        myChannelId: '',
      },
    };
    store = createMockStore(createState(initialState));
  });

  test('join and leave a channel without profiles', async () => {
    // define channel to join
    const channel = {
      id: 'joinChannelID',
      initiatorProfileId: 'initatorProfileId',
      myProfileId: 'myProfileId',
      ipAddress: '127.0.0.1',
      aesKey: 'aeskey',
      timestamp: Date.now() - 30000, // channel created 30 seconds ago
      ttl: CHANNEL_TTL,
      type: channel_types.GROUP,
      state: channel_states.OPEN,
    };

    // prepare profile list response
    fetch.mockResponse((req) => {
      if (req.url.endsWith(`/list/${channel.id}`)) {
        return Promise.resolve(JSON.stringify({ profileIds: [] }));
      } else {
        return Promise.resolve('ok');
      }
    });

    await store.dispatch(joinChannel(channel));

    // addChannel?
    expect(store.getActions()[0]).toMatchObject({
      type: addChannel.type,
      payload: {
        aesKey: channel.aesKey,
        id: channel.id,
        initiatorProfileId: channel.initiatorProfileId,
        ipAddress: channel.ipAddress,
        myProfileId: channel.myProfileId,
        state: channel.state,
        timestamp: channel.timestamp,
        ttl: channel.ttl,
        type: channel.type,
      },
    });

    // polltimer set?
    expect(store.getActions()[1]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channel.id,
        changes: {
          pollTimerId: expect.anything(), // can't check for "number" as Timeout in node.js env is an Object
        },
      },
    });

    // leave channel
    await store.dispatch(leaveChannel(channel.id));

    // polltimer cleared?
    expect(store.getActions()[3]).toMatchObject({
      type: updateChannel.type,
      payload: {
        id: channel.id,
        changes: {
          pollTimerId: 0,
        },
      },
    });

    // channel closed?
    expect(store.getActions()[4]).toMatchObject({
      type: closeChannel.type,
      payload: channel.id,
    });
  });

  test('dont join channel that is expired', async () => {
    // define channel to join
    const channel = {
      id: 'joinChannelID',
      initiatorProfileId: 'initatorProfileId',
      myProfileId: 'myProfileId',
      ipAddress: '127.0.0.1',
      aesKey: 'aeskey',
      timestamp: Date.now() - 1200000, // channel created 20 minutes ago
      ttl: CHANNEL_TTL,
      type: channel_types.GROUP,
      state: channel_states.OPEN,
    };

    await store.dispatch(joinChannel(channel));

    // no action should be dispatched
    expect(store.getActions()).toHaveLength(0);
  });

  test('dont join channel that will expire soon', async () => {
    // define channel to join
    const channel = {
      id: 'joinChannelID',
      initiatorProfileId: 'initatorProfileId',
      myProfileId: 'myProfileId',
      ipAddress: '127.0.0.1',
      aesKey: 'aeskey',
      // create a timestamp that is 0.5 seconds older than allowed
      timestamp: Date.now() - CHANNEL_TTL + MIN_CHANNEL_JOIN_TTL - 500,
      ttl: CHANNEL_TTL,
      type: channel_types.GROUP,
      state: channel_states.OPEN,
    };

    await store.dispatch(joinChannel(channel));

    // no action should be dispatched
    expect(store.getActions()).toHaveLength(0);
  });

  test('Limit excessive TTL when joining a channel', async () => {
    // define channel to join
    const channel = {
      id: 'joinChannelID',
      initiatorProfileId: 'initatorProfileId',
      myProfileId: 'myProfileId',
      ipAddress: '127.0.0.1',
      aesKey: 'aeskey',
      timestamp: Date.now() - 60000, // channel created 1 minutes ago
      ttl: 2 * CHANNEL_TTL, // channel claims to have a ttl that is longer than CHANNEL_TTL constant
      type: channel_types.GROUP,
      state: channel_states.OPEN,
    };

    await store.dispatch(joinChannel(channel));

    // addChannel should be called with ttl reduced to be CHANNEL_TTL
    expect(store.getActions()[0]).toMatchObject({
      type: addChannel.type,
      payload: {
        ttl: CHANNEL_TTL,
      },
    });

    // leave channel
    await store.dispatch(leaveChannel(channel.id));
  });
});
